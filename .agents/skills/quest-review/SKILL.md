---
name: quest-review
description: "Use when reviewing or validating ASR Quests 4.0.0 quest-definition JSON files for JSON/schema validity, structure, quest IDs, answer choices, recursive dependencies, semantic coherence, or quest-type appropriateness. Report actionable PASS/WARN/FAIL findings, including missing sequential quests such as Q101, Q102, Q103, Q105, Q106 → WARN: Missing sequential quest Q104. Accepts one or more files or a directory. Use quest-upgrade for older definitions."
---

<!-- @format -->

# ASR Quest Definition Review

Perform a careful review of one or more ASR Quest definition JSON files that target schema **4.0.0**. This is a review workflow, not merely a schema check. Use the repository validator for authoritative schema results, then apply the checks below without inventing repository-wide rules from one example.

## Review principles

- **Schema first, policy second.** Distinguish what the selected JSON Schema requires from project conventions and heuristic recommendations.
- **Current-schema boundary.** This skill reviews only schema 4.0.0. If a target is v1, v2, v3, a bare legacy array, versionless, or otherwise not 4.0.0, stop content review and direct the user to `quest-upgrade`.
- **Evidence over assumptions.** Quote the relevant path, quest ID, element, and observed value. Do not claim semantic contradictions unless the text or structure supports the finding.
- **Collect findings.** Continue through all applicable checks after a failure so the report is useful for remediation.
- **Warnings are actionable.** A warning should explain why it matters and what to inspect; avoid turning every style preference into a failure.
- **Do not rewrite source files.** Review and report unless the user explicitly asks for fixes.

## Inputs and target resolution

Accept:

- one JSON file;
- multiple JSON file paths;
- a directory, searched recursively for `.json` files.

Resolve and list targets before reviewing. Exclude obvious non-definition fixtures only when the user asks to review a broad directory and the repository context makes the exclusion clear; otherwise report why a file was included or skipped. Preserve stable, path-sorted output. If no targets resolve, report a review error rather than a passing empty review.

## Required execution setup

This repository requires the project virtual environment before terminal commands. From the repository root, activate it first:

```powershell
.\.venv\Scripts\Activate.ps1
```

Use the documented module invocation for schema validation:

```powershell
python -m utilities.validate_quests <file_path>
```

For multiple files, pass all paths when practical. If the target is outside the repository, use an absolute path and state that the repository validator may not resolve it as a repository file.

## Status model

Every check and every finding uses one of these statuses:

- **PASS** — the check found no issue, or the check is satisfied with evidence.
- **WARN** — reviewable concern that does not make the definition invalid by schema or clearly impossible at runtime. Examples: missing sequential ID, likely semantic ambiguity, missing recommended numeric bounds, or inconsistent style.
- **FAIL** — invalid JSON, unsupported/missing schema, schema violation, duplicate IDs, malformed dependency structure, unresolved dependency target, dependency cycle, impossible required value, or another issue that blocks reliable interpretation or deployment.

Overall status is deterministic:

1. Any **FAIL** → `FAIL`.
2. Otherwise, any **WARN** → `WARN`.
3. Otherwise → `PASS`.

Use `ERROR` only when the review itself cannot proceed, such as an unreadable path; map it to overall `FAIL` and explain the limitation.

## Version detection and capability dispatch

Determine the format before checks. The only accepted format is an object with `version: "4.0.0"`, `elements`, and the schema-4 quest shapes. A bare array, versionless object, or object declaring another version is outside this skill's scope. Report an out-of-scope target as **FAIL** with this remediation: `Run quest-upgrade to migrate the definition to schema 4.0.0, then rerun quest-review.` Do not partially reinterpret older data as v4.

## Review workflow

### 1. Target and parseability

For each target:

