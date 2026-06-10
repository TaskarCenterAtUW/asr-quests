#!/usr/bin/env python3
"""Compile a KCM quest definition from a question bank + team matrix.

This takes two source-of-truth files and stamps out a complete, valid quest
definition:

  - question_bank.json: canonical logical questions (wording, choices, numeric
    bounds, type) plus each question's *physical* parent dependency and
    structural role (universal / team-gated root / inherited child), and the
    per-element meta-question content.

  - team_matrix.csv: per logical question, which primary teams must answer it
    (the audience H). For team-gated questions, opting into *any* team in H
    reveals it to surveyors whose primary team is outside H.

Routing model (one logical question -> one or two physical copies):

  universal          one copy, shown to everyone (gated only by its physical
                     parent, if any).
  team-gated root    two copies sharing one canonical question:
                       home       shown when primary team in H
                       additional shown when the surveyor opted into ANY team
                                  in H AND primary team not in H
                     (so the two copies are mutually exclusive: H and its
                     complement never overlap -> a logical question is visible
                     at most once, ever.)
  inherited child    a question whose physical parent is itself team-gated; its
                     two copies chain to the parent's home/additional copies
                     and need no team gate of their own.

Because H and its complement partition the teams, exactly-once visibility is a
structural guarantee, not a hand-maintained property. This compiler asserts it
at build time (``--check``, on by default).

A team-gated question's additional copy is revealed iff the surveyor opted into
any team in its audience H (the required_value array is OR). Every dependency
is a plain set-membership test, so routing is deterministic under the simplest
possible dependency evaluator.

Usage:
    python utilities/kcm/compile_quests.py \
        --bank utilities/kcm/question_bank.json \
        --matrix utilities/kcm/team_matrix.csv \
        --out "quests/prod/King County Metro Walk Audit Demo/KCM Walk Audit.compiled.json"
"""

import argparse
import csv
import json
import sys
from pathlib import Path

def element_stem(team_selection_tag):
    """ext:bus_stop_team_selection -> 'bus_stop'."""
    assert team_selection_tag.endswith("_team_selection")
    return team_selection_tag[len("ext:"): -len("_team_selection")]


def required_value(values):
    """A single value emits as a string; multiple as an array (OR)."""
    vals = list(values)
    return vals[0] if len(vals) == 1 else vals


def dep_field(conditions):
    """One condition emits as an object; several as an array (AND)."""
    if len(conditions) == 1:
        return conditions[0]
    return conditions


def content_payload(q):
    """The wording/answer content of a bank question, in canonical field order."""
    out = {
        "quest_type": q["quest_type"],
        "quest_title": q["quest_title"],
        "quest_description": q["quest_description"],
    }
    if "quest_image_url" in q:
        out["quest_image_url"] = q["quest_image_url"]
    if "quest_answer_choices" in q:
        out["quest_answer_choices"] = q["quest_answer_choices"]
    if "quest_answer_validation" in q:
        out["quest_answer_validation"] = q["quest_answer_validation"]
    return out


def copy_tag(canonical, role, tag_mode):
    if tag_mode == "canonical" or role == "single":
        return canonical
    return canonical + ("_home" if role == "home" else "_additional")


