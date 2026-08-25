<!-- @format -->

# AVIV ScoutRoute Quests

Repository for AVIV ScoutRoute (ASR) long-form quest definition (LFQD) schemas, examples, validation tooling, and the Quest Definition Creator.

## Repository Layout

- [schema/](schema/) contains the current and versioned JSON schemas.
- [examples/](examples/) contains example quest definitions for each schema version.
- [quests/](quests/) contains quest definitions grouped by environment and project.
- [components/](components/) contains component-level JSON fixtures for schema and UI testing.
- [creator/](creator/) contains the Quest Definition Creator web app.
- [utilities/](utilities/) contains the Python validation utility.

## Schema

Long form quest definition JSON schema.

Latest:

- [schema/schema.json](schema/schema.json)

Snapshots:

- [schema/schema-1.0.0.json](schema/schema-1.0.0.json)
- [schema/schema-2.0.0.json](schema/schema-2.0.0.json)
- [schema/schema-3.0.0.json](schema/schema-3.0.0.json)
- [schema/schema-3.1.0.json](schema/schema-3.1.0.json)
- [schema/schema-3.2.0.json](schema/schema-3.2.0.json)

## Examples

Long form quest definition JSON examples.

Latest:

- [examples/example.json](examples/example.json)

Snapshots:

- [examples/example-1.0.0.json](examples/example-1.0.0.json)
- [examples/example-2.0.0.json](examples/example-2.0.0.json)
- [examples/example-3.0.0.json](examples/example-3.0.0.json)
- [examples/example-3.1.0.json](examples/example-3.1.0.json)
- [examples/example-3.2.0.json](examples/example-3.2.0.json)

## Validation

Quest definitions are validated locally with the Python validator in [utilities/validate_quests.py](utilities/validate_quests.py).

What it does:

- Validates every quest JSON file under [quests/](quests/) by default.
- Validates specific files passed as command-line arguments.
- Reads a file list via `--file-list`, which is how the CI workflow selects files.
- Picks the correct schema version automatically.
- Supports both legacy `1.0.0` array-based definitions and later object-based definitions.

From the repo root, activate the project virtual environment and install the validator dependencies:

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -e .
```

Common usage:

```bash
python -m utilities.validate_quests
python -m utilities.validate_quests "quests/prod/CSUN 2026/CSUN 2026.json"
python -m utilities.validate_quests --file-list files_to_validate.txt
```

The editable install does register a `validate-quests` console script, but `python -m utilities.validate_quests` is the most reliable entry point in local and CI environments.

### CI Validation

The workflow in [.github/workflows/validate-quests.yml](.github/workflows/validate-quests.yml) runs the validator automatically.

Current behavior:

- On quest JSON changes, CI validates only the changed quest files.
- On schema, validator, packaging, or workflow changes, CI validates all quest files.
- On manual workflow dispatch, CI validates all quest files.

## Quest Definition Creator

The Quest Definition Creator in [creator/](creator/) is a Vue 3 + Vite web app for creating and editing long form quest definition JSON files.

Capabilities:

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

To regenerate the checked-in feature icon catalog, run:

```bash
bun run scrape-feature-icons
```

For a production build:

```bash
bun run build
bun run preview
```

### Basic creator workflow

1. Open the creator and choose `Create New Definition` or `Load Existing JSON`.
2. Add an element, then add quests under it.
3. Use element and quest presets to scaffold common blocks more quickly.
4. Resolve any validation errors shown in the editor.
5. Export the finished definition as JSON.

Notes:

- Drafts are autosaved in browser `localStorage` and can be restored when the app is reopened in the same browser.
- Export is blocked while validation errors are present.
- Warnings do not block export, but they should still be reviewed.

## Components

Long form quest definition JSON fixtures for component testing.

## Quests

AVIV ScoutRoute long form quest JSON definitions for use in [TDEI Workspaces](https://workspaces.sidewalks.washington.edu/), grouped by environment and project.
