export type DateTreeLocale = "english" | "system";

export interface DateTreeEntry {
  folderPath: string;
  templatePath: string;
}

export interface DateTreesSettings {
  locale: DateTreeLocale;
  trees: DateTreeEntry[];
}

export const DEFAULT_SETTINGS: DateTreesSettings = {
  locale: "english",
  trees: [],
};
