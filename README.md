# Date Trees

An Obsidian plugin for organizing chronological notes into a tree of folders that's easier to navigate than a flat list of files.

## What is a date tree?

A date tree is a hierarchical structure inspired by the way `org-mode` organizes chronological outlines. From [the `org-mode` documentation](https://orgmode.org/manual/Template-elements.html#FOOT86):

> A date tree is an outline structure with years on the highest level, months or ISO weeks as sublevels and then dates on the lowest level.

When applied to a folder structure, it looks something like this:

```
- Journal
  - 2026
    - 2026-05 May
      - 2026-05-01 Friday.md
      - 2026-05-02 Saturday.md
      - 2026-05-03 Sunday.md
```

In this structure, each year is a folder, each month is a folder named `YYYY-MM Month`, and each day is a file named `YYYY-MM-DD Weekday.md`.

This structure automatically sorts in chronological order at every level of the hierarchy when you select "Sort by name" in any file manager, text editor, or notes app. It's easier to navigate and work with than the flat structure Obsidian's `Daily notes` plugin uses by default.

## Usage

- Mark an existing folder by right-clicking it in the file explorer and selecting **Mark as date tree…**, or by using **Mark folder as date tree…** in the command palette. You can mark multiple folders. To mark the vault root, select `/` in the command's folder picker.
- Choose a Markdown file from your vault as the tree's template, or select **No template** for empty notes. To change or remove a template later, run **Mark folder as date tree…** again and select the same folder.
- Use **Open today's note in date tree** in the command palette to create and open today's note, using your device's local date. If you have more than one tree, you'll be asked which one to use. The plugin creates missing year and month folders. If the note already exists at the expected path, it opens without changing its content.
- You can also right-click a tree folder or any file or folder inside it and choose **Open today's note in "Folder Name"**. For nested trees, this uses the nearest enclosing tree.
- To unmark a tree, right-click its root folder and select **Unmark as date tree**, use **Unmark folder as date tree…**, or click its trash button in **Settings → Date Trees**. Unmarking a date tree does not delete any existing notes.

## Locale settings

In the plugin settings, **Locale** controls month and weekday names: **English** (the default) uses US English, and **System** uses the system locale. Regardless of which locale you pick, numeric date prefixes will always use the Gregorian calendar and Latin digits.

Changing the locale does not rename existing files or folders, so choose a locale and stick with it. Otherwise, you might end up with inconsistent month and weekday names across your folders and files.

## Reorganizing your vault

In most cases, this plugin automatically tracks renamed, moved, or deleted date tree folders and templates. If you reorganize your vault, your date trees will usually continue to work as before.

However, automatic updates can fail—for example, if an external program changes your vault while Obsidian is not running. In these cases, the plugin will show an error in the settings pane. To fix the problem, remove the date tree entry from the settings and add it again with the updated folder and template.

## LLM use

Almost all of the code in this repository was written by an LLM. I've reviewed every line of LLM generated code using my own squishy human brain.

That said, I'm not an expert at building Obsidian plugins. I'm certain I've allowed some mistakes to slip through. If you notice something wrong with the codebase, I would appreciate a PR, bug report, or [email](contact@ankursethi.com).

Code contributions to this plugin are welcome from both humans and LLMs. However, please make sure you write your PR descriptions and bug reports entirely by hand. If a PR description or bug report appears to be written by an LLM, I will close the PR or issue without explanation or appeal.
