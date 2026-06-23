import { Plugin } from "obsidian";
import {
  DEFAULT_SETTINGS,
  DateTreesSettings,
  DateTreesSettingTab,
} from "./settings";

export default class DateTreesPlugin extends Plugin {
  settings!: DateTreesSettings;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new DateTreesSettingTab(this.app, this));
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      (await this.loadData()) as Partial<DateTreesSettings>,
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
