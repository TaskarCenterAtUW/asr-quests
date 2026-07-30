---
name: quest-upgrade
description: "Use when migrating an ASR Quests definition from a bare legacy array or schema 1.0.0, 2.x, or 3.x to the current schema 4.0.0. Preserve intent while converting IDs, required fields, quest shapes, URLs, answer choices, and dependencies; produce a migration report and validate the upgraded output. Do not use quest-review for older definitions until migration is complete."
---

<!-- @format -->

# ASR Quest Definition Upgrade

Migrate an older ASR Quest definition to the current **schema 4.0.0**. This skill is for transformation planning and execution, not merely changing the `version` field. The output must be structurally valid v4, semantically traceable to the source, and accompanied by a migration report that identifies assumptions and manual decisions.

## Safety and scope

- Never overwrite the source by default. Write to an explicit destination or propose a destination such as `<source>.v4.json`.
- Preserve the original file and keep a source-to-target mapping for every quest ID.
- Do not silently discard fields, choices, dependencies, image URLs, or element metadata.
- Do not claim that a migration is complete merely because the version changed.
- If the source has ambiguous or contradictory data, stop that part of the migration, preserve the evidence, and mark it `WARN` or `BLOCKED` for manual resolution.
- After migration, run the v4 validator and then `quest-review` against the generated file.
- This repository requires the virtual environment before terminal commands:

```powershell
.\.venv\Scripts\Activate.ps1
```

## Accepted source formats

| Source      | Detection                      | Typical migration concerns                                                                                                                                |
| ----------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1 / legacy | Root is a bare array           | Add root version and wrap elements; IDs may repeat per element; legacy URLs may be HTTP; no `required`; older quest types and empty numeric choice arrays |
| v2.x        | Object with `version: "2.x.x"` | Numeric IDs, legacy field permissiveness, old dependency objects, no `required`                                                                           |
| v3.x        | Object with `version: "3.x.x"` | Numeric IDs, `required_value` dependencies, no `required`, no `AutoCapture`, no recursive `all`/`any` groups                                              |
| v4.0.0      | Object with `version: "4.0.0"` | Already current; use `quest-review`, not this skill                                                                                                       |

If the input is already v4, do not perform a no-op upgrade; direct the user to `quest-review`. If the version is unsupported, ask for a migration policy or stop with `BLOCKED` rather than guessing.

## Target schema contract

The upgraded root must be an object with:

- `version: "4.0.0"`;
- a non-empty `elements` array;
- optional `feature-presets` and `custom-icons` arrays only when intentionally migrated or added.

Each element must contain:

- non-blank `element_type`;
- non-blank `element_type_icon`;
- non-blank `quest_query`;
- a non-empty `quests` array.

Each v4 quest must use a string `quest_id` matching `^[A-Za-z0-9_-]+$`, non-blank title and description, a supported `quest_type`, and `required: true` or `false`.

V4 quest shapes are:

- `ExclusiveChoice` / `MultipleChoice`: require non-blank `quest_tag` and a non-empty `quest_answer_choices`; no numeric validation or AutoCapture attributes.
- `Numeric`: require non-blank `quest_tag`; may include numeric `quest_answer_validation`; must not include choices or AutoCapture attributes.
- `TextEntry`: require non-blank `quest_tag`; must not include choices, numeric validation, or AutoCapture attributes.
- `AutoCapture`: require non-empty `auto_capture_attributes`; must not include `quest_tag`, choices, or numeric validation.

Use `schema/schema-4.0.0.json` as the final authority.

## Migration workflow

### 1. Resolve input and establish a migration plan

Accept one JSON file or a list of files. Resolve paths, parse each source, and identify its source version before editing anything. For each source record:

- source path and destination path;
- detected source version and root shape;
- number of elements and quests;
- source quest IDs and duplicate IDs;
- dependency forms used;
- HTTP or non-HTTPS URLs;
- unsupported or unknown quest types;
- fields that have no direct v4 equivalent.

Create a migration plan before applying transformations. If multiple files are supplied, migrate independently and preserve document-local IDs unless the user explicitly requests cross-file consolidation.

### 2. Establish stable quest ID mappings

V4 IDs are strings and must be unique within the document. Use a deterministic mapping and record it:

| Source                                     | Target example          | Rule                                                      |
| ------------------------------------------ | ----------------------- | --------------------------------------------------------- |
| numeric `101`                              | `"101"`                 | Stringify when globally unique and valid                  |
| numeric duplicate `1` in multiple elements | `"e1-q1"`, `"e2-q1"`    | Add an element scope when needed                          |
| nonconforming source ID                    | sanitized stable string | Preserve the original in the mapping and avoid collisions |

