import { Notice, TFolder, normalizePath } from "obsidian";

import type DateTreesPlugin from "../main";
import { type DateTreeEntry } from "../types";
import { pick } from "../ui/picker";
import { unmarkDateTree } from "../core/settings";

/**
 * Unmarks a folder as date tree and notifies the user. Shows nothing if the
 * path wasn't marked.
 */
async function unmarkDateTreeAndNotify(
  plugin: DateTreesPlugin,
  folderPathRaw: string,
): Promise<void> {
  const result = await unmarkDateTree(plugin, folderPathRaw);
  if (result.wasRemoved) {
    new Notice(`Date tree unmarked: ${normalizePath(folderPathRaw)}`);
  }
}

/**
 * Unmarks a folder as date tree. Mirrors {@link markFolderAsDateTree}.
 */
async function unmarkFolderAsDateTree(
  plugin: DateTreesPlugin,
  folder: TFolder,
): Promise<void> {
  await unmarkDateTreeAndNotify(plugin, folder.path);
}

/**
 * Prompts the user for a configured date tree via the fuzzy picker, then
 * unmarks it.
 */
async function unmarkFolderAsDateTreeViaPicker(
  plugin: DateTreesPlugin,
): Promise<void> {
  if (plugin.settings.trees.length === 0) {
    new Notice("No date trees configured.");
    return;
  }

  const result = await pick<DateTreeEntry>(
    plugin.app,
    plugin.settings.trees,
    (item) => item.folderPath,
    {
      placeholder: "Pick a date tree to unmark…",
      title: "Unmark as date tree",
    },
  );

  if (result.wasCancelled) {
    return;
  }

  await unmarkDateTreeAndNotify(plugin, result.value.folderPath);
}

export { unmarkFolderAsDateTree, unmarkFolderAsDateTreeViaPicker };
