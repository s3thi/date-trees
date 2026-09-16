import {
  App,
  Notice,
  PluginSettingTab,
  type SettingDefinitionItem,
} from "obsidian";

import type DateTreesPlugin from "../main";
import { unmarkDateTree } from "../core/settings";
import { collectDateTreeErrors } from "../core/validators";

/**
 * Defines the locale control and the list of configured date trees.
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
  getSettingDefinitions(): SettingDefinitionItem<"locale">[] {
    // Keep folder instructions separate from the list so they cannot be deleted.
    const foldersDesc = createFragment();
    foldersDesc.appendText(
      "To mark folders as date trees, right-click them in the file explorer and click ",
    );
    foldersDesc.createEl("strong", { text: "Mark as date tree" });
    foldersDesc.appendText(
      ". You can also use the commands available in the command palette.",
    );

    // Describe each folder using cached vault metadata, without reading files.
    const trees = this.plugin.settings.trees;
    const items = trees.map((entry) => {
      const description = createFragment();
      description.createDiv({
        text: `Template: ${entry.templatePath || "(none)"}`,
      });
      for (const error of collectDateTreeErrors(this.app.vault, entry)) {
        description.createDiv({ cls: "date-trees-error", text: error });
      }
      return { name: entry.folderPath, desc: description };
    });

    // Let Obsidian render and persist the locale dropdown and render the list.
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
      { name: "Folders", desc: foldersDesc },
      {
        type: "list",
        emptyState: "No folders configured as date trees.",
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
