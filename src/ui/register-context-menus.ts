import { TFolder } from "obsidian";

import type DateTreesPlugin from "../main";
import { createTodaysNoteInTree } from "../commands/create-todays-note";
import { markFolderAsDateTree } from "../commands/mark-date-tree";
import { unmarkFolderAsDateTree } from "../commands/unmark-date-tree";
import { isDateTree } from "../core/settings";
import {
  findNearestDateTree,
  treeDisplayName,
} from "../core/date-tree-path";

function registerContextMenus(plugin: DateTreesPlugin) {
  // Add a right-click menu to the file explorer to configure date-trees.
  plugin.registerEvent(
    plugin.app.workspace.on("file-menu", (menu, file) => {
      // Offer today's note on the date tree folder itself and on any file or
      // folder inside it.
      const tree = findNearestDateTree(plugin, file.path);
      if (tree) {
        const treeName = treeDisplayName(tree.folderPath);
        menu.addItem((item) => {
          item.setTitle(`Open today's note in "${treeName}"`);
          item.onClick(() => {
            void createTodaysNoteInTree(plugin, tree);
          });
        });
      }

      // The remaining items configure a folder, so skip files.
      if (!(file instanceof TFolder)) {
        return;
      }

      if (isDateTree(plugin, file.path)) {
        // Add menu item to unmark as date tree.
        menu.addItem((item) => {
          item.setTitle(`Unmark as date tree`);
          item.onClick(() => {
            void unmarkFolderAsDateTree(plugin, file);
          });
        });
      } else {
        // Add menu item to mark as date tree.
        menu.addItem((item) => {
          item.setTitle("Mark as date tree…");
          item.onClick(() => {
            void markFolderAsDateTree(plugin, file);
          });
        });
      }
    }),
  );
}

export { registerContextMenus };
