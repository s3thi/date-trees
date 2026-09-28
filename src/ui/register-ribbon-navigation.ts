import type DateTreesPlugin from "../main";
import { openAdjacentNoteInDateTree } from "../commands/navigate-date-tree";
import { runCommand } from "./run-command";

/** Adds previous and next note buttons to the ribbon. */
function registerRibbonNavigation(plugin: DateTreesPlugin): void {
  plugin.addRibbonIcon("arrow-left", "Date trees: Open previous note", () => {
    runCommand(() => openAdjacentNoteInDateTree(plugin, "previous"));
  });

  plugin.addRibbonIcon("arrow-right", "Date trees: Open next note", () => {
    runCommand(() => openAdjacentNoteInDateTree(plugin, "next"));
  });
}

export { registerRibbonNavigation };
