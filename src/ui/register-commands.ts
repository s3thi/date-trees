import type DateTreesPlugin from "../main";
import { pickFolderAndMarkAsDateTree } from "../commands/mark-date-tree";
import { pickFolderAndUnmarkAsDateTree } from "../commands/unmark-date-tree";
import { pickDateTreeAndCreateTodaysNote } from "../commands/create-todays-note";
import { openAdjacentNoteInDateTree } from "../commands/navigate-date-tree";
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
    id: "open-todays-note",
    name: "Open today's note…",
    callback: () => {
      runCommand(() => pickDateTreeAndCreateTodaysNote(plugin));
    },
  });

  plugin.addCommand({
    id: "open-next-note",
    name: "Open next note",
    callback: () => {
      runCommand(() => openAdjacentNoteInDateTree(plugin, "next"));
    },
  });

  plugin.addCommand({
    id: "open-previous-note",
    name: "Open previous note",
    callback: () => {
      runCommand(() => openAdjacentNoteInDateTree(plugin, "previous"));
    },
  });
}

export { registerCommands };