Preferred policy:

1. Preserve a source ID as a string when it is unique and matches `^[A-Za-z0-9_-]+$`.
2. For duplicates, scope the target with a stable element token, such as `e2-1`.
3. For invalid or blank IDs, generate a deterministic ID from element index and quest position, such as `e1-q01`, and mark it **WARN**.
4. Never renumber solely to make IDs sequential unless explicitly requested.
5. Maintain both directions: `source ID + element/position → target ID` and `target ID → source location`.

Duplicate source IDs are not automatically a migration failure because v4 requires document-wide uniqueness and the migration can scope them. They become **BLOCKED** if dependencies cannot be disambiguated reliably.

### 3. Convert root and element metadata

- A bare v1 array becomes `{ "version": "4.0.0", "elements": [...] }`.
- Preserve element order and metadata.
- Preserve `element_type`, `quest_query`, and `element_type_icon` when non-blank.
- If an icon value is a local asset name, retain it. If it is an HTTP URL or unknown asset reference, preserve it but report a **WARN** and verify whether the v4 application accepts it.
- Preserve additional element metadata only when allowed by v4, such as `resurvey_interval`; report unsupported fields instead of silently dropping them.
- Ensure every element has at least one quest. Empty elements are **BLOCKED** unless the user explicitly approves removal.

### 4. Convert quest fields and required behavior

For each quest:

- Convert `quest_id` using the mapping from step 2.
- Preserve title, description, tag, and image URL where v4 permits them.
- Add `required` explicitly. Do not guess silently:
    - default to `false` only if that is the project-approved migration policy;
    - otherwise mark each inferred value **WARN** for confirmation.
- Preserve `quest_type` when it is supported by v4.
- Convert legacy choice quests to v4 choice quests with non-empty choices.
- Remove legacy empty `quest_answer_choices: []` from Numeric and TextEntry quests; report this as a normal compatibility conversion, not lost meaning.
- Preserve Numeric `min`-only or `max`-only validation. Convert numeric strings to numbers only when the conversion is unambiguous; otherwise mark **BLOCKED**.
- Preserve choice-level `choice_follow_up` and `image_url` when valid. V4 requires HTTPS URLs for image fields; an HTTP URL is not safely upgraded by changing `http` to `https` unless the resource is known to support HTTPS. Preserve the original in the migration report and request a replacement or approved policy.
- If a legacy quest type is not supported by v4, map it only with an explicit documented policy and flag the semantic loss. Never silently map a custom type to TextEntry or ExclusiveChoice.

### 5. Convert dependencies

Build the source dependency graph before changing IDs. Resolve every source target through the ID mapping, and retain the source quest and dependency path in the report.

#### Legacy v1–v3 dependency conversion

Source forms:

- one object `{question_id, required_value}` → v4 `{ "all": [{ "question_id": "...", "operator": "equals", "value": "..." }] }`;
- an array of dependency objects → one v4 `all` group containing one `equals` condition per object;
- an array `required_value` → one v4 `any` group containing one `equals` condition per value.

When both forms occur, compose them explicitly. For example, an AND list with an OR value list becomes an `all` group whose relevant condition is an `any` subgroup:

```json
{
    "all": [
        {
            "any": [
                { "question_id": "101", "operator": "equals", "value": "yes" },
                { "question_id": "101", "operator": "equals", "value": "maybe" }
            ]
        },
        { "question_id": "102", "operator": "equals", "value": "enabled" }
    ]
}
```

Conversion rules:

- Stringify and remap every target ID through the mapping.
- Preserve exact required values as v4 `value` strings.
- Validate each value against the migrated parent choices when the parent is choice-based.
- Preserve AND semantics for arrays of dependency objects.
- Preserve OR semantics for arrays of `required_value` values.
- Do not invent `contains` merely because a parent is MultipleChoice. Use `equals` for a complete configured value unless the source/application explicitly represents a semicolon-delimited MultipleChoice answer and the migration policy calls for `contains`.
- Empty dependency arrays, missing targets, self-references, cycles, and impossible values are **BLOCKED** until resolved or explicitly waived.
- Cross-element dependencies may be retained in v4 because the schema permits them, but report them as **WARN** if the source application expected same-element parents.

#### v4 source

If the source already uses recursive v4 dependencies, only remap IDs if the migration plan explicitly requires it. Do not flatten or reinterpret `all`, `any`, `equals`, or `contains`.

