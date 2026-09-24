import { TFile, TFolder, type Vault } from "obsidian";

import type { DateTreeEntry } from "../types";

/**
 * Finds the nearest existing day note strictly before `currentNote` in `tree`.
 * Returns `null` if the tree is missing, the current note is not a valid day
 * note in it, or no earlier note exists. Does not open or change any files.
 *
 * Dates come from matching year/month/day path prefixes, regardless of locale.
 * If several notes share the previous date, the first path in character order
 * wins. Notes on the current date are skipped.
 */
function findPreviousNote(
  vault: Vault,
  tree: DateTreeEntry,
  currentNote: TFile,
): TFile | null {
  // Find this date tree's root folder.
  const dateTreeRoot =
    tree.folderPath === "/"
      ? vault.getRoot()
      : vault.getAbstractFileByPath(tree.folderPath);

  if (!(dateTreeRoot instanceof TFolder)) {
    return null;
  }

  // Check that the current note belongs to this date tree and has a valid date
  // in its filename.
  const currentDate = validateAndExtractNoteDate(dateTreeRoot, currentNote);
  if (currentDate === null) {
    return null;
  }

  // Visit only year and month folders in this tree, using Obsidian's in-memory
  // children. Ignore unrelated folders and years later than the current note.
  let previousNote: TFile | null = null;
  let previousNoteDate = "";
  for (const yearFolder of dateTreeRoot.children) {
    // Skip folders that don't have valid year folder names, and folders
    // representing years in the future.
    if (
      !(yearFolder instanceof TFolder) ||
      !/^\d{4}$/.test(yearFolder.name) ||
      yearFolder.name > currentDate.slice(0, 4)
    ) {
      continue;
    }

    for (const monthFolder of yearFolder.children) {
      // Skip folders that don't have valid month folder names, and folders
      // representing months in the future.
      if (
        !(monthFolder instanceof TFolder) ||
        !/^\d{4}-\d{2} .+$/.test(monthFolder.name) ||
        monthFolder.name.slice(0, 4) !== yearFolder.name ||
        monthFolder.name.slice(0, 7) > currentDate.slice(0, 7)
      ) {
        continue;
      }

      // Look through this month's notes for the latest date before the current
      // note. If several notes have that date, choose the one whose full path
      // sorts first. This keeps the choice the same regardless of file order.
      for (const file of monthFolder.children) {
        if (!(file instanceof TFile)) {
          continue;
        }

        // Skip notes with invalid dates, and notes dated on or after the
        // current note's date.
        const date = validateAndExtractNoteDate(dateTreeRoot, file);
        if (date === null || date >= currentDate) {
          continue;
        }

        // Replace the saved note if this date is closer to the current date.
        // For the same date, replace it only if this file's path sorts first.
        if (
          date > previousNoteDate ||
          (date === previousNoteDate &&
            previousNote !== null &&
            file.path < previousNote.path)
        ) {
          previousNote = file;
          previousNoteDate = date;
        }
      }
    }
  }

  // Return the previous note. If the previous note is still `null` by this
  // point, it means there are no more previous notes in the current date tree.
  return previousNote;
}

/**
 * Returns the note's date as a `YYYY-MM-DD` string, or `null` if it isn't a
 * valid day note in this date tree.
 */
function validateAndExtractNoteDate(
  dateTreeRoot: TFolder,
  file: TFile,
): string | null {
  // Check that we're at the expected folder depth and that we have a Markdown
  // extension.
  const month = file.parent;
  const year = month?.parent;
  if (
    !month ||
    !year ||
    year.parent !== dateTreeRoot ||
    file.extension.toLowerCase() !== "md"
  ) {
    return null;
  }

  // Check that the filename has a date prefix.
  const match = /^(\d{4})-(\d{2})-(\d{2}) .+$/.exec(file.basename);
  if (!match) {
    return null;
  }

  // TODO: what are we checking here? Codex, add a comment here.
  const date = file.basename.slice(0, 10);
  if (
    year.name !== match[1] ||
    !month.name.startsWith(`${date.slice(0, 7)} `) ||
    month.name.length <= 8
  ) {
    return null;
  }

  // Reject dates such as February 30 instead of letting the JavaScript `Date`
  // API roll them forward.
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (
    Number(match[1]) === 0 ||
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    return null;
  }

  return date;
}

export { findPreviousNote };
