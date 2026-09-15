import type DateTreesPlugin from "../main";
import { pickFolderAndMarkAsDateTree } from "../commands/mark-date-tree";
import { pickFolderAndUnmarkAsDateTree } from "../commands/unmark-date-tree";
import { pickDateTreeAndCreateTodaysNote } from "../commands/create-todays-note";
import { runCommand } from "./run-command";

function registerCommands(plugin: DateTreesPlugin) {
  plugin.addCommand({
    id: "mark-folder-as-date-tree",
    name: "Mark folder as date tree…",
    callback: () => {
      runCommand(() => pickFolderAndMarkAsDateTree(plugin));
    },
  });

  plugin.addCommand({
    id: "unmark-folder-as-date-tree",
    name: "Unmark folder as date tree…",
    callback: () => {
      runCommand(() => pickFolderAndUnmarkAsDateTree(plugin));
    },
  });

  plugin.addCommand({
    id: "create-todays-note",
    name: "Open today's note in date tree",
    callback: () => {
      runCommand(() => pickDateTreeAndCreateTodaysNote(plugin));
    },
  });
}

export { registerCommands };
