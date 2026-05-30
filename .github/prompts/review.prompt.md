---
description: "Review and validate one or more quest definition JSON files for schema correctness, logical consistency, and semantic alignment. Accepts a single file path, a list of file paths, or a directory path (searched recursively for .json files)."
name: "Review Quest Definition"
argument-hint: "Path to a quest file, a list of quest files, or a directory containing quest files"
agent: "agent"
---

<!-- @format -->

You are an expert reviewer of ASR Quests quest definition files. Input may be a single `.json` path, a list of paths, or a directory (recursively find all `.json` files). Resolve all target files first, then for each file run every check below in order. Collect all issues before reporting — do not stop at the first error.

## Check 1 — JSON Validity

Confirm the file is valid, parseable JSON. If not, report the parse error and skip remaining checks for that file.

## Check 2 — Schema Validation

```
python utilities/validate_quests.py <file_path>
```

Report errors exactly as output. Continue to logical checks even on schema failure.

## Check 3 — Structural Conventions

- `version` present, semver format, current expected value `3.0.0`.
- `elements` is a non-empty array; each element has `element_type`, `element_type_icon`, `quest_query`, `quests` (non-empty).
- Each quest has `quest_id`, `quest_title`, `quest_description`, `quest_type`, `quest_tag`.
- `quest_type` is one of: `ExclusiveChoice`, `MultipleChoice`, `Numeric`, `TextEntry`.
- `ExclusiveChoice`/`MultipleChoice` have `quest_answer_choices`; `Numeric`/`TextEntry` do not.
- `quest_answer_validation` (`min`/`max`, `min < max`) only on `Numeric` quests.
- All `quest_id`s are unique across the entire file.
- Property order per quest: `quest_id` → `quest_title` → `quest_description` → `quest_type` → `quest_tag` → `quest_answer_dependency` → `quest_answer_choices`/`quest_answer_validation`. Flag deviations.

## Check 4 — Quest ID Range Conventions

IDs are hundreds-based by element position (element 1: 101–199, element 2: 201–299, etc.). Verify:

- Each element's IDs fall within its expected range and are in ascending order with no duplicates.
- No `quest_id` is reused across elements.

## Check 5 — Answer Choice Integrity

For each `ExclusiveChoice`/`MultipleChoice` quest:

- Each choice has non-empty `value` (snake_case) and `choice_text` (human-readable, properly capitalized).
- `value` and `choice_text` correspond semantically — e.g., `value: "yes"` / `choice_text: "No"` is an error.
- No duplicate `value`s within the same quest.
- `n/a` or `unknown` choices are only present where realistically applicable.

## Check 6 — Dependency Structural Validity

`quest_answer_dependency` has three valid forms:

- **Scalar `required_value`** — show quest when parent's selected value equals the scalar: `{ "question_id": 101, "required_value": "yes" }`
- **Array `required_value`** — OR logic; show quest when parent's answer matches _any_ listed value: `{ "question_id": 301, "required_value": ["A", "B"] }`. Valid against both `ExclusiveChoice` and `MultipleChoice` parents.
- **Array of dependency objects** — AND logic; _all_ conditions must be satisfied: `[{ "question_id": 201, "required_value": "yes" }, { "question_id": 202, "required_value": "no" }]`

For each quest with `quest_answer_dependency`:

- Referenced `question_id` exists within the same file. Cross-element references (e.g., an element 2 quest referencing an element 1 ID) should be flagged as likely errors.
- No self-reference; no circular chains (A→B→A).
- Every `required_value` item (scalar or within an array) exactly matches a `value` in the referenced quest's `quest_answer_choices`.
- When `quest_answer_dependency` is itself an array (AND logic): each object passes all above rules; no duplicate `question_id`s within the array.

## Check 7 — Semantic Alignment

**Title ↔ Description:** Description must elaborate on or clarify the title's question — not contradict it, not re-ask a different question. Scale questions (e.g., "Rate 1–5") should have descriptions explaining the extremes.

**Title/Description ↔ Tag:** Tag must reflect what the quest measures. Mismatch example: title "What is the sidewalk width?" with tag `ext:sidewalk_cross_slope`. Quests within the same element should share a consistent tag prefix. No two quests should share a `quest_tag` unless intentionally documented.

**Answer choices ↔ Title/Description:** Choices must be appropriate responses to the question. Mismatch example: title "What is the surface material?" with choices `["Yes", "No"]`.

## Check 8 — Dependency Logical Coherence

Each follow-up quest must make sense _given the specific required value(s)_ of its parent. Violations to detect:

- Follow-up asks about properties of option B when required_value is option A — e.g., parent "Is there a shelter?" required_value=`no`, child asks "What type of shelter is present?"
- Required value is a specific category (e.g., `raised`), but the follow-up asks about a contradictory category — e.g., "What type of _lowered_ curb is this?"
- A `required_value: "yes"` dependency exists, but the parent has no `"yes"` choice.
- Sibling quests sharing the same parent and required value ask overlapping, non-distinct questions.
- Dependency chains (Q103→Q102→Q101): the entire chain must be coherent end-to-end.

## Check 9 — quest_type Appropriateness

- Yes/no or mutually exclusive → `ExclusiveChoice`, not `MultipleChoice`.
- Multiple simultaneous attributes → `MultipleChoice`.
- Count, width, slope, speed, or other measured quantity → `Numeric`.
- Free-text observation/comment → `TextEntry`.
- Flag `Numeric` quests missing `quest_answer_validation` (strongly recommended).

---

## Reporting Format

```
## Review Summary

### <file path>

**Check 1 — JSON Validity:** PASS / FAIL
  - [errors]
**Check 2 — Schema Validation:** PASS / FAIL
  - [errors]
**Check 3 — Structural Conventions:** PASS / FAIL
  - [issues]
**Check 4 — Quest ID Ranges:** PASS / FAIL
  - [issues]
**Check 5 — Answer Choice Integrity:** PASS / FAIL
  - [Quest ID: issue]
**Check 6 — Dependency Structural Validity:** PASS / FAIL
  - [Quest ID: issue]
**Check 7 — Semantic Alignment:** PASS / FAIL
  - [Quest ID: issue]
**Check 8 — Dependency Logical Coherence:** PASS / FAIL
  - [Quest ID: issue]
**Check 9 — quest_type Appropriateness:** PASS / FAIL
  - [Quest ID: issue]

**Overall: PASS / FAIL — N issue(s)**
```

End with a one-paragraph cross-file summary, most critical issues first.
