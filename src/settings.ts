import { App, PluginSettingTab } from "obsidian";
import DateTreesPlugin from "./main";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DateTreesSettings {}

export const DEFAULT_SETTINGS: DateTreesSettings = {};

export class DateTreesSettingTab extends PluginSettingTab {
  plugin: DateTreesPlugin;

  constructor(app: App, plugin: DateTreesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
  }
}
