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
  /**
   * Normalized vault-relative folder path; `/` represents the vault root.
   */
  folderPath: string;

  /**
   * Normalized vault-relative template file path; empty means no template.
   */
  templatePath: string;
}

/** Plugin settings. */
interface DateTreesSettings {
  locale: DateTreeLocale;
  /**
   * Enable ribbon buttons for previous and next notes in the current tab.
   */
  shouldShowNavigationRibbonIcons: boolean;
  /**
   * Enable ribbon buttons for previous and next notes in a new tab.
   */
  shouldShowNewTabNavigationRibbonIcons: boolean;
  trees: DateTreeEntry[];
}

/** Default plugin settings. */
const DEFAULT_SETTINGS: DateTreesSettings = {
  locale: "english",
  shouldShowNavigationRibbonIcons: true,
  shouldShowNewTabNavigationRibbonIcons: false,
  trees: [],
};

export {
  type DayPath,
  type DateTreeLocale,
  type DateTreeEntry,
  type DateTreesSettings,
  DEFAULT_SETTINGS,
};
