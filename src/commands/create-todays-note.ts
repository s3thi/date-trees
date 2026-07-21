import { Notice, TFile, TFolder, Vault } from "obsidian";

import { buildDayPath } from "../core/date-tree-path";
import { expandTemplate } from "../core/template";
import { extractErrorMessage } from "../core/errors";
import type DateTreesPlugin from "../main";
import type { DateTreeEntry } from "../types";
import { openFileInTab } from "../ui/open-file";
import { pick } from "../ui/picker";
import { collectDateTreeErrors, validateDateTree } from "../core/validators";

/**
 * Allows the user to pick a configured date tree, then ensure today's day file
 * exists inside it (creating any missing year/month folders along the way), and
 * finally opens the file.
 */
export async function createTodaysNote(plugin: DateTreesPlugin): Promise<void> {
  if (plugin.settings.trees.length === 0) {
    new Notice("No date trees configured.");
    return;
  }

  let entry: DateTreeEntry;
  if (plugin.settings.trees.length === 1) {
    // If there's only one date tree configured, we want to just create the note
    // without prompting the user.
    entry = plugin.settings.trees[0]!;
  } else {
    const choices = plugin.settings.trees.map((entry) => ({
      entry,
      errors: collectDateTreeErrors(plugin.app.vault, entry),
    }));
    const result = await pick(
      plugin.app,
      choices,
      ({ entry }) => entry.folderPath,
      {
        placeholder: "Pick a date tree…",
        title: "Today's note in date tree",
        errors: ({ errors }) => errors,
      },
    );

    if (result.wasCancelled) {
      return;
    }

    entry = result.value.entry;
  }

  await createTodaysNoteInTree(plugin, entry);
}

/**
 * Ensures today's day file exists in the given date tree (creating any missing
 * year/month folders along the way) and opens it.
 */
export async function createTodaysNoteInTree(
  plugin: DateTreesPlugin,
  entry: DateTreeEntry,
): Promise<void> {
  if (!plugin.settings.trees.includes(entry)) {
    new Notice(`Date tree is no longer configured: ${entry.folderPath}`);
    return;
  }

  const { vault } = plugin.app;
  const error = validateDateTree(vault, entry);
  if (error) {
    new Notice(error);
    return;
  }

  const { yearFolderPath, monthFolderPath, dayFilePath } = buildDayPath(
    entry.folderPath,
    new Date(),
    plugin.settings.locale,
  );

  await ensureFolder(vault, yearFolderPath);
  await ensureFolder(vault, monthFolderPath);

  const existing = vault.getAbstractFileByPath(dayFilePath);
  if (existing instanceof TFile) {
    await openFileInTab(plugin.app.workspace, existing);
    return;
  }

  let content = "";
  let templateError: string | null = null;
  if (entry.templatePath) {
    try {
      content = await expandTemplate(plugin, entry.templatePath, dayFilePath);
    } catch (error: unknown) {
      templateError = extractErrorMessage(error);
    }
  }

  const file = await vault.create(dayFilePath, content);
  if (templateError) {
    new Notice(`${templateError}\nCreated an empty note.`);
  }
  await openFileInTab(plugin.app.workspace, file);
}

/**
 * Creates `path` as a folder if it doesn't already exist. No-op when folder
 * exists.
 */
async function ensureFolder(vault: Vault, path: string): Promise<void> {
  const existing = vault.getAbstractFileByPath(path);
  if (existing instanceof TFolder) {
    return;
  }
  if (existing) {
    throw new Error(
      `Cannot create folder "${path}" because a file already exists there.`,
    );
  }
  await vault.createFolder(path);
}