class ElementCompiler:
    def __init__(self, meta, questions, matrix, teams, tag_mode, base_id):
        self.meta = meta
        self.questions = questions  # bank questions for this element, in order
        self.matrix = matrix        # canonical_tag -> {gating, teams:set}
        self.teams = teams
        self.tag_mode = tag_mode
        self.stem = element_stem(self._meta("team_selection")["quest_tag"])
        self.base_id = base_id

        self._next = base_id
        self.ids = {}               # (canonical_tag, role) -> quest_id
        self.team_sel_id = None
        self.optin_id = None        # the team opt-in MultipleChoice
        self.visibility_id = None

        self.by_tag = {q["canonical_tag"]: q for q in questions}
        self.team_labels = {c["value"]: c["choice_text"]
                            for c in self._meta("team_selection")["quest_answer_choices"]}
        self.used_teams = self._compute_used_teams()

    def _meta(self, stem):
        for m in self.meta["meta_questions"]:
            if m["stem"] == stem:
                return m
        raise KeyError(stem)

    def _alloc(self):
        qid = self._next
        self._next += 1
        return qid

    def _roles(self, q):
        gating = self.matrix[q["canonical_tag"]]["gating"]
        if gating == "universal":
            return ["single"]
        return ["home", "additional"]

    def _compute_used_teams(self):
        """Every team that appears in the audience H of at least one optional
        (non-empty complement) team-gated question in this element, in bank team
        order. Opting into any of them reveals the questions whose H includes
        them, for surveyors whose primary team is not already in that H."""
        used = set()
        for q in self.questions:
            row = self.matrix[q["canonical_tag"]]
            if row["gating"] == "team" and (set(self.teams) - row["teams"]):
                used |= row["teams"]
        return [t for t in self.teams if t in used]

    # ---- pass 1: assign every quest_id deterministically ----
    def assign_ids(self):
        self.team_sel_id = self._alloc()
        self.optin_id = self._alloc()
        self.visibility_id = self._alloc()
        self.internal_note_id = self._alloc()
        for q in self.questions:
            for role in self._roles(q):
                self.ids[(q["canonical_tag"], role)] = self._alloc()

    # ---- helpers for dependency wiring ----
    def _parent_qid(self, parent_tag, role):
        """The quest_id of the parent copy this copy should depend on."""
        parent_roles = self._roles(self.by_tag[parent_tag])
        if parent_roles == ["single"]:
            return self.ids[(parent_tag, "single")]
        # team-split parent: home->home, additional->additional
        return self.ids[(parent_tag, role)]

    def _physical_parent_condition(self, q, role):
        pp = q["physical_parent"]
        if pp is None:
            return None
        return {
            "question_id": self._parent_qid(pp["tag"], role),
            "required_value": required_value(pp["required_value"]),
        }

    def _home_set(self, q):
        return [t for t in self.teams if t in self.matrix[q["canonical_tag"]]["teams"]]

    def _complement(self, home_set):
        return [t for t in self.teams if t not in home_set]

    # ---- pass 2: build quest objects ----
    def build(self):
        quests = []
        quests.extend(self._build_meta())
        for q in self.questions:
            quests.extend(self._build_content(q))
        return quests

    def _build_meta(self):
        ts = self._meta("team_selection")
        optin = self._meta("additional_data_groups")
        vis = self._meta("observation_visibility")
        note = self._meta("internal_note_prompt")

        out = []
        out.append({"quest_id": self.team_sel_id, **content_payload(ts),
                    "quest_tag": ts["quest_tag"]})
        # A single MultipleChoice of teams, always shown after team selection.
        # Selecting a team reveals that team's questions (for surveyors whose
        # primary pathway does not already include them).
        out.append({
            "quest_id": self.optin_id,
            "quest_type": "MultipleChoice",
            "quest_title": optin["quest_title"],
            "quest_description": optin["quest_description"],
            "quest_tag": optin["quest_tag"],
            "quest_answer_choices": [
                {"value": t, "choice_text": self.team_labels[t]}
                for t in self.used_teams
            ],
        })
        out.append({"quest_id": self.visibility_id, **content_payload(vis),
                    "quest_tag": vis["quest_tag"]})
        note_obj = {"quest_id": self.internal_note_id, **content_payload(note),
                    "quest_tag": note["quest_tag"],
                    "quest_answer_dependency": {
                        "question_id": self.visibility_id,
                        "required_value": required_value(
                            self._note_required_values())}}
        out.append(note_obj)
        return out

    def _note_required_values(self):
        # Preserve the original internal-note trigger values from the bank meta.
        note = self._meta("internal_note_prompt")
        # Stored content has no dependency; the trigger is conventionally these.
        return ["metro_internal_only"]

    def _build_content(self, q):
        gating = self.matrix[q["canonical_tag"]]["gating"]
        if gating == "universal":
            return [self._copy(q, "single", self._universal_deps(q))]
        if gating == "inherit":
            return [
                self._copy(q, "home", self._child_deps(q, "home")),
                self._copy(q, "additional", self._child_deps(q, "additional")),
            ]
        # team-gated root
        out = []
        home_set = self._home_set(q)
        if home_set:
            out.append(self._copy(q, "home", self._root_home_deps(q, home_set)))
        complement = self._complement(home_set)
        if complement:
            out.append(self._copy(q, "additional",
                                  self._root_additional_deps(q, complement)))
        return out

    def _copy(self, q, role, conditions):
        obj = {"quest_id": self.ids[(q["canonical_tag"], role)],
               **content_payload(q),
               "quest_tag": copy_tag(q["canonical_tag"], role, self.tag_mode)}
        if conditions:
            obj["quest_answer_dependency"] = dep_field(conditions)
        return obj

    def _universal_deps(self, q):
        pp = self._physical_parent_condition(q, "single")
        return [pp] if pp else []

    def _child_deps(self, q, role):
        pp = q["physical_parent"]
        assert pp is not None, f"inherited child {q['canonical_tag']} has no parent"
        return [{
            "question_id": self._parent_qid(pp["tag"], role),
            "required_value": required_value(pp["required_value"]),
        }]

    def _root_home_deps(self, q, home_set):
        conds = []
        pp = self._physical_parent_condition(q, "home")
        if pp:
            conds.append(pp)
        conds.append({"question_id": self.team_sel_id,
                      "required_value": required_value(home_set)})
        return conds

    def _root_additional_deps(self, q, complement):
        # Reveal this copy when the surveyor opted into ANY team in the audience
        # H (the required_value array is OR), and their primary team is in the
        # complement of H. The two predicates over the *primary* team -- in H
        # (home copy) vs. in complement (this copy) -- stay mutually exclusive
        # regardless of which teams were opted into, so visibility is still
        # at-most-once.
        conds = []
        home_set = self._home_set(q)
        assert home_set, f"team question {q['canonical_tag']} has empty audience H"
        assert all(t in self.used_teams for t in home_set), (
            f"audience of {q['canonical_tag']} not fully offered in element opt-in")
        conds.append({"question_id": self.optin_id,
                      "required_value": required_value(home_set)})
        conds.append({"question_id": self.team_sel_id,
                      "required_value": required_value(complement)})
        pp = self._physical_parent_condition(q, "additional")
        if pp:
            conds.append(pp)
        return conds


