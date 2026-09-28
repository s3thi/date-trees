import type DateTreesPlugin from "../main";
import { goToChronologicallyAdjacentNote } from "../commands/navigate-date-tree";
import { runCommand } from "./run-command";

/**
 * Adds older and newer note buttons to the ribbon.
 */
function registerRibbonNavigation(plugin: DateTreesPlugin): void {
  plugin.addRibbonIcon("arrow-left", "Date trees: Go to older note", () => {
    runCommand(() => goToChronologicallyAdjacentNote(plugin, "older"));
  });

  plugin.addRibbonIcon("arrow-right", "Date trees: Go to newer note", () => {
    runCommand(() => goToChronologicallyAdjacentNote(plugin, "newer"));
  });
}

export { registerRibbonNavigation };
