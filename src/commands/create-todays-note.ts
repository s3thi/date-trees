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
async function pickDateTreeAndCreateTodaysNote(
  plugin: DateTreesPlugin,
): Promise<void> {
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
  // If this tree was removed from the settings, tell the user and stop here.
  if (!plugin.settings.trees.includes(entry)) {
    new Notice(`Date tree is no longer configured: ${entry.folderPath}`);
    return;
  }

  // Check that the tree is valid before creating any folders or notes. If it
  // isn't, show the problem and stop here.
  const { vault } = plugin.app;
  const error = validateDateTree(vault, entry);
  if (error) {
    new Notice(error);
    return;
  }

  // Work out today's folder and note paths using the configured locale.
  const { yearFolderPath, monthFolderPath, dayFilePath } = buildDayPath(
    entry.folderPath,
    new Date(),
    plugin.settings.locale,
  );

  // Create any missing year and month folders, starting with the year.
  await createFolder(vault, yearFolderPath);
  await createFolder(vault, monthFolderPath);

  // If today's note already exists, open it and stop here.
  const existing = vault.getAbstractFileByPath(dayFilePath);
  if (existing instanceof TFile) {
    await openFileInTab(plugin.app.workspace, existing);
    return;
  }

  // Start with an empty note. If the tree has a template, fill it in for today.
  let content = "";
  let templateError: string | null = null;
  if (entry.templatePath) {
    try {
      content = await expandTemplate(plugin, entry.templatePath, dayFilePath);
    } catch (error: unknown) {
      // If the template fails, keep the note empty and save the error to show
      // after the note has been created.
      templateError = extractErrorMessage(error);
    }
  }

  // Create the note and tell the user if a template error left it empty.
  const file = await vault.create(dayFilePath, content);
  if (templateError) {
    new Notice(`${templateError}\nCreated an empty note.`);
  }

  // Open the new note so the user can start writing.
  await openFileInTab(plugin.app.workspace, file);
}

/**
 * Creates `path` as a folder if it doesn't already exist. No-op when folder
 * exists.
 */
async function createFolder(vault: Vault, path: string): Promise<void> {
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

export { pickDateTreeAndCreateTodaysNote };