### 6. Handle v4-only features

Do not invent `feature-presets`, `custom-icons`, `resurvey_interval`, or `AutoCapture` data. Preserve supported source metadata and migrate these features only when the source contains an unambiguous equivalent.

For custom icons:

- preserve unique `name`, `https` `url`, and valid `type`;
- reject duplicate names or invalid URLs;
- update references only when a source-to-target name mapping exists.

For AutoCapture:

- migrate only if the source has a clear automatic-attribute mapping;
- otherwise keep the source quest as a manually reviewed quest and mark the conversion **BLOCKED** rather than guessing.

### 7. Apply, diff, and validate

After generating a candidate output:

1. Parse the output as JSON.
2. Compare source and target counts and IDs using the mapping.
3. Confirm no source quest, choice, dependency, or supported metadata disappeared without a report entry.
4. Run:

```powershell
.\.venv\Scripts\Activate.ps1
python -m utilities.validate_quests <target-file>
```

5. Run the `quest-review` skill on the v4 output.
6. If validation fails, fix the migration logic or mark the affected conversion `BLOCKED`; do not hide errors by weakening the target schema.

## Migration status model

Use these statuses in the migration report:

- **PASS** — converted without semantic change or unresolved concern.
- **WARN** — converted with an explicit, reversible assumption or non-blocking compatibility concern, such as inferred `required`, scoped duplicate IDs, or an HTTP URL needing verification.
- **BLOCKED** — cannot safely convert without a decision, missing information, or manual correction. A blocked migration must not be presented as a valid final v4 file.

Overall migration status:

1. Any `BLOCKED` → `BLOCKED`.
2. Otherwise, any `WARN` → `WARN`.
3. Otherwise → `PASS`.

A generated target may be schema-valid while the migration remains `WARN`; validation and semantic confidence are separate outcomes.

## Required migration report

Write or print a report alongside the output. Use this structure:

```text
## Quest Upgrade Report

Source: path/to/source.json
Target: path/to/source.v4.json
Source format: v3.0.0 object
Target format: v4.0.0 object
Overall migration status: WARN — 0 blocked, 3 warnings
Target schema validation: PASS
Post-upgrade quest review: WARN

### Summary
- Elements: 3 → 3
- Quests: 18 → 18
- Choices: 52 → 52
- Dependencies: 7 source conditions → 7 v4 leaf conditions
- Quest IDs: 18 mapped, 0 unresolved

### ID mapping
| Source location | Source ID | Target ID | Status |
|---|---:|---|---|
| elements[0].quests[0] | 101 | `"101"` | PASS |
| elements[1].quests[0] | 1 | `"e2-1"` | WARN — scoped duplicate |

### Findings
- PASS [elements[0].quests[0]]: Preserved choice quest and all 5 answer choices.
- WARN [elements[0].quests[0].required]: Added `required: false` under the approved migration default; confirm whether the quest should block completion.
- WARN [elements[0].quests[2].quest_answer_choices]: Removed legacy empty choices array from Numeric quest.
- BLOCKED [elements[2].quests[1].quest_image_url]: Source URL is HTTP and cannot be safely converted to an HTTPS v4 URL; provide a replacement or approve a policy.

### Manual decisions required
- [ ] Confirm inferred required values.
- [ ] Replace or approve non-HTTPS image URLs.
- [ ] Resolve all BLOCKED findings before publishing.
```

Always include:

- source and target paths;
- source and target versions;
- element, quest, choice, and dependency counts;
- complete ID mapping;
- transformed, dropped, and unresolved fields;
- warnings and blocked decisions with source paths;
- schema validation result;
- instruction to run `quest-review` after the target is valid.

## Upgrade quality checklist

- [ ] Source was preserved and target path was explicit.
- [ ] Source version/root shape was detected before transformation.
- [ ] Target declares exactly `4.0.0`.
- [ ] Every target quest ID is a unique valid v4 string.
- [ ] Every target quest has an explicit `required` value.
- [ ] Quest-type-specific v4 restrictions are satisfied.
- [ ] Legacy dependencies were converted to equivalent recursive `all`/`any` expressions.
- [ ] Dependency IDs were remapped and all targets exist.
- [ ] Cycles, self-references, impossible values, and ambiguous mappings were blocked.
- [ ] No supported choices or metadata disappeared silently.
- [ ] URL and icon concerns were reported rather than guessed away.
- [ ] Target passed `python -m utilities.validate_quests`.
- [ ] Target was subsequently reviewed with `quest-review`.
