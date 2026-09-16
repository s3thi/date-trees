# Date Trees

An Obsidian plugin for organizing chronological notes into a tree of folders that's easier to navigate than a flat list of files.

## What is a date tree?

A date tree is a hierarchical structure inspired by the way `org-mode` organizes chronological outlines. From [the `org-mode` documentation](https://orgmode.org/manual/Template-elements.html#FOOT86):

> A date tree is an outline structure with years on the highest level, months or ISO weeks as sublevels and then dates on the lowest level.

When applied to a folder structure, it looks something like this:

```
- Journal/
  - 2026/
    - 2026-05 May/
      - 2026-05-01 Friday.md
      - 2026-05-02 Saturday.md
      - 2026-05-03 Sunday.md
```

In this structure, each year is a folder, each month is a folder named `YYYY-MM Month`, and each day is a file named `YYYY-MM-DD Weekday.md`.

This structure automatically sorts in chronological order when you select "Sort by name" in any file manager, text editor, or notes app. It's easier to navigate than the flat structure Obsidian's `Daily notes` plugin uses by default, especially when the number of notes grows into the hundreds.

## Basic usage

- Mark an existing folder as a date tree by right-clicking it in the file explorer and selecting **Mark as date tree…**.
- You can optionally choose a Markdown file from your vault as the tree's template, or just select **No template**.
- Use **Open today's note in date tree** in the command palette to create and open today's note. If you have more than one tree, you'll be asked which one to use. The plugin automatically creates missing year and month folders. If the note already exists at the expected path, it opens without changing its content.
- You can also right-click a tree folder (or any file or folder inside it) and choose **Open today's note in "Folder Name"**.
- To unmark a tree, right-click its root folder and select **Unmark as date tree**. Unmarking a date tree does not delete or change any existing notes.

## Locale settings

In the plugin settings, **Locale** controls the language used for month and weekday names: **English** (the default) uses US English, and **System** uses the system locale. Regardless of which locale you pick, numeric date prefixes will always use the Gregorian calendar and Latin digits.

Changing the locale does not rename existing files or folders, so choose a locale and stick with it. Otherwise, you might end up with inconsistent month and weekday names across your vault.

## Reorganizing your vault

In most cases, this plugin automatically tracks renamed, moved, or deleted date tree folders and templates. If you reorganize your vault, your date trees will usually continue to work as before.

However, automatic updates can fail (for example, if you reorganize your vault using a different app when Obsidian is not running). In these cases, the plugin will show an error in the settings pane. To fix the problem, it should be enough to remove the date tree entry from the settings and add it again.

## LLM use

Almost all of the code in this repository was written by an LLM. I've reviewed every line of LLM generated code using my own squishy human brain.

That said, I'm not an expert at building Obsidian plugins. I'm certain I've allowed some (many?) mistakes to slip through. If you notice something wrong with the codebase, I would appreciate a PR, bug report, or [email](contact@ankursethi.com).

Code contributions to this plugin are welcome from both humans and LLMs. However, please make sure you write your PR descriptions and bug reports entirely by hand. If a PR description or bug report appears to be written by an LLM, I will close it without explanation, appeal, or consideration.
