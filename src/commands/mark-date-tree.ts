import { Notice, TFile, TFolder } from "obsidian";

import type DateTreesPlugin from "../main";
import { pick } from "../ui/picker";
import { markOrUpdateDateTree } from "../core/settings";
import { treeDisplayName } from "../core/date-tree-path";

/**
 * Prompts for an optional template, then saves the folder as a date tree.
 * Updates an existing tree. Leaves settings unchanged if the user cancels.
 */
async function markFolderAsDateTree(
  plugin: DateTreesPlugin,
  folder: TFolder,
): Promise<void> {
  // Ask the user to pick a Markdown file as the template for this folder. They
  // can also choose to use no template.
  const folderName = treeDisplayName(folder.path);
  const result = await pick<TFile | null>(
    plugin.app,
    [null, ...plugin.app.vault.getMarkdownFiles()],
    (item) => (item === null ? "No template" : item.path),
    {
      placeholder: `Pick a template for ${folderName} (or choose no template)…`,
      title: "Select template",
    },
  );

  // If the user cancelled the picker, stop here. Nothing has changed yet.
  if (result.wasCancelled) {
    return;
  }

  // Save the folder and its chosen template, updating the tree if it exists. An
  // empty template path means the tree will use no template.
  const { wasUpdated, entry } = await markOrUpdateDateTree(
    plugin,
    folder.path,
    result.value === null ? "" : result.value.path,
  );

  // Tell the user whether the tree was added or updated, and include the
  // template path if they chose one.
  const status = wasUpdated ? "updated" : "added";
  new Notice(
    entry.templatePath
      ? `Date tree ${status}: ${entry.folderPath} (template: ${entry.templatePath})`
      : `Date tree ${status}: ${entry.folderPath}`,
  );
}

/**
 * Marks a folder as a date tree by allowing the user to select it using a fuzzy
 * picker.
 */
async function pickFolderAndMarkAsDateTree(
  plugin: DateTreesPlugin,
): Promise<void> {
  // Allow user to pick any folder in the vault, including the vault root.
  const folderResult = await pick<TFolder>(
    plugin.app,
    plugin.app.vault.getAllFolders(true),
    (folder) => (folder.isRoot() ? "/" : folder.path),
    {
      placeholder: "Pick a folder to mark as date tree…",
      title: "Select folder",
    },
  );

  if (folderResult.wasCancelled) {
    return;
  }

  await markFolderAsDateTree(plugin, folderResult.value);
}

export { markFolderAsDateTree, pickFolderAndMarkAsDateTree };
