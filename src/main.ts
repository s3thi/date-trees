import { Plugin } from "obsidian";

import { registerDateTreeEvents } from "./core/date-tree-events";
import { normalizeSettings } from "./core/settings";
import { DEFAULT_SETTINGS, type DateTreesSettings } from "./types";
import { registerContextMenus } from "./ui/register-context-menus";
import { registerCommands } from "./ui/register-commands";
import { DateTreesSettingTab } from "./ui/settings-tab";

export default class DateTreesPlugin extends Plugin {
  settings: DateTreesSettings = structuredClone(DEFAULT_SETTINGS);

  private settingsTab?: DateTreesSettingTab;

  async onload() {
    await this.loadSettings();
    registerDateTreeEvents(this);
    this.settingsTab = new DateTreesSettingTab(this.app, this);
    this.addSettingTab(this.settingsTab);
    registerContextMenus(this);
    registerCommands(this);
  }

  async loadSettings() {
    this.settings = normalizeSettings(await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);

    // Keep folder definitions current after commands and vault events too.
    this.settingsTab?.update();
  }
}
