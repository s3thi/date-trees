import { MarkdownView, Notice } from "obsidian";

import { findNearestDateTree } from "../core/date-tree-path";
import { findNewerNote, findOlderNote } from "../core/date-tree-navigation";
import type DateTreesPlugin from "../main";
import { openFileInTab } from "../ui/open-file";

/**
 * Goes to the nearest day note in the requested direction.
 */
async function goToChronologicallyAdjacentNote(
  plugin: DateTreesPlugin,
  direction: "newer" | "older",
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
    new Notice("This note is not inside a date tree.");
    return;
  }
  const result =
    direction === "newer"
      ? findNewerNote(vault, tree, currentNote)
      : findOlderNote(vault, tree, currentNote);
  if (result.status === "invalid-tree") {
    new Notice("The root folder for this date tree is invalid or missing.");
    return;
  }
  if (result.status === "invalid-current-note") {
    new Notice("This note lives inside a date tree, but it's not a day note.");
    return;
  }
  if (result.status === "no-adjacent-note") {
    new Notice(`No ${direction} note in this date tree.`);
    return;
  }

  // Keep a pinned tab on its current note. Focus an existing tab that shows
  // the older or newer note, or open a new tab if needed.
  if (view.leaf.getViewState().pinned) {
    await openFileInTab(workspace, result.note);
  } else {
    // Replace the current note only when its tab is unpinned.
    await view.leaf.openFile(result.note);
  }
}

export { goToChronologicallyAdjacentNote };