- Confirm the file exists and is readable.
- Parse it as JSON.
- On a parse failure, emit one **FAIL** finding with the parser location and skip content-dependent checks for that file.
- Record the root shape and declared version.
- If the declared version is not exactly `4.0.0`, emit the out-of-scope **FAIL** and skip the remaining checks for that file.

### 2. Schema validation

Run `python -m utilities.validate_quests` and preserve its exact error text in the report. Confirm that the selected schema is `schema-4.0.0.json`; if the validator selects another schema, report an out-of-scope **FAIL** rather than treating that result as a current-schema pass.

- Invalid JSON: **FAIL**.
- Missing schema 4.0.0: **FAIL**.
- Schema validation errors: **FAIL**.
- Schema pass: **PASS** for this check.

Schema success does not suppress the custom review checks below; the schema does not cover all cross-question and semantic rules.

### 3. Document and element structure

Check schema 4.0.0 and project policy:

- Required root fields and root type.
- Non-empty `elements` and non-empty `quests` where the active schema or deployment policy requires them.
- Required element fields: `element_type`, `element_type_icon`, `quest_query`, and `quests`.
- Non-blank metadata strings. For schemas that only enforce string type, blank or whitespace-only values are **WARN** unless they make the definition unusable, in which case **FAIL**.
- Allowed fields and quest types according to the selected schema.
- v4-only top-level objects (`feature-presets`, `custom-icons`) and their references when present.
- Duplicate feature-preset names or custom-icon names: **WARN** or **FAIL** if references become ambiguous.
- HTTPS URI requirements and format checks for v4 URLs; do not silently treat local/example URLs as production assets.

Do not report JSON property order as a failure. JSON object order is not schema-significant and repository serializers use different orders. Only report ordering as **WARN** when the user or an explicit project policy requires canonical formatting.

### 4. Quest identity and sequence analysis

Perform identity checks separately from sequence checks.

#### Identity checks — usually FAIL

- Every quest has an ID of the type required by its schema.
- IDs satisfy the active schema pattern/range.
- IDs are globally unique within the document.
- Every quest can be identified unambiguously in findings.

Duplicate IDs are always **FAIL**, including duplicates in different elements.

#### Sequence and placement checks — usually WARN

- Preserve source array order; do not assume IDs must be numerically sorted.
- Detect numeric gaps within a locally coherent sequence. Example: IDs `Q101, Q102, Q103, Q105, Q106` produce:
    - `WARN [Q101,Q102,Q103,Q105,Q106]: Missing sequential quest Q104.`
- For numeric IDs, identify the apparent element block only when the file follows a clear creator-style convention such as 101–199, 201–299. Then warn about an ID in the wrong block or a gap within that block.
- Treat non-sequential IDs, reserved IDs, compiler output, and project-specific schemes as possible intentional design. Do not require `101–199`, `201–299`, or contiguous IDs repository-wide.
- For v4 string IDs, check format and useful local sequencing only when the IDs visibly encode a sequence. Do not infer numeric order from arbitrary strings.

A missing ID is not a failure by itself. Include the full affected ID list in the finding, not only the missing number.

#### ID finding examples

```text
WARN [Q101,Q102,Q103,Q105,Q106]: Missing sequential quest Q104 in the apparent local sequence; verify whether the gap is intentional or reserved.
WARN [element 2, Q201,Q203]: Apparent creator-style sequence skips Q202; source order is otherwise preserved.
PASS [all quests]: Quest IDs are unique and match the detected schema type.
```

### 5. Quest shape and field appropriateness

Check fields according to schema 4.0.0 and quest type:

- Choice quests have a non-empty choice list where required by the schema.
- Numeric quests may use `quest_answer_validation`; `min`-only or `max`-only bounds are valid when the schema allows them.
- If both numeric bounds exist, `min > max` is **FAIL**. `min == max` is generally valid but may be **WARN** if unusual. Missing recommended bounds for measurements or counts is **WARN**, not **FAIL**.
- TextEntry quests should not be treated as choice questions.
- AutoCapture is valid only where supported by the detected schema and must have the required non-empty attribute mapping.
- Do not accept older shapes such as numeric quest IDs, `required_value` dependencies, or missing `required` as current-schema variants. They should already have been routed to `quest-upgrade` by the scope gate.
- Unexpected fields are **FAIL** when rejected by the active schema; otherwise report policy concerns as **WARN**.

