import { TFolder, type Vault } from "obsidian";

import type { DateTreeEntry } from "../types";

/**
 * Check if a configured date tree is still valid.
 **/
export function validateDateTree(
  vault: Vault,
  entry: DateTreeEntry,
): string | null {
  const folder =
    entry.folderPath === "/"
      ? vault.getRoot()
      : vault.getAbstractFileByPath(entry.folderPath);

  if (!folder) {
    return `Date tree folder not found: ${entry.folderPath}`;
  }

  if (!(folder instanceof TFolder)) {
    return `Date tree path is not a folder: ${entry.folderPath}`;
  }

  return null;
}
