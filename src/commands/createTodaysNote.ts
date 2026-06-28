import { Notice, TFile, TFolder, Vault } from "obsidian";

import { buildDayPath } from "../core/dateTreePath";
import { expandTemplate } from "../core/template";
import type DateTreesPlugin from "../main";
import type { DateTreeEntry } from "../types";
import { openFileInTab } from "../ui/openFile";
import { pick } from "../ui/picker";

/**
 * Command-palette entry: pick a configured date tree, then ensure today's day
 * file exists inside it (creating any missing year/month folders along the
 * way), and finally open the file.
 *
 * - No date trees configured → notice and abort.
 * - Exactly one date tree → use it directly, no picker.
 * - Picker dismissed → abort silently.
 * - File already exists → no creation, just open it.
 *
 * When the date tree has a configured `templatePath`, the template is expanded
 * (see {@link expandTemplate}) and used as the new note's initial content. If
 * the template file is missing, a notice is shown and an empty note is
 * created as a fallback.
 */
export async function createTodaysNote(plugin: DateTreesPlugin): Promise<void> {
  if (plugin.settings.trees.length === 0) {
    new Notice("No date trees configured.");
    return;
  }

  let entry: DateTreeEntry;
  if (plugin.settings.trees.length === 1) {
    entry = plugin.settings.trees[0]!;
  } else {
    const result = await pick(
      plugin.app,
      plugin.settings.trees,
      (entry) => entry.folderPath,
      {
        placeholder: "Pick a date tree…",
        title: "Today's note in date tree",
      },
    );
    if (result.cancelled) {
      return;
    }
    entry = result.value;
  }

  const { yearFolderPath, monthFolderPath, dayFilePath } = buildDayPath(
    entry.folderPath,
    new Date(),
    plugin.settings.locale,
  );

  const { vault } = plugin.app;

  await ensureFolder(vault, yearFolderPath);
  await ensureFolder(vault, monthFolderPath);

  const existing = vault.getAbstractFileByPath(dayFilePath);
  if (existing instanceof TFile) {
    await openFileInTab(plugin.app.workspace, existing);
    return;
  }

  let content = "";
  if (entry.templatePath) {
    try {
      content = await expandTemplate(plugin, entry.templatePath, dayFilePath);
    } catch {
      new Notice(
        `Template file not found: ${entry.templatePath}. Created empty note.`,
      );
    }
  }

  const file = await vault.create(dayFilePath, content);
  await openFileInTab(plugin.app.workspace, file);
}

/**
 * Create `path` as a folder if it doesn't already exist. Idempotent: a no-op
 * when the folder is already present. If a file occupies the path, let
 * `createFolder` throw — that's corrupt vault state worth surfacing.
 */
async function ensureFolder(vault: Vault, path: string): Promise<void> {
  if (vault.getAbstractFileByPath(path) instanceof TFolder) {
    return;
  }
  await vault.createFolder(path);
}
