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
 * Updates tree and template paths after a file or folder is renamed or moved.
 * Keeps the moved tree when paths collide and saves only if settings changed.
 */
async function updateConfiguredPathsAfterRename(
  plugin: DateTreesPlugin,
  oldPathRaw: string,
  newPathRaw: string,
): Promise<void> {
  // Normalize both paths so they can be compared with the saved paths.
  const oldPath = normalizePath(oldPathRaw);
  const newPath = normalizePath(newPathRaw);

  // Remember which trees moved to each new path. We'll use this to keep the
  // moved tree if another entry already points to the same folder.
  const renamedTrees = new Map<string, DateTreeEntry>();

  // Track whether any saved paths change so we only save when needed.
  let changed = false;

  // Check every tree's folder and template paths. Replace the renamed path
  // wherever it matches, including paths inside a renamed folder.
  for (const tree of plugin.settings.trees) {
    const newFolderPath = replacePathPrefix(tree.folderPath, oldPath, newPath);
    const newTemplatePath = replacePathPrefix(
      tree.templatePath,
      oldPath,
      newPath,
    );

    // If the tree's folder moved, remember the tree at its new path.
    if (newFolderPath !== tree.folderPath) {
      renamedTrees.set(newFolderPath, tree);
    }

    // If either path changed, update the entry and mark settings for saving.
    if (
      newFolderPath !== tree.folderPath ||
      newTemplatePath !== tree.templatePath
    ) {
      tree.folderPath = newFolderPath;
      tree.templatePath = newTemplatePath;
      changed = true;
    }
  }

  // If the rename didn't affect any configured paths, stop here.
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

  // Save the updated paths after removing any stale entries.
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
