import { Plugin } from "obsidian";

import { registerDateTreeEvents } from "./core/date-tree-events";
import { normalizeSettings } from "./core/settings";
import { DEFAULT_SETTINGS, type DateTreesSettings } from "./types";
import { registerContextMenus } from "./ui/register-context-menus";
import { registerCommands } from "./ui/register-commands";
import { DateTreesSettingTab } from "./ui/settings-tab";

export default class DateTreesPlugin extends Plugin {
  settings: DateTreesSettings = structuredClone(DEFAULT_SETTINGS);

  async onload() {
    await this.loadSettings();
    registerDateTreeEvents(this);
    this.addSettingTab(new DateTreesSettingTab(this.app, this));
    registerContextMenus(this);
    registerCommands(this);
  }

  async loadSettings() {
    this.settings = normalizeSettings(await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
