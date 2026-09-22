<!-- @format -->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/).

<!-- Do not remove this commented-out block!

## [Unreleased] - 2026-00-00

### Added

- **Core**:
- **Schema**:
- **Examples**:
- **Components**:
- **Quests**:
- **Creator**:

### Changed

- **Core**:
- **Schema**:
- **Examples**:
- **Components**:
- **Quests**:
- **Creator**:

### Fixed

- **Core**:
- **Schema**:
- **Examples**:
- **Components**:
- **Quests**:
- **Creator**:

-->

## Schema: [v4.0.0] - 2026-09-17

### Added

- **Schema**: Updated schema to new major version: v4.0.0
- **Examples**: Added example for v4.0.0

### Changed

- **Core**: Refreshed agent-facing resources
- **Core**: Updated readme

## Creator: [v0.10.0] - 2026-09-16

### Added

- Added an option to load an existing quest definition directly from the clipboard

### Changed

- Updated UI to improve use of screen space and emphasize presets
- Updated the quest review prompt for LFQD Schema v3.2.0

### Fixed

- Fixed quest preset dependencies being exported with a `null` question ID when dependent quests were added individually

## Creator: [v0.9.1] - 2026-09-16

### Added

- Added link to user manual on the TCAT Wiki

### Changed

- Added explanatory text that AutoCapture quests are currently sidewalks-only
- Implemented minor UI density improvements

## Creator: [v0.9.0] - 2026-09-03

### Added

- Added buttons for duplicating elements, quests, answer choices, feature presets, and custom icons

## Creator: [v0.8.0] - 2026-09-03

### Added

- Added drag-and-drop reordering for elements, quests, answer choices, feature presets, and custom icons

## Creator: [v0.7.1] - 2026-09-03

### Fixed

- Fixed validation panel missing scrolling functionality
- Fixed validation panel missing word wrap

## Creator: [v0.7.0] - 2026-08-31

### Added

- Added support for AutoCapture quest type

## Creator: [v0.6.1] - 2026-08-20

### Fixed

- Fixed the brief layout jump and preview flicker when editing Custom Icons URL fields
- Improved UI when broken images are specified
- Displayed one-based array numbers in validation issue paths to match the Creator UI
- Fixed Feature Presets tag key inputs losing focus and reordering tag rows while typing
- Fixed the resurvey interval default hint being stored as a literal value instead of an integer

## Creator: [v0.6.0] - 2026-08-20

### Added

- Added UI hints for ideal file type, file size, format, and dimensions for custom preset icons, quest icons, and quest images

### Fixed

- Corrected the Creator store test for the initial v3.2.0 definition shape.

## Creator: [v0.5.0] - 2026-08-17

### Changed

- Updated Creator to support LFQD Schema v3.2.0

## Schema: [v3.2.0] - 2026-07-30

### Changed

- Updated schema to v3.2.0 with support for feature presets, custom icons, and recency period customization
