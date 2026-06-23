import { Plugin } from "obsidian";
import {
  DateTreesSettings,
  DateTreesSettingTab,
  normalizeSettings,
} from "./settings";

export default class DateTreesPlugin extends Plugin {
  settings!: DateTreesSettings;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new DateTreesSettingTab(this.app, this));
  }

  onunload() {}

  async loadSettings() {
    this.settings = normalizeSettings(await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
