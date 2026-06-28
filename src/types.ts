type DateTreeLocale = "english" | "system";

interface DateTreeEntry {
  folderPath: string;
  templatePath: string;
}

interface DateTreesSettings {
  locale: DateTreeLocale;
  trees: DateTreeEntry[];
}

const DEFAULT_SETTINGS: DateTreesSettings = {
  locale: "english",
  trees: [],
};

export {
  type DateTreeLocale,
  type DateTreeEntry,
  type DateTreesSettings,
  DEFAULT_SETTINGS,
};
