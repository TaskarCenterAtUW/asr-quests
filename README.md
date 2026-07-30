<!-- @format -->

# AVIV ScoutRoute Quests

Repository for AVIV ScoutRoute (ASR) Long Form Quest Definition (LFQD) schemas, examples, quest definitions, validation tooling, and the Quest Definition Creator.

## Repository Layout

- [schema/](schema/) contains the latest and version-snapshot JSON schemas.
- [examples/](examples/) contains example quest definitions for each major schema version.
- [quests/](quests/) contains quest definitions, grouped by TDEI environment and project group.
- [components/](components/) contains individual-component-level quest definitions used for schema and UI testing.
- [creator/](creator/) contains the Quest Definition Creator web app.
- [utilities/](utilities/) contains the Python quest validation utility.

## Schema

Long Form Quest Definition JSON schema.

Current schema version: **4.0.0**

- [schema/schema.json](schema/schema.json)

Archived snapshots:

- [schema/schema-1.0.0.json](schema/schema-1.0.0.json)
- [schema/schema-2.0.0.json](schema/schema-2.0.0.json)
- [schema/schema-3.0.0.json](schema/schema-3.0.0.json)

## Examples

Long Form Quest Definition JSON examples.

Current example:

- [examples/example-4.0.0.json](examples/example-4.0.0.json)

Archived examples:

- [examples/example-1.0.0.json](examples/example-1.0.0.json)
- [examples/example-2.0.0.json](examples/example-2.0.0.json)
- [examples/example-3.0.0.json](examples/example-3.0.0.json)

## Validation

Quest definitions can be validated using the Python validator at [utilities/validate_quests.py](utilities/validate_quests.py).

Install the validator dependencies from the repository root:

```bash
python -m pip install -e .
```

Common usage:

```bash
python -m utilities.validate_quests
python -m utilities.validate_quests "quests/prod/CSUN 2026/CSUN 2026.json"
python -m utilities.validate_quests examples/example-4.0.0.json
python -m utilities.validate_quests --file-list files_to_validate.txt
```

### CI Validation

The GitHub Actions workflow in [.github/workflows/validate-quests.yml](.github/workflows/validate-quests.yml) uses the Python validator utility.

## Quest Definition Creator

The Quest Definition Creator in [creator/](creator/) is a Vue 3 + Vite web app for creating and editing LFQD JSON files.

- Start a new definition using the latest bundled schema version.
- Load an existing quest definition JSON file from disk.
- Resume a locally autosaved draft from browser storage.
- Add elements and quests manually or from preset libraries.
- Edit choice answers, follow-up prompts, dependencies, and numeric bounds.
- See live validation errors and warnings while editing.
- Export valid JSON by download or by copying it to the clipboard.

### Run the Creator Locally

From the [creator/](creator/) directory:

```bash
bun install
bun run dev
```

Notes:

- Drafts are autosaved in browser `localStorage` and can be restored when the
  app is reopened in the same browser.
- Export is blocked when validation errors are present.
- Warnings do not block export, but they should still be reviewed.

## Components

Long Form Quest Definition JSON files for testing individual components.

## Quests

AVIV ScoutRoute long form quest JSON definitions for use in [TDEI Workspaces](https://workspaces.sidewalks.washington.edu/), sorted by environment and project group.
