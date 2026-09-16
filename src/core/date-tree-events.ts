import { normalizePath } from "obsidian";

import type DateTreesPlugin from "../main";
import type { DateTreeEntry } from "../types";

/**
 * Registers vault-wide events. Logs failures to the developer console.
 */
function registerDateTreeEvents(plugin: DateTreesPlugin): void {
  // Handle file/folder rename events.
  plugin.registerEvent(
    plugin.app.vault.on("rename", (file, oldPath) => {
      void updateConfiguredPathsAfterRename(plugin, oldPath, file.path).catch(
        (error: unknown) => {
          console.error("Date trees: could not save renamed paths", error);
        },
      );
    }),
  );

  // Handle file/folder delete events.
  plugin.registerEvent(
    plugin.app.vault.on("delete", (file) => {
      void updateConfiguredPathsAfterDelete(plugin, file.path).catch(
        (error: unknown) => {
          console.error("Date trees: could not save deleted paths", error);
        },
      );
    }),
  );
}

/**
 * Keeps plugin settings in sync with the vault state by handling deleted files
 * and folders.
 */
async function updateConfiguredPathsAfterDelete(
  plugin: DateTreesPlugin,
  deletedPathRaw: string,
): Promise<void> {
  const deletedPath = normalizePath(deletedPathRaw);
  let changed = false;

  const survivingTrees = plugin.settings.trees.filter((tree) => {
    if (matchesPathPrefix(tree.folderPath, deletedPath)) {
      changed = true;
      return false;
    }

    if (
      tree.templatePath &&
      matchesPathPrefix(tree.templatePath, deletedPath)
    ) {
      tree.templatePath = "";
      changed = true;
    }

    return true;
  });

  if (changed) {
    plugin.settings.trees = survivingTrees;
    await plugin.saveSettings();
  }
}

/**
 * Keeps plugin settings in sync with the vault state by handling renamed files
 * and folders.
 */
async function updateConfiguredPathsAfterRename(
  plugin: DateTreesPlugin,
  oldPathRaw: string,
  newPathRaw: string,
): Promise<void> {
  const oldPath = normalizePath(oldPathRaw);
  const newPath = normalizePath(newPathRaw);

  // Maps paths that changed to their corresponding date trees in the settings.
  // We use this later to resolve duplicates.
  const renamedTrees = new Map<string, DateTreeEntry>();

  // Track if anything actually changed.
  let changed = false;

  for (const tree of plugin.settings.trees) {
    const newFolderPath = replacePathPrefix(tree.folderPath, oldPath, newPath);
    const newTemplatePath = replacePathPrefix(
      tree.templatePath,
      oldPath,
      newPath,
    );

    if (newFolderPath !== tree.folderPath) {
      renamedTrees.set(newFolderPath, tree);
    }

    if (
      newFolderPath !== tree.folderPath ||
      newTemplatePath !== tree.templatePath
    ) {
      tree.folderPath = newFolderPath;
      tree.templatePath = newTemplatePath;
      changed = true;
    }
  }

  if (!changed) {
    return;
  }

  // If one entry points to Old/Journal and a stale entry already points to
  // New/Journal, moving Old to New makes both point to New/Journal. Keep the
  // entry that was moved and remove the stale one.
  plugin.settings.trees = plugin.settings.trees.filter((tree) => {
    const renamedTree = renamedTrees.get(tree.folderPath);
    return !renamedTree || renamedTree === tree;
  });

  await plugin.saveSettings();
}

/**
 * Replace `oldPath` with `newPath` if `stored` matches it or is inside that
 * folder. Preserve the rest of the path; return unrelated paths unchanged.
 *
 * Example: replacePathPrefix("Work/Journal", "Work", "Personal") returns
 * "Personal/Journal".
 */
function replacePathPrefix(
  stored: string,
  oldPath: string,
  newPath: string,
): string {
  if (matchesPathPrefix(stored, oldPath)) {
    return newPath + stored.slice(oldPath.length);
  }
  return stored;
}

/**
 * Match an exact path or a descendant at a slash boundary: "Work" matches
 * "Work/Journal", but not "Workshop".
 */
function matchesPathPrefix(stored: string, path: string): boolean {
  return stored === path || stored.startsWith(path + "/");
}

export { registerDateTreeEvents };
