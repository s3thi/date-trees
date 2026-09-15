# Date Trees

An Obsidian plugin for organizing chronological notes in a date tree directory structure, inspired by org-mode.

## What is a date tree?

A date tree is a folder hierarchy that organizes notes by date:

+ Journal
  + 2026
    + 2026-05 May
      - 2026-05-01 Friday.md
      - 2026-05-02 Saturday.md
      - 2026-05-03 Sunday.md

Each year is a folder. Each month is a folder named `YYYY-MM Month`. Each day is a file named `YYYY-MM-DD Weekday.md`.

Month and weekday names follow the configured locale. **English** uses US English names (e.g. `May`, `Friday`); **System** uses your operating system's locale. The numeric `YYYY-MM-DD` prefix is always Gregorian with Latin digits, so day files stay consistently sortable regardless of locale.

## Usage

- Mark folders as date trees by right-clicking them in the file explorer and selecting **Mark as date tree**, or via the **Mark folder as date tree** command in the command palette. You can mark multiple folders, and even the vault root.
- When marking a folder, you can optionally choose a template for that tree. To change it later, right-click an already-marked folder and select **Change date tree template**.
- To remove a date tree, right-click it and select **Unmark as date tree**, use the **Unmark folder as date tree** command, or use the trash button next to the entry in plugin settings.
- The settings tab lists your configured date trees and their templates (but cannot add or edit them).
- Use the **Today's note in date tree** command to add a file for today inside a date tree. If you have more than one date tree, you'll be asked which to use. The plugin creates any missing year/month folders for you. If today's file already exists, it is opened instead of recreated.

## Releasing

Use pnpm to bump versions and Git to commit and tag the release. Start with a clean working tree on `main`. Replace `1.1.0` below with the release version, without a leading `v`.

```sh
git switch main
git status
pnpm version 1.1.0 --no-git-tag-version
pnpm run lint
pnpm run build
git diff
```

The flag prevents an automatic commit and tag so you can review and build first. The version script updates `manifest.json` and adds the minimum Obsidian version to `versions.json`. Review the diff: `package.json` and `manifest.json` must match the release version, and `versions.json` must map it to `manifest.json`'s `minAppVersion`.

Commit the reviewed version files, tag the release, and push both the branch and tag:

```sh
git add package.json manifest.json versions.json
git commit -m "Release 1.1.0"
git tag -a 1.1.0 -m "Release 1.1.0"
git push origin main
git push origin tag 1.1.0
```

Create a GitHub release for that exact tag and attach `main.js`, `manifest.json`, and `styles.css`. Keep generated build artifacts out of version control.

## Planned

The following features are not yet implemented:

- **Previous day**, and **Next day** commands for navigating between daily notes inside a date tree.
