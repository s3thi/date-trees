export interface DateTreeEntry {
  folderPath: string;
  templatePath: string;
}

export interface DateTreesSettings {
  trees: DateTreeEntry[];
}

export const DEFAULT_SETTINGS: DateTreesSettings = {
  trees: [],
};
