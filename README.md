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
- [schema/schema-3.1.0.json](schema/schema-3.1.0.json)
- [schema/schema-3.2.0.json](schema/schema-3.2.0.json)

## Examples

Long Form Quest Definition JSON examples.

Current example:

- [examples/example-4.0.0.json](examples/example-4.0.0.json)

Archived examples:

- [examples/example-1.0.0.json](examples/example-1.0.0.json)
- [examples/example-2.0.0.json](examples/example-2.0.0.json)
- [examples/example-3.0.0.json](examples/example-3.0.0.json)
- [examples/example-3.1.0.json](examples/example-3.1.0.json)
- [examples/example-3.2.0.json](examples/example-3.2.0.json)

## Validation

Quest definitions can be validated using the Python validator at [utilities/validate_quests.py](utilities/validate_quests.py).

From the repo root, activate the project virtual environment and install the validator dependencies:

```powershell
.\.venv\Scripts\Activate.ps1
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

- Start from the latest bundled schema version.
- Create and edit recency settings, feature presets, arbitrary tags, and custom quest or feature-preset icons.
- Load an existing quest definition JSON file from disk.
- Resume a locally autosaved draft from browser storage.
- Add elements and quests manually or from preset libraries.
- Edit choice answers, follow-up prompts, dependencies, and numeric bounds.
- View live validation errors and warnings while editing.
- Export valid JSON by downloading it or copying it to the clipboard.

The creator bundles the latest supported schema and keeps optional `feature-presets` and `custom-icons` sections hidden until they are enabled. Legacy definitions remain loadable and can be upgraded from the validation panel.

### Run the creator locally

From the [creator/](creator/) directory:

```bash
bun install
bun run dev
```

Notes:

- Drafts are autosaved in browser `localStorage` and can be restored when the app is reopened in the same browser.
- Export is blocked while validation errors are present.
- Warnings do not block export, but they should still be reviewed.

## Components

Long Form Quest Definition JSON files for testing individual components.

## Quests

AVIV ScoutRoute long form quest JSON definitions for use in [TDEI Workspaces](https://workspaces.sidewalks.washington.edu/), sorted by environment and project group.
