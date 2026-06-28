import type DateTreesPlugin from "../main";
import { markFolderAsDateTreeViaPicker } from "../commands/mark-date-tree";
import { unmarkFolderAsDateTreeViaPicker } from "../commands/unmark-date-tree";
import { createTodaysNote } from "../commands/create-todays-note";

function registerCommands(plugin: DateTreesPlugin) {
  plugin.addCommand({
    id: "mark-folder-as-date-tree",
    name: "Mark folder as date tree…",
    callback: () => {
      void markFolderAsDateTreeViaPicker(plugin);
    },
  });

  plugin.addCommand({
    id: "unmark-folder-as-date-tree",
    name: "Unmark folder as date tree…",
    callback: () => {
      void unmarkFolderAsDateTreeViaPicker(plugin);
    },
  });

  plugin.addCommand({
    id: "create-todays-note",
    name: "Open today's note in date tree",
    callback: () => {
      void createTodaysNote(plugin);
    },
  });
}

export { registerCommands };
