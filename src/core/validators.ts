import { TFile, TFolder, type Vault } from "obsidian";

import type { DateTreeEntry } from "../types";

/**
 * Checks that a vault-relative path points to an existing Markdown file.
 */
function validateTemplateFile(
  vault: Vault,
  path: string,
): { file: TFile; error: null } | { file: null; error: string } {
  const file = vault.getAbstractFileByPath(path);

  if (!file) {
    return { file: null, error: `Template file not found: ${path}` };
  }

  if (!(file instanceof TFile)) {
    return { file: null, error: `Template path is not a file: ${path}` };
  }

  if (file.extension.toLowerCase() !== "md") {
    return { file: null, error: `Template is not a Markdown file: ${path}` };
  }

  return { file, error: null };
}

/**
 * Collects folder and template validation errors for a configured tree.
 */
function collectDateTreeErrors(vault: Vault, entry: DateTreeEntry): string[] {
  const errors = [validateDateTree(vault, entry)];
  if (entry.templatePath) {
    errors.push(validateTemplateFile(vault, entry.templatePath).error);
  }
  return errors.filter((error): error is string => error !== null);
}

/**
 * Checks if a configured date tree is still valid.
 **/
function validateDateTree(vault: Vault, entry: DateTreeEntry): string | null {
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

export { validateTemplateFile, validateDateTree, collectDateTreeErrors };