### 6. Answer-choice integrity

For each `ExclusiveChoice` or `MultipleChoice` quest, check:

**FAIL conditions**

- Choice is not an object where an object is required.
- Required `value` or `choice_text` is missing, non-string, or blank under the active schema/policy.
- Duplicate `value` within a quest.

**WARN conditions**

- Duplicate `choice_text` unless intentionally localized or otherwise documented.
- Value/text semantic mismatch detected by a clear heuristic.
- Inconsistent capitalization or formatting.
- `n/a`, `unknown`, `other`, or similar fallback choices that appear contextually questionable.
- Value format is not snake_case in a project area that otherwise follows snake_case.

Do not require snake_case universally. Values such as `1-5`, `>10`, and other range-like or legacy values are permitted when schema-valid. Dependency matching is exact and case-sensitive unless the active application policy explicitly says otherwise.

For `MultipleChoice`, inspect whether the question and choices support multiple simultaneous attributes. For `ExclusiveChoice`, warn when the title clearly asks for multiple simultaneous selections.

### 7. Dependency analysis

First extract every leaf condition and retain its path, for example `Q104.quest_answer_dependency.all[0]`.

#### Schema 4.0.0 dependency model

- Dependencies must be recursive `all`/`any` groups with valid leaf conditions.
- `all` requires at least one child; `any` requires at least two.
- Leaf `question_id` values are strings matching the v4 pattern.
- Operators are `equals` or `contains`; `contains` should normally target MultipleChoice answers.
- Every target exists, no target is self-referential, and the dependency graph is acyclic: **FAIL** for violations.
- `equals` and `contains` values must match the parent answer model. A value not present in a choice parent is **FAIL** when determinable.
- Nested groups with contradictory conditions should be **WARN** or **FAIL** only when contradiction is provable. Example: an `all` group requiring the same ExclusiveChoice parent to equal two different values is impossible and should be **FAIL**.
- Preserve dependency expression paths in findings so authors can locate nested errors.

#### Dependency graph summary

Report a concise graph summary per file:

- number of quests with dependencies;
- number of leaf conditions;
- maximum dependency depth;
- any roots, cycles, missing targets, or orphaned quests;
- whether all dependencies remain within their element when that convention applies.

### 8. Semantic and logical review

This is a human/heuristic review. Label findings as **WARN** unless the contradiction is explicit and makes the quest unusable.

Check:

- Title and description ask the same question; descriptions clarify rather than contradict or re-ask a different question.
- Scale/range questions explain units and/or endpoint meaning where needed.
- Tags reflect what the quest measures. Flag clear mismatches, such as a sidewalk-width question tagged as cross slope.
- Quests within an element have a coherent tag prefix; repeated tags are intentional or documented.
- Choices answer the stated question. A surface-material question with Yes/No choices is a likely **WARN**.
- A dependent quest makes sense for every required parent value. Flag contradictions such as a child asking about a shelter when the dependency requires the parent answer `no`.
- Sibling quests under the same parent/value are distinct rather than overlapping.
- Dependency chains are coherent end-to-end.
- Required/optional behavior is sensible. A required dependent quest is not itself a problem because hidden quests should not block completion; flag only contradictory or unusable configurations.

Do not infer semantic meaning from tags alone. Quote the title, description, tag, parent value, or choice that supports each finding.

### 9. Quest-type appropriateness

Use **WARN** for reviewable mismatches and **FAIL** only when the active schema makes the type invalid:

