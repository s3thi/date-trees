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

## Usage

- In plugin settings, mark one or more folders in your vault as date trees.
- Use the **Create today's note** command to add a file for today inside a date tree. The plugin creates any missing year/month folders for you.
- When viewing a note inside a date tree, use **Jump to today** to open today's file, and **Previous day** / **Next day** to navigate between daily notes.

New day files are created from a template you choose in settings.
