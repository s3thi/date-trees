import { Notice, TFile, TFolder } from "obsidian";

import { upsertDateTree } from "../core/dateTrees";
import type DateTreesPlugin from "../main";
import { pick } from "../ui/picker";

/**
 * Core: mark a folder as a date tree. Opens a single fuzzy-find modal listing
 * "No template" followed by every markdown file in the vault; persists the
 * chosen entry to settings. Aborts silently if the user closes without choosing.
 *
 * Both the right-click menu entry and the command-palette entry funnel here.
 */
export async function markFolderAsDateTree(
  plugin: DateTreesPlugin,
  folder: TFolder,
): Promise<void> {
  const folderName = folder.name || "/";

  // Built once: getMarkdownFiles() is evaluated here, not per keystroke.
  const result = await pick<TFile | null>(
    plugin.app,
    [null, ...plugin.app.vault.getMarkdownFiles()],
    (item) => (item === null ? "No template" : item.path),
    {
      placeholder: `Pick a template for ${folderName} (or choose no template)…`,
      title: "Select template",
    },
  );
  if (result.cancelled) {
    return;
  }

  const { status, entry } = await upsertDateTree(
    plugin,
    folder.path,
    result.value === null ? "" : result.value.path,
  );
  new Notice(
    entry.templatePath
      ? `Date tree ${status}: ${entry.folderPath} (template: ${entry.templatePath})`
      : `Date tree ${status}: ${entry.folderPath}`,
  );
}

/**
 * Command-palette entry: prompt the user for a folder via the fuzzy picker,
 * then delegate to {@link markFolderAsDateTree} for template selection and
 * persistence. Aborts silently if the folder picker is dismissed.
 *
 * The root folder ("/") is intentionally included: a user may want their
 * entire vault treated as a date tree.
 */
export async function markFolderAsDateTreeViaPicker(
  plugin: DateTreesPlugin,
): Promise<void> {
  // Built once by walking the vault tree from the root (see picker.ts).
  const folderResult = await pick<TFolder>(
    plugin.app,
    collectFolders(plugin.app.vault.getRoot()),
    (folder) => (folder.isRoot() ? "/" : folder.path),
    { placeholder: "Pick a folder…", title: "Select folder" },
  );
  if (folderResult.cancelled) {
    return;
  }
  await markFolderAsDateTree(plugin, folderResult.value);
}

/** Recursively collect every TFolder under `root` (inclusive of `root`). */
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