- Yes/no or mutually exclusive → normally `ExclusiveChoice`.
- Multiple simultaneous attributes → normally `MultipleChoice`.
- Counts, widths, slopes, speeds, percentages, and other measured quantities → normally `Numeric`.
- Free-text observations/comments → normally `TextEntry`.
- Automatic measurements or mapped attributes → `AutoCapture` where supported.

If a type is plausible in more than one way, state the ambiguity instead of failing it.

### 10. Cross-file review

When reviewing multiple files, add a cross-file section:

- duplicate IDs across files: **WARN** by default because IDs are usually document-local; **FAIL** only if the input is intended to be one combined definition or the application requires global uniqueness;
- duplicate or conflicting tags: **WARN** unless explicitly prohibited;
- every reviewed file must be v4.0.0; any older or unsupported file is an individual **FAIL** and should be routed to `quest-upgrade`;
- repeated missing IDs or dependency conventions: summarize patterns rather than duplicating every identical note.

## Reporting format

Use compact, structured output. Every check has a status and every issue includes severity, scope, and evidence.

```text
## Quest Review Summary

Targets: 2
Files: 2 PASS, 0 WARN, 0 FAIL
Overall: WARN — 3 warning(s), 0 failure(s)

### path/to/file.json

Format: v4.0.0 object definition
Schema: PASS — schema v4.0.0
Overall: WARN — 2 warning(s), 0 failure(s)

#### Findings

- PASS [document]: JSON parsed successfully.
- PASS [all quests]: Quest IDs are unique and valid for v4.
- WARN [Q101,Q102,Q103,Q105,Q106]: Missing sequential quest Q104 in the apparent local sequence; verify whether the gap is intentional or reserved.
- WARN [Q106.quest_answer_dependency]: Cross-element dependency on Q201; the creator convention normally limits parents to the same element.

#### Check summary

| Check | Status | Scope |
|---|---|---|
| JSON validity | PASS | document |
| Schema validation | PASS | document |
| Structure and metadata | PASS | document/elements |
| IDs and sequence | WARN | Q101–Q106 |
| Quest shapes | PASS | all quests |
| Answer choices | PASS | Q101,Q102 |
| Dependencies | WARN | Q106 |
| Semantic coherence | PASS | all quests |
| Quest-type appropriateness | PASS | all quests |

#### Dependency graph

- Dependent quests: 1
- Leaf conditions: 1
- Maximum depth: 1
- Cycles: none

### Cross-file summary

- Most critical: no failures.
- Repeated warning: apparent sequence gap Q104 in one file.
- Schema versions reviewed: v4.0.0 only.
```

Rules for reporting:

- Use `Q` notation in prose for numeric IDs when helpful, but preserve the source value exactly in evidence. For example, source `101` may be shown as `Q101`.
- List all affected IDs in sequence warnings, not only the missing ID.
- Do not report a check as PASS if it was skipped; use `SKIP` with a reason, and make the file overall FAIL when the skipped check is required for reliable review.
- Keep schema errors verbatim and add a plain-language explanation only afterward.
- End with remediation priorities: failures first, then warnings that could affect runtime behavior, then style/maintainability warnings.

## Review quality checklist

Before finalizing, verify:

- [ ] All targets were resolved and listed.
- [ ] JSON was parsed before content checks.
- [ ] The target is exactly schema 4.0.0; older definitions were routed to `quest-upgrade`.
- [ ] Repository schema validation was run with the activated `.venv`.
- [ ] Schema rules were separated from policy and heuristic warnings.
- [ ] Duplicate IDs, missing targets, impossible values, and cycles were treated as failures.
- [ ] Missing sequential IDs were reported as warnings with the full affected ID list.
- [ ] Property order was not incorrectly treated as a schema violation.
- [ ] v4-only rules were applied consistently; legacy shapes were not silently accepted.
- [ ] Findings include location, evidence, severity, and an actionable recommendation.
- [ ] Overall status follows FAIL > WARN > PASS deterministically.
