import { Plugin } from "obsidian";

import type DateTreesPlugin from "../main";
import { openAdjacentNoteInDateTree } from "../commands/navigate-date-tree";
import { runCommand } from "./run-command";

/**
 * Owns a ribbon button so unloading it runs Obsidian's ribbon cleanup.
 */
class RibbonNavigationButton extends Plugin {}

/**
 * Adds enabled navigation buttons to the ribbon and returns a way to re-render
 * them when the user changes their settings.
 */
function registerRibbonNavigation(plugin: DateTreesPlugin): () => void {
  const registrations = new Map<string, Plugin>();
  const actions = [
    {
      id: "open-previous-note",
      icon: "arrow-left",
      title: "Date Trees: Open previous note",
      direction: "previous",
      shouldOpenInNewTab: false,
    },
    {
      id: "open-next-note",
      icon: "arrow-right",
      title: "Date Trees: Open next note",
      direction: "next",
      shouldOpenInNewTab: false,
    },
    {
      id: "open-previous-note-in-new-tab",
      icon: "square-arrow-left",
      title: "Date Trees: Open previous note in new tab",
      direction: "previous",
      shouldOpenInNewTab: true,
    },
    {
      id: "open-next-note-in-new-tab",
      icon: "square-arrow-right",
      title: "Date Trees: Open next note in new tab",
      direction: "next",
      shouldOpenInNewTab: true,
    },
  ] as const;

  /**
   * Shows or hides ribbon buttons based on the user's settings.
   */
  function update(): void {
    // Check each navigation action in ribbon order.
    for (const action of actions) {
      const shouldShow = action.shouldOpenInNewTab
        ? plugin.settings.shouldShowNewTabNavigationRibbonIcons
        : plugin.settings.shouldShowNavigationRibbonIcons;
      const registration = registrations.get(action.id);

      if (!shouldShow && registration) {
        // Unload the button's owner to remove both the ribbon entry and its DOM
        // element. Removing only the element lets ribbon updates restore it.
        plugin.removeChild(registration);
        registrations.delete(action.id);
      } else if (shouldShow && !registration) {
        // Give each button a child plugin so Obsidian's ribbon cleanup can run
        // when its setting is turned off, or when Date Trees unloads.
        const owner = plugin.addChild(
          new RibbonNavigationButton(plugin.app, plugin.manifest),
        );
        owner.addRibbonIcon(action.icon, action.title, () => {
          runCommand(() =>
            openAdjacentNoteInDateTree(
              plugin,
              action.direction,
              action.shouldOpenInNewTab,
            ),
          );
        });

        // Keep the owner until the user turns this button off.
        registrations.set(action.id, owner);
      }
    }
  }

  // Run an initial update and return the update function so that the settings
  // tab can call it when the user changes their settings.
  update();
  return update;
}

export { registerRibbonNavigation };
