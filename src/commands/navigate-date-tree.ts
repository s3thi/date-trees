import { MarkdownView, Notice } from "obsidian";

import { findNearestDateTree } from "../core/date-tree-path";
import { findNextNote, findPreviousNote } from "../core/date-tree-navigation";
import type DateTreesPlugin from "../main";
import { openFileInTab } from "../ui/open-file";

/** Opens the adjacent day note from the active Markdown tab. */
async function navigateDateTree(
  plugin: DateTreesPlugin,
  direction: "next" | "previous",
  shouldOpenInNewTab: boolean,
): Promise<void> {
  // Get the note and tab the user is navigating from.
  const { workspace, vault } = plugin.app;
  const view = workspace.getActiveViewOfType(MarkdownView);
  const currentNote = view?.file;
  if (!view || !currentNote) {
    new Notice("Open a date tree note first.");
    return;
  }

  // Find the configured tree containing this note, then find its nearest day
  // note in the requested direction.
  const tree = findNearestDateTree(plugin, currentNote.path);
  if (!tree) {
    new Notice("This note is not in a date tree.");
    return;
  }
  const adjacentNote =
    direction === "next"
      ? findNextNote(vault, tree, currentNote)
      : findPreviousNote(vault, tree, currentNote);
  if (!adjacentNote) {
    new Notice(`No ${direction} note in this date tree.`);
    return;
  }

  // Open the adjacent note in the original tab. For the new-tab case, focus an
  // existing tab that already shows it instead of opening a duplicate.
  if (shouldOpenInNewTab) {
    await openFileInTab(workspace, adjacentNote);
  } else {
    await view.leaf.openFile(adjacentNote);
  }
}

export { navigateDateTree };
