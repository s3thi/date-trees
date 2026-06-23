import {
  App,
  Notice,
  PluginSettingTab,
  Setting,
  TFile,
  TFolder,
  normalizePath,
} from "obsidian";

import DateTreesPlugin from "./main";
import { FileSuggest, FolderSuggest } from "./suggests";

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
    if (!entry || typeof entry !== "object") continue;
    const folderPath =
      typeof entry.folderPath === "string"
        ? normalizePath(entry.folderPath.trim())
        : "";
    if (folderPath.length === 0 || seen.has(folderPath)) continue;

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
  private addFormVisible = false;

  constructor(app: App, plugin: DateTreesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName("Date tree folders").setHeading();

    if (this.plugin.settings.trees.length === 0) {
      new Setting(containerEl).setDesc(
        "No date trees configured. Add a folder to get started.",
      );
    }

    for (const entry of this.plugin.settings.trees) {
      new Setting(containerEl)
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
    }

    if (this.addFormVisible) {
      this.renderAddForm(containerEl);
    } else {
      new Setting(containerEl)
        .setName("Add a date tree folder")
        .setDesc("Mark a folder in your vault as a date tree.")
        .addButton((btn) =>
          btn
            .setButtonText("Add")
            .setCta()
            .onClick(() => {
              this.addFormVisible = true;
              this.rerender();
            }),
        );
    }
  }

  private rerender(): void {
    this.display();
  }

  private renderAddForm(containerEl: HTMLElement): void {
    const form = new Setting(containerEl)
      .setName("Add date tree")
      .setDesc("Enter the folder path and an optional template path.");

    const folderInput = form.controlEl.createEl("input", {
      type: "text",
      attr: { placeholder: "Folder path", "aria-label": "Folder path" },
    });
    new FolderSuggest(this.app, folderInput);

    const templateInput = form.controlEl.createEl("input", {
      type: "text",
      attr: {
        placeholder: "Template path (optional)",
        "aria-label": "Template path",
      },
    });
    new FileSuggest(this.app, templateInput);

    form.addButton((btn) =>
      btn
        .setButtonText("Add")
        .setCta()
        .onClick(async () => {
          const rawFolder = folderInput.value.trim();
          if (rawFolder.length === 0) {
            new Notice("Folder path is required");
            return;
          }

          const folder = normalizePath(rawFolder);
          const folderFile = this.app.vault.getAbstractFileByPath(folder);
          if (!(folderFile instanceof TFolder)) {
            new Notice("That folder does not exist in your vault");
            return;
          }

          if (this.plugin.settings.trees.some((t) => t.folderPath === folder)) {
            new Notice("That folder is already a date tree");
            return;
          }

          let templatePath = "";
          const rawTemplate = templateInput.value.trim();
          if (rawTemplate.length > 0) {
            templatePath = normalizePath(rawTemplate);
            const templateFile =
              this.app.vault.getAbstractFileByPath(templatePath);
            if (
              !(templateFile instanceof TFile) ||
              templateFile.extension !== "md"
            ) {
              new Notice("That template file does not exist in your vault");
              return;
            }
          }

          this.plugin.settings.trees.push({ folderPath: folder, templatePath });
          await this.plugin.saveSettings();
          this.addFormVisible = false;
          this.rerender();
        }),
    );

    form.addButton((btn) =>
      btn.setButtonText("Cancel").onClick(() => {
        this.addFormVisible = false;
        this.rerender();
      }),
    );
  }
}
