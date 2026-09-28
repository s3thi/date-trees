import {
  App,
  Notice,
  PluginSettingTab,
  type SettingDefinition,
  type SettingDefinitionItem,
} from "obsidian";

import type DateTreesPlugin from "../main";
import type { DateTreesSettings } from "../types";
import { unmarkDateTree } from "../core/settings";
import { collectDateTreeErrors } from "../core/validators";

/**
 * Defines the plugin settings UI.
 */
class DateTreesSettingTab extends PluginSettingTab {
  plugin: DateTreesPlugin;

  constructor(app: App, plugin: DateTreesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /**
   * Describes settings for native rendering and settings search.
   */
  getSettingDefinitions(): SettingDefinitionItem<keyof DateTreesSettings>[] {
    // Render list of configured date trees. This is a little complex because we
    // want to validate each tree and display any errors we find inside the list
    // UI.
    const trees = this.plugin.settings.trees;
    const items: SettingDefinition<keyof DateTreesSettings>[] = trees.map(
      (entry) => ({
        name: entry.folderPath,
        desc: `Template: ${entry.templatePath || "(none)"}`,
        render: (setting) => {
          // Check the metadata for the current vault each time the row is
          // displayed. We don't want errors encountered during app startup or a
          // previous render to stick around forever.
          for (const error of collectDateTreeErrors(this.app.vault, entry)) {
            setting.descEl.createDiv({ cls: "date-trees-error", text: error });
          }
        },
      }),
    );

    // Let Obsidian render and persist the controls and render the folder list.
    return [
      {
        type: "group",
        heading: "General",
        items: [
          {
            name: "Locale",
            desc: "Controls the language used for day and month names in the date tree.",
            control: {
              type: "dropdown",
              key: "locale",
              options: { english: "English", system: "System" },
            },
          },
        ],
      },
      {
        type: "list",
        heading: "Folders",
        emptyState:
          "No folders configured. Right-click a folder in the file explorer to mark it as a date tree.",
        items,
        onDelete: (index) => {
          // Resolve the displayed entry. Ignore an index outside this list.
          const entry = trees[index];
          if (!entry) return;

          // Saving the removal also refreshes the definitions and search index.
          void unmarkDateTree(this.plugin, entry.folderPath).catch(
            (error: unknown) => {
              new Notice("Could not save the folder removal.");
              console.error("Date trees: could not save folder removal", error);
            },
          );
        },
      },
    ];
  }
}

export { DateTreesSettingTab };
