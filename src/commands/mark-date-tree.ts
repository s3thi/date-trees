import { Notice, TFile, TFolder } from "obsidian";

import type DateTreesPlugin from "../main";
import { pick } from "../ui/picker";
import { markOrUpdateDateTree } from "../core/settings";
import { treeDisplayName } from "../core/date-tree-path";

/**
 * Marks the folder passed in as argument as a date tree.
 */
async function markFolderAsDateTree(
  plugin: DateTreesPlugin,
  folder: TFolder,
): Promise<void> {
  const folderName = treeDisplayName(folder.path);

  // Pick a template for this folder.
  const result = await pick<TFile | null>(
    plugin.app,
    [null, ...plugin.app.vault.getMarkdownFiles()],
    (item) => (item === null ? "No template" : item.path),
    {
      placeholder: `Pick a template for ${folderName} (or choose no template)…`,
      title: "Select template",
    },
  );

  // If the user cancelled out of the file picker, don't do anything.
  if (result.wasCancelled) {
    return;
  }

  const { wasUpdated, entry } = await markOrUpdateDateTree(
    plugin,
    folder.path,
    result.value === null ? "" : result.value.path,
  );
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
  const folderResult = await pick<TFolder>(
    plugin.app,
    collectFolders(plugin.app.vault.getRoot()),
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

/**
 * Collects every folder under `root` (inclusive of `root`).
 */
function collectFolders(root: TFolder): TFolder[] {
  const out: TFolder[] = [root];
  const stack: TFolder[] = [root];

  while (stack.length > 0) {
    const folder = stack.pop()!;
    for (const child of folder.children) {
      if (child instanceof TFolder) {
        out.push(child);
        stack.push(child);
      }
    }
  }

  return out;
}

export { markFolderAsDateTree, pickFolderAndMarkAsDateTree };
