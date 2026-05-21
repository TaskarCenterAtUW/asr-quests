<!-- @format -->

# AVIV ScoutRoute Quests

Repository for AVIV ScoutRoute (ASR) long form quest definition schemas,
examples, quest definitions, validation tooling, and the Quest Definition
Creator.

## Repository Layout

- [schema/](schema/) contains the latest and versioned JSON schemas.
- [examples/](examples/) contains example quest definitions for each schema
  version.
- [quests/](quests/) contains quest definitions grouped by environment and
  project.
- [components/](components/) contains component-level JSON files used for
  schema and UI testing.
- [creator/](creator/) contains the Quest Definition Creator web app.
- [utilities/](utilities/) contains Python quest validation utility.

## Schema

Long form quest definition JSON schema.

Latest:

- [schema/schema.json](schema/schema.json)

Snapshots:

- [schema/schema-1.0.0.json](schema/schema-1.0.0.json)
- [schema/schema-2.0.0.json](schema/schema-2.0.0.json)
- [schema/schema-3.0.0.json](schema/schema-3.0.0.json)

## Examples

Long form quest definition JSON examples.

Latest:

- [examples/example.json](examples/example.json)

Snapshots:

- [examples/example-1.0.0.json](examples/example-1.0.0.json)
- [examples/example-2.0.0.json](examples/example-2.0.0.json)
- [examples/example-3.0.0.json](examples/example-3.0.0.json)

## Validation

Quest definitions can now be validated locally with the Python validator in
[utilities/validate_quests.py](utilities/validate_quests.py).

What it does:

- Validates every quest JSON file under [quests/](quests/) by default.
- Validates specific files when paths are passed on the command line.
- Validates a text file containing one path per line with `--file-list`, which
  is what the validation workflow uses.
- Picks the correct schema version automatically.
- Supports legacy `1.0.0` array-based quest files as well as later object-based
  definitions.

Install the validator dependencies from the repository root:

```bash
python -m pip install -e .
```

Common usage:

```bash
python -m utilities.validate_quests
python -m utilities.validate_quests "quests/prod/CSUN 2026/CSUN 2026.json"
python -m utilities.validate_quests --file-list files_to_validate.txt
```

The editable install also registers a `validate-quests` console script, but
`python -m utilities.validate_quests` is the most reliable form across local
environments and in workflows.

### CI Validation

The GitHub Actions workflow in
[.github/workflows/validate-quests.yml](.github/workflows/validate-quests.yml)
uses the Python validator utility.

Current behavior:

- On quest JSON changes, CI validates only the changed quest files.
- On schema, validator, packaging, or validator-workflow changes, CI validates
  all quest files.
- On manual workflow dispatch, CI validates all quest files.

## Quest Definition Creator

The Quest Definition Creator in [creator/](creator/) is a Vue 3 + Vite web app
for creating and editing long form quest definition JSON files.

Basic capabilities:

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
npm install
npm run dev
```

For a production build:

```bash
npm run build
npm run preview
```

### Basic Creator Workflow

1. Open the creator and choose `Create New Definition` or `Load Existing JSON`.
2. Add an element, then add quests under that element.
3. Use element and quest presets to scaffold common blocks more quickly.
4. Resolve any validation errors shown in the editor.
5. Export the finished definition as JSON.

Notes:

- Drafts are autosaved in browser `localStorage` and can be restored when the
  app is reopened in the same browser.
- Export is blocked when validation errors are present.
- Warnings do not block export, but they should still be reviewed.

## Components

Long form quest definition JSON files for testing components.

## Quests

AVIV ScoutRoute long form quest JSON definitions for use in
[TDEI Workspaces](https://workspaces.sidewalks.washington.edu/), sorted by
environment and project group.