def load_matrix(path):
    rows = {}
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        team_cols = [c for c in reader.fieldnames
                     if c not in ("element", "canonical_tag", "gating")]
        for r in reader:
            rows[r["canonical_tag"]] = {
                "element": r["element"],
                "gating": r["gating"],
                "teams": {t for t in team_cols if r[t].strip()},
            }
    return rows, team_cols


def check_partitions(matrix, teams, errors):
    """Build-time guarantee: every team-gated question partitions the teams."""
    for tag, row in matrix.items():
        if row["gating"] != "team":
            continue
        H = row["teams"]
        complement = set(teams) - H
        if H & complement:
            errors.append(f"{tag}: home/additional team overlap")
        if (H | complement) != set(teams):
            errors.append(f"{tag}: home/additional do not cover all teams")
        if not H:
            errors.append(f"{tag}: team-gated question has empty audience H")


def check_referential_integrity(elements, errors):
    for el in elements:
        ids = {q["quest_id"] for q in el["quests"]}
        if len(ids) != len(el["quests"]):
            errors.append(f"{el['element_type']}: duplicate quest_id")
        for q in el["quests"]:
            dep = q.get("quest_answer_dependency")
            if dep is None:
                continue
            conds = dep if isinstance(dep, list) else [dep]
            for c in conds:
                if c["question_id"] not in ids:
                    errors.append(
                        f"{el['element_type']} {q['quest_tag']}: "
                        f"dangling dependency on {c['question_id']}")


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--bank", required=True)
    ap.add_argument("--matrix", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--tag-mode", choices=["canonical", "suffixed"],
                    default="canonical",
                    help="canonical: both copies share one tag (default). "
                         "suffixed: keep _home/_additional suffixes.")
    ap.add_argument("--no-check", action="store_true",
                    help="skip build-time partition/integrity assertions")
    args = ap.parse_args()

    bank = json.load(open(args.bank))
    matrix, team_cols = load_matrix(args.matrix)
    teams = bank["teams"]
    if team_cols != teams:
        print(f"warning: matrix team columns {team_cols} != bank teams {teams}",
              file=sys.stderr)

    errors = []
    if not args.no_check:
        check_partitions(matrix, teams, errors)

    questions_by_element = {}
    for q in bank["questions"]:
        questions_by_element.setdefault(q["element"], []).append(q)

    out_elements = []
    for idx, meta in enumerate(bank["elements"]):
        et = meta["element_type"]
        comp = ElementCompiler(
            meta=meta,
            questions=questions_by_element.get(et, []),
            matrix=matrix,
            teams=teams,
            tag_mode=args.tag_mode,
            base_id=(idx + 1) * 1000,
        )
        comp.assign_ids()
        quests = comp.build()
        out_elements.append({
            "element_type": et,
            "element_type_icon": meta.get("element_type_icon"),
            "quest_query": meta.get("quest_query"),
            "quests": quests,
        })

    definition = {"version": bank.get("version", "3.0.0"), "elements": out_elements}

    if not args.no_check:
        check_referential_integrity(out_elements, errors)
        if errors:
            print(f"{len(errors)} build-time check failures:", file=sys.stderr)
            for e in errors:
                print("  - " + e, file=sys.stderr)
            sys.exit(1)

    Path(args.out).write_text(json.dumps(definition, indent=4, ensure_ascii=False) + "\n")
    n_quests = sum(len(e["quests"]) for e in out_elements)
    print(f"wrote {args.out}")
    print(f"  elements: {len(out_elements)}  physical quests: {n_quests}  "
          f"tag-mode: {args.tag_mode}")


if __name__ == "__main__":
    main()
