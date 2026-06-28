import {
  App,
  PluginSettingTab,
  Setting,
  SettingGroup,
  normalizePath,
} from "obsidian";

import DateTreesPlugin from "./main";

export interface DateTreeEntry {
  folderPath: string;
  templatePath: string;
}

export interface DateTreesSettings {
  trees: DateTreeEntry[];
}

export const DEFAULT_SETTINGS: DateTreesSettings = {
  trees: [],
};

/**
 * Coerce arbitrary persisted data into a valid settings object. `loadData()`
 * can return anything (corrupt file, older schema, hand-edited JSON), so we
 * never trust its shape and drop entries that don't look like a DateTreeEntry.
 */
export function normalizeSettings(data: unknown): DateTreesSettings {
  const raw = (data ?? {}) as Partial<DateTreesSettings>;
  const trees = Array.isArray(raw.trees) ? raw.trees : [];

  const cleaned: DateTreeEntry[] = [];
  const seen = new Set<string>();

  for (const entry of trees) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const folderPath =
      typeof entry.folderPath === "string"
        ? normalizePath(entry.folderPath.trim())
        : "";

    if (folderPath.length === 0 || seen.has(folderPath)) {
      continue;
    }

    const templatePath =
      typeof entry.templatePath === "string" && entry.templatePath.trim()
        ? normalizePath(entry.templatePath.trim())
        : "";

    seen.add(folderPath);
    cleaned.push({ folderPath, templatePath });
  }

  return { trees: cleaned };
}

export class DateTreesSettingTab extends PluginSettingTab {
  plugin: DateTreesPlugin;

  constructor(app: App, plugin: DateTreesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const foldersDescText = createFragment();
    foldersDescText.appendText(
      "To mark folders as date trees, right click them in the navigator and click ",
    );
    foldersDescText.appendChild(
      createEl("strong", {
        text: "Mark as date tree",
      }),
    );
    foldersDescText.appendText(".");

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
        setting
          .setName(entry.folderPath)
          .setDesc(`Template: ${entry.templatePath || "(none)"}`)
          .addExtraButton((btn) =>
            btn
              .setIcon("trash")
              .setTooltip("Remove")
              .onClick(async () => {
                this.plugin.settings.trees = this.plugin.settings.trees.filter(
                  (t) => t.folderPath !== entry.folderPath,
                );
                await this.plugin.saveSettings();
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
