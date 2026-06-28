import { Notice, TFolder, normalizePath } from "obsidian";

import { removeDateTree } from "../core/dateTrees";
import type DateTreesPlugin from "../main";
import { type DateTreeEntry } from "../types";
import { pick } from "../ui/picker";

/**
 * Unmark a folder (by path) and notify the user. Idempotent — shows nothing if
 * the path wasn't marked. Operates on a path string because callers include
 * stored entries whose folder may no longer exist on disk (right-click menu and
 * command picker). The settings list calls core `removeDateTree` directly to
 * stay silent.
 */
export async function unmarkDateTreeByPath(
  plugin: DateTreesPlugin,
  folderPathRaw: string,
): Promise<void> {
  if (await removeDateTree(plugin, folderPathRaw)) {
    new Notice(`Date tree unmarked: ${normalizePath(folderPathRaw)}`);
  }
}

/**
 * Right-click menu entry: unmark a folder. Mirrors {@link markFolderAsDateTree}.
 */
export async function unmarkFolderAsDateTree(
  plugin: DateTreesPlugin,
  folder: TFolder,
): Promise<void> {
  await unmarkDateTreeByPath(plugin, folder.path);
}

/**
 * Command-palette entry: prompt the user for a configured date tree via the
 * fuzzy picker, then unmark it. Shows a notice and aborts if no date trees
 * are configured. Aborts silently if the picker is dismissed.
 */
export async function unmarkFolderAsDateTreeViaPicker(
  plugin: DateTreesPlugin,
): Promise<void> {
  if (plugin.settings.trees.length === 0) {
    new Notice("No date trees configured.");
    return;
  }

  // Built once (see picker.ts).
  const result = await pick<DateTreeEntry>(
    plugin.app,
    plugin.settings.trees,
    (item) => item.folderPath,
    {
      placeholder: "Pick a date tree to unmark…",
      title: "Unmark as date tree",
    },
  );
  if (result.cancelled) {
    return;
  }
  await unmarkDateTreeByPath(plugin, result.value.folderPath);
}
