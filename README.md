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

Month and weekday names are currently always US English (e.g. `May`, `Friday`). Selecting an alternative locale is a planned enhancement.

## Usage

- In plugin settings, mark one or more folders in your vault as date trees.
- Use the **Today's note in date tree** command to add a file for today inside a date tree. The plugin creates any missing year/month folders for you.
- When viewing a note inside a date tree, use **Jump to today** to open today's file, and **Previous day** / **Next day** to navigate between daily notes.

New day files are created from a template you choose in settings.
