import { Keymap } from "obsidian";

import type DateTreesPlugin from "../main";
import { goToChronologicallyAdjacentNote } from "../commands/navigate-date-tree";
import { runCommand } from "./run-command";

/**
 * Adds older and newer note buttons to the ribbon.
 * Cmd/Ctrl-click always opens the destination in a new tab.
 */
function registerRibbonNavigation(plugin: DateTreesPlugin): void {
  plugin.addRibbonIcon("arrow-left", "Date trees: Go to older note", (event) => {
    const shouldOpenInNewTab = Keymap.isModifier(event, "Mod");
    runCommand(() =>
      goToChronologicallyAdjacentNote(plugin, "older", shouldOpenInNewTab),
    );
  });

  plugin.addRibbonIcon("arrow-right", "Date trees: Go to newer note", (event) => {
    const shouldOpenInNewTab = Keymap.isModifier(event, "Mod");
    runCommand(() =>
      goToChronologicallyAdjacentNote(plugin, "newer", shouldOpenInNewTab),
    );
  });
}

export { registerRibbonNavigation };
