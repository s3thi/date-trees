import { App, PluginSettingTab, SettingGroup } from "obsidian";

import type DateTreesPlugin from "../main";
import { type DateTreeLocale } from "../types";
import { unmarkDateTree } from "../core/settings";
import { collectDateTreeErrors } from "../core/validators";

class DateTreesSettingTab extends PluginSettingTab {
  plugin: DateTreesPlugin;

  constructor(app: App, plugin: DateTreesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const generalHeading = createFragment();
    generalHeading.createDiv({ cls: "setting-item-name", text: "General" });

    const generalSettingGroup = new SettingGroup(containerEl).setHeading(
      generalHeading,
    );

    generalSettingGroup.addSetting((setting) => {
      setting
        .setName("Locale")
        .setDesc(
          "Controls the language used for day and month names in the date tree.",
        )
        .addDropdown((dropdown) => {
          dropdown
            .addOption("english", "English")
            .addOption("system", "System")
            .setValue(this.plugin.settings.locale)
            .onChange(async (value) => {
              this.plugin.settings.locale = value as DateTreeLocale;
              await this.plugin.saveSettings();
            });
        });
    });

    const foldersDescText = createFragment();
    foldersDescText.appendText(
      "To mark folders as date trees, right-click them in the file explorer and click ",
    );
    foldersDescText.appendChild(
      createEl("strong", {
        text: "Mark as date tree",
      }),
    );
    foldersDescText.appendText(
      ". You can also use the commands available in the command palette.",
    );

    const foldersHeading = createFragment();
    foldersHeading.createDiv({ cls: "setting-item-name", text: "Folders" });
    const foldersDesc = foldersHeading.createDiv({
      cls: "setting-item-description",
    });
    foldersDesc.appendChild(foldersDescText);

    const foldersSettingGroup = new SettingGroup(containerEl).setHeading(
      foldersHeading,
    );

    if (this.plugin.settings.trees.length === 0) {
      foldersSettingGroup.addSetting((setting) => {
        setting.setDesc("No folders configured as date trees.");
      });
    }

    for (const entry of this.plugin.settings.trees) {
      foldersSettingGroup.addSetting((setting) => {
        const description = createFragment();
        description.createDiv({
          text: `Template: ${entry.templatePath || "(none)"}`,
        });
        for (const error of collectDateTreeErrors(this.app.vault, entry)) {
          description.createDiv({ cls: "date-trees-error", text: error });
        }
        setting
          .setName(entry.folderPath)
          .setDesc(description)
          .addExtraButton((btn) =>
            btn
              .setIcon("trash")
              .setTooltip("Remove")
              .onClick(async () => {
                await unmarkDateTree(this.plugin, entry.folderPath);
                this.rerender();
              }),
          );
      });
    }
  }

  private rerender(): void {
    this.display();
  }
}

export { DateTreesSettingTab };
