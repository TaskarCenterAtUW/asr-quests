"""Quest definition validator.

Usage:
    validate-quests                          # validate all files under quests/
    validate-quests path/to/file.json [...]  # validate specific files
    validate-quests --file-list FILE         # validate paths listed in FILE (CI)
"""

import argparse
import json
import sys
from pathlib import Path

import jsonschema

# Locate the repository root relative to this file so the script works
# regardless of the working directory it is invoked from.
REPO_ROOT = Path(__file__).parent.parent
SCHEMA_DIR = REPO_ROOT / "schema"
QUESTS_DIR = REPO_ROOT / "quests"


def semver_tuple(v):
    try:
        return tuple(int(x) for x in v.split("."))
    except Exception:
        return (0, 0, 0)


def patch_schema(schema, version):
    """Patch pre-3.0.0 schemas to only require quest_answer_choices for
    choice-based quest types, matching the corrected behavior in 3.0.0.
    The old schemas require it unconditionally, which incorrectly rejects
    valid Numeric and TextEntry quests.
    """
    if semver_tuple(version) >= (3, 0, 0):
        return
    question_def = schema.get("definitions", {}).get("Question", {})
    required = question_def.get("required", [])
    if "quest_answer_choices" not in required:
        return
    required.remove("quest_answer_choices")
    question_def.setdefault("allOf", []).append(
        {
            "if": {
                "properties": {
                    "quest_type": {"enum": ["ExclusiveChoice", "MultipleChoice"]}
                }
            },
            "then": {"required": ["quest_answer_choices"]},
        }
    )


def find_all_quest_files():
    """Return sorted relative paths for all JSON files under quests/."""
    return sorted(
        str(p.relative_to(REPO_ROOT)).replace("\\", "/")
        for p in QUESTS_DIR.rglob("*.json")
    )


def validate_files(files):
    """Validate the given list of quest file paths. Returns exit code (0 or 1)."""
    errors = []
    schema_cache = {}

    for path_str in files:
        path = Path(path_str)
        if not path.is_absolute():
            path = REPO_ROOT / path

        print(f"\nValidating: {path_str}")

        # Parse the quest file as JSON
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            errors.append(f"[{path_str}] Invalid JSON: {e}")
            continue
        except FileNotFoundError:
            # File deleted in the PR being validated
            print("  Skipped (file not found)")
            continue

        # v1.0.0 quest files are bare JSON arrays with no version field
        version = "1.0.0" if isinstance(
            data, list) else data.get("version", "3.0.0")
        schema_file = SCHEMA_DIR / f"schema-{version}.json"
        schema_key = str(schema_file)

        if schema_key not in schema_cache:
            if not schema_file.exists():
                errors.append(
                    f"[{path_str}] No schema file for version '{version}'"
                    f" (expected {schema_file})"
                )
                continue
            loaded = json.loads(schema_file.read_text(encoding="utf-8"))
            patch_schema(loaded, version)
            schema_cache[schema_key] = loaded

        schema = schema_cache[schema_key]

        # Validate against the schema, collecting all errors for this file
        validator = jsonschema.Draft7Validator(schema)
        file_errors = list(validator.iter_errors(data))

        if file_errors:
            for e in file_errors:
                location = (
                    " -> ".join(str(p) for p in e.absolute_path)
                    if e.absolute_path
                    else "root"
                )
                errors.append(
                    f"[{path_str}] Validation failed at '{location}': {e.message}"
                )
        else:
            print(f"  OK - Valid (schema v{version})")

    print(f"\n{'=' * 50}")
    if errors:
        print(f"FAILED: {len(errors)} error(s) found:\n")
        for err in errors:
            print(f"  - {err}")
        return 1
    else:
        print(f"OK: All {len(files)} file(s) passed validation.")
        return 0


def main():
    parser = argparse.ArgumentParser(
        prog="validate-quests",
        description="Validate quest JSON files against their schema version.",
    )
    parser.add_argument(
        "files",
        nargs="*",
        metavar="FILE",
        help=(
            "Quest JSON file(s) to validate. "
            "Omit to validate all files under quests/."
        ),
    )
    parser.add_argument(
        "--file-list",
        metavar="PATH",
        help="Text file with one quest file path per line (used by CI).",
    )
    args = parser.parse_args()

    if args.file_list:
        with open(args.file_list) as f:
            files = [line.strip() for line in f if line.strip()]
    elif args.files:
        files = list(args.files)
    else:
        files = find_all_quest_files()

    if not files:
        print("No quest JSON files to validate.")
        sys.exit(0)

    sys.exit(validate_files(files))


if __name__ == "__main__":
    main()
