/** Language used for month and weekday names in date-tree paths. */
type DateTreeLocale = "english" | "system";

/**
 * Vault-relative paths to a day's year folder, month folder, and note.
 * @example
 * {
 *   yearFolderPath: "Journal/2026",
 *   monthFolderPath: "Journal/2026/2026-05 May",
 *   dayFilePath: "Journal/2026/2026-05 May/2026-05-01 Friday.md",
 * }
 */
interface DayPath {
  yearFolderPath: string;
  monthFolderPath: string;
  dayFilePath: string;
}

/** A registered date-tree root folder and its note template path. */
interface DateTreeEntry {
  folderPath: string;
  templatePath: string;
}

/** Plugin settings. */
interface DateTreesSettings {
  locale: DateTreeLocale;
  trees: DateTreeEntry[];
}

/** Default plugin settings. */
const DEFAULT_SETTINGS: DateTreesSettings = {
  locale: "english",
  trees: [],
};

export {
  type DayPath,
  type DateTreeLocale,
  type DateTreeEntry,
  type DateTreesSettings,
  DEFAULT_SETTINGS,
};
