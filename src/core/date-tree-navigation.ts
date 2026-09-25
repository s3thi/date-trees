import { TFile, TFolder, type Vault } from "obsidian";

import type { DateTreeEntry } from "../types";

/**
 * A Gregorian calendar date with a month numbered from 1 to 12.
 */
interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

/** Describes the outcome of looking for an adjacent day note. */
type NavigationResult =
  | { status: "found"; note: TFile }
  | { status: "invalid-tree" }
  | { status: "invalid-current-note" }
  | { status: "no-adjacent-note" };

/**
 * Finds the nearest existing day note strictly before `currentNote` in `tree`.
 * Reports whether the tree or starting note is invalid, or no earlier note
 * exists.
 *
 * If several notes share the previous date, the first path in character order
 * wins.
 */
function findPreviousNote(
  vault: Vault,
  tree: DateTreeEntry,
  currentNote: TFile,
): NavigationResult {
  return findAdjacentNote(vault, tree, currentNote, "previous");
}

/**
 * Finds the nearest existing day note strictly after `currentNote` in `tree`.
 * Reports whether the tree or starting note is invalid, or no later note
 * exists.
 *
 * If several notes share the next date, the first path in character order wins.
 */
function findNextNote(
  vault: Vault,
  tree: DateTreeEntry,
  currentNote: TFile,
): NavigationResult {
  return findAdjacentNote(vault, tree, currentNote, "next");
}

/**
 * Finds the nearest valid day note in the requested direction, skipping the
 * current date. Reports invalid inputs and an empty search separately. Breaks
 * ties by choosing the first path in character order.
 */
function findAdjacentNote(
  vault: Vault,
  tree: DateTreeEntry,
  currentNote: TFile,
  direction: "previous" | "next",
): NavigationResult {
  // Find this date tree's root folder.
  const dateTreeRoot =
    tree.folderPath === "/"
      ? vault.getRoot()
      : vault.getAbstractFileByPath(tree.folderPath);

  if (!(dateTreeRoot instanceof TFolder)) {
    return { status: "invalid-tree" };
  }

  // Check that the current note belongs to this date tree and has a valid date
  // in its filename.
  const currentDate = validateAndExtractNoteDate(dateTreeRoot, currentNote);
  if (currentDate === null) {
    return { status: "invalid-current-note" };
  }

  // Visit only year and month folders in this tree, using Obsidian's in-memory
  // children. Ignore unrelated folders and dates in the opposite direction.
  const isPrevious = direction === "previous";
  let adjacentNote: TFile | null = null;
  let adjacentDate: CalendarDate | null = null;
  for (const yearFolder of dateTreeRoot.children) {
    // Skip folders that don't have valid year folder names.
    if (!(yearFolder instanceof TFolder) || !/^\d{4}$/.test(yearFolder.name)) {
      continue;
    }

    // Skip years in the opposite direction from the current note.
    const yearNumber = Number(yearFolder.name);
    if (
      isPrevious ? yearNumber > currentDate.year : yearNumber < currentDate.year
    ) {
      continue;
    }

    // Iterate through months within a year folder.
    for (const monthFolder of yearFolder.children) {
      // Skip folders that don't have valid month folder names or don't belong
      // to this year.
      if (
        !(monthFolder instanceof TFolder) ||
        !/^\d{4}-\d{2} .+$/.test(monthFolder.name) ||
        Number(monthFolder.name.slice(0, 4)) !== yearNumber
      ) {
        continue;
      }

      // Skip invalid month numbers. Within the current year, also skip
      // months in the opposite direction. Include the current month.
      const monthNumber = Number(monthFolder.name.slice(5, 7));
      if (monthNumber < 1 || monthNumber > 12) {
        continue;
      }
      if (
        yearNumber === currentDate.year &&
        (isPrevious
          ? monthNumber > currentDate.month
          : monthNumber < currentDate.month)
      ) {
        continue;
      }

      // Iterate through notes within a month folder.
      for (const file of monthFolder.children) {
        if (!(file instanceof TFile)) {
          continue;
        }

        // Skip invalid dates, notes on the current date, and notes in the
        // opposite direction.
        const date = validateAndExtractNoteDate(dateTreeRoot, file);
        if (date === null) {
          continue;
        }
        const currentComparison = compareDates(date, currentDate);
        if (isPrevious ? currentComparison >= 0 : currentComparison <= 0) {
          continue;
        }

        // Keep the first eligible note so later notes have a date to beat.
        if (adjacentDate === null) {
          adjacentNote = file;
          adjacentDate = date;
          continue;
        }

        // Keep the closer date in the requested direction. If two notes share
        // that date, keep the note whose path comes first in character order.
        const comparison = compareDates(date, adjacentDate);
        const isCloser = isPrevious ? comparison > 0 : comparison < 0;
        if (
          isCloser ||
          (comparison === 0 &&
            adjacentNote !== null &&
            file.path < adjacentNote.path)
        ) {
          adjacentNote = file;
          adjacentDate = date;
        }
      }
    }
  }

  // Return the closest note, or report that this direction has no day note.
  return adjacentNote === null
    ? { status: "no-adjacent-note" }
    : { status: "found", note: adjacentNote };
}

/**
 * Returns the note's calendar date, or `null` if it isn't a valid day note in
 * this date tree. Reads numeric year, month, and day values without a time
 * zone.
 */
function validateAndExtractNoteDate(
  dateTreeRoot: TFolder,
  file: TFile,
): CalendarDate | null {
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

  // Check that the year and month folders match the date in the filename.
  // The month folder must also have a label after its date prefix, such as
  // "February" in "2024-02 February".
  const noteYear = Number(match[1]);
  const noteMonth = Number(match[2]);
  const noteDay = Number(match[3]);
  if (
    !/^\d{4}$/.test(year.name) ||
    !/^\d{4}-\d{2} .+$/.test(month.name) ||
    Number(year.name) !== noteYear ||
    Number(month.name.slice(0, 4)) !== noteYear ||
    Number(month.name.slice(5, 7)) !== noteMonth
  ) {
    return null;
  }

  // Reject year zero and invalid months before checking the month's length.
  if (noteYear === 0 || noteMonth < 1 || noteMonth > 12) {
    return null;
  }

  // February has 29 days in leap years. Century years are leap years only when
  // divisible by 400. April, June, September, and November have 30 days.
  const isLeapYear =
    noteYear % 4 === 0 && (noteYear % 100 !== 0 || noteYear % 400 === 0);
  let daysInMonth = 31;
  if (noteMonth === 2) {
    daysInMonth = isLeapYear ? 29 : 28;
  } else if ([4, 6, 9, 11].includes(noteMonth)) {
    daysInMonth = 30;
  }

  // Reject days outside the month's range, such as February 30 or day zero.
  if (noteDay < 1 || noteDay > daysInMonth) {
    return null;
  }

  return { year: noteYear, month: noteMonth, day: noteDay };
}

/**
 * Compares calendar dates. Returns a negative number if `left` is earlier, zero
 * if they are the same date, or a positive number if `left` is later.
 */
function compareDates(left: CalendarDate, right: CalendarDate): number {
  // Compare years first, then months, then days when the larger parts match.
  if (left.year !== right.year) {
    return left.year - right.year;
  }
  if (left.month !== right.month) {
    return left.month - right.month;
  }
  return left.day - right.day;
}

export { findPreviousNote, findNextNote };
