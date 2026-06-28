import { TFolder } from "obsidian";

import type DateTreesPlugin from "../main";
import { markFolderAsDateTree } from "../commands/mark-date-tree";
import { unmarkFolderAsDateTree } from "../commands/unmark-date-tree";
import { isDateTree } from "../core/settings";

function registerContextMenus(plugin: DateTreesPlugin) {
  // Add a right-click menu to the file explorer to configure date-trees.
  plugin.registerEvent(
    plugin.app.workspace.on("file-menu", (menu, file) => {
      // Skip adding menu item if it's not a folder.
      if (!(file instanceof TFolder)) {
        return;
      }

      const isMarked = isDateTree(plugin, file.path);

      // Add menu item to mark as date tree or change template.
      menu.addItem((item) => {
        item.setTitle(
          isMarked ? "Change date tree template" : "Mark as date tree",
        );
        item.onClick(() => {
          void markFolderAsDateTree(plugin, file);
        });
      });

      if (isMarked) {
        // Add menu item to unmark as date tree.
        menu.addItem((item) => {
          item.setTitle("Unmark as date tree");
          item.onClick(() => {
            void unmarkFolderAsDateTree(plugin, file);
          });
        });

        menu.addItem((item) => {
          item.setTitle("Today's note in ${this date tree}");
          item.onClick(() => {
            // TODO
          });
        });
      }
    }),
  );
}

export { registerContextMenus };
