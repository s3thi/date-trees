import { Plugin, TFolder } from "obsidian";

import {
  markFolderAsDateTree,
  markFolderAsDateTreeViaPicker,
} from "./commands/markDateTree";
import {
  unmarkFolderAsDateTree,
  unmarkFolderAsDateTreeViaPicker,
} from "./commands/unmarkDateTree";
import { createTodaysNote } from "./commands/createTodaysNote";
import { isDateTree } from "./core/dateTrees";
import {
  DateTreesSettingTab,
  normalizeSettings,
} from "./settings";
import { DEFAULT_SETTINGS, type DateTreesSettings } from "./types";

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

        const isMarked = isDateTree(this, file.path);

        menu.addItem((item) => {
          item.setTitle(
            isMarked ? "Change date tree template" : "Mark as date tree",
          );
          item.onClick(() => {
            void markFolderAsDateTree(this, file);
          });
        });

        if (isMarked) {
          menu.addItem((item) => {
            item.setTitle("Unmark as date tree");
            item.onClick(() => {
              void unmarkFolderAsDateTree(this, file);
            });
          });
        }
      }),
    );

    this.addCommand({
      id: "mark-folder-as-date-tree",
      name: "Mark folder as date tree",
      callback: () => {
        void markFolderAsDateTreeViaPicker(this);
      },
    });

    this.addCommand({
      id: "unmark-folder-as-date-tree",
      name: "Unmark folder as date tree",
      callback: () => {
        void unmarkFolderAsDateTreeViaPicker(this);
      },
    });

    this.addCommand({
      id: "create-todays-note",
      name: "Today's note in date tree",
      callback: () => {
        void createTodaysNote(this);
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
