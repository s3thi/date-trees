import { Plugin, TFolder } from "obsidian";

import {
  markFolderAsDateTree,
  markFolderAsDateTreeViaPicker,
} from "./commands/markDateTree";
import {
  DateTreesSettings,
  DateTreesSettingTab,
  DEFAULT_SETTINGS,
  normalizeSettings,
} from "./settings";

export default class DateTreesPlugin extends Plugin {
  settings: DateTreesSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new DateTreesSettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!(file instanceof TFolder)) {
          return;
        }

        menu.addItem((item) => {
          item.setTitle("Mark as date tree");
          item.onClick(() => {
            void markFolderAsDateTree(this, file);
          });
        });
      }),
    );

    this.addCommand({
      id: "mark-folder-as-date-tree",
      name: "Mark folder as date tree",
      callback: () => {
        void markFolderAsDateTreeViaPicker(this);
      },
    });
  }

  onunload() {}

  async loadSettings() {
    this.settings = normalizeSettings(await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
