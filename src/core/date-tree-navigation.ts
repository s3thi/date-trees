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

/**
 * Finds the nearest existing day note strictly before `currentNote` in `tree`.
 * Returns `null` if the tree is missing, the current note is not a valid day
 * note in it, or no earlier note exists.
 *
 * If several notes share the previous date, the first path in character order
 * wins.
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
  let previousDate: CalendarDate | null = null;
  for (const yearFolder of dateTreeRoot.children) {
    // Skip folders that don't have valid year folder names, and folders
    // representing years in the future.
    if (
      !(yearFolder instanceof TFolder) ||
      !/^\d{4}$/.test(yearFolder.name) ||
      Number(yearFolder.name) > currentDate.year
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
        Number(monthFolder.name.slice(0, 4)) !== Number(yearFolder.name)
      ) {
        continue;
      }

      // Skip invalid month numbers and months after the current note's month
      // in the same year. All months in earlier years can contain older notes.
      const monthNumber = Number(monthFolder.name.slice(5, 7));
      if (
        monthNumber < 1 ||
        monthNumber > 12 ||
        (Number(yearFolder.name) === currentDate.year &&
          monthNumber > currentDate.month)
      ) {
        continue;
      }

      // Iterate through notes within a month folder.
      for (const file of monthFolder.children) {
        if (!(file instanceof TFile)) {
          continue;
        }

        // Skip notes with invalid dates, and notes dated on or after the
        // current note's date.
        const date = validateAndExtractNoteDate(dateTreeRoot, file);
        if (date === null) {
          continue;
        }
        if (compareDates(date, currentDate) >= 0) {
          continue;
        }

        // Update `previousNote` and `previousDate` if this note's date is
        // closer to the current note's date. If two notes have the exact same
        // date, update the variables only if this file's path sorts first when
        // sorted in alphabetical order.
        const comparison =
          previousDate === null ? 1 : compareDates(date, previousDate);
        if (
          comparison > 0 ||
          (comparison === 0 &&
            previousNote !== null &&
            file.path < previousNote.path)
        ) {
          previousNote = file;
          previousDate = date;
        }
      }
    }
  }

  // Return the previous note. If the previous note is still `null` by this
  // point, it means there are no more previous notes in the current date tree.
  return previousNote;
}

/**
 * Finds the nearest existing day note strictly after `currentNote` in `tree`.
 * Returns `null` if the tree is missing, the current note is not a valid day
 * note in it, or no later note exists.
 *
 * If several notes share the next date, the first path in character order wins.
 */
function findNextNote(
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
  // children. Ignore unrelated folders and years earlier than the current note.
  let nextNote: TFile | null = null;
  let nextDate: CalendarDate | null = null;
  for (const yearFolder of dateTreeRoot.children) {
    // Skip folders that don't have valid year folder names, and folders
    // representing years before the current note.
    if (
      !(yearFolder instanceof TFolder) ||
      !/^\d{4}$/.test(yearFolder.name) ||
      Number(yearFolder.name) < currentDate.year
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
        Number(monthFolder.name.slice(0, 4)) !== Number(yearFolder.name)
      ) {
        continue;
      }

      // Skip invalid month numbers and months before the current note's month
      // in the same year. All months in later years can contain newer notes.
      const monthNumber = Number(monthFolder.name.slice(5, 7));
      if (
        monthNumber < 1 ||
        monthNumber > 12 ||
        (Number(yearFolder.name) === currentDate.year &&
          monthNumber < currentDate.month)
      ) {
        continue;
      }

      // Iterate through notes within a month folder.
      for (const file of monthFolder.children) {
        if (!(file instanceof TFile)) {
          continue;
        }

        // Skip notes with invalid dates, and notes dated on or before the
        // current note's date.
        const date = validateAndExtractNoteDate(dateTreeRoot, file);
        if (date === null) {
          continue;
        }
        if (compareDates(date, currentDate) <= 0) {
          continue;
        }

        // Keep the closest later date. If two notes share that date, keep the
        // note whose path comes first in character order.
        const comparison =
          nextDate === null ? -1 : compareDates(date, nextDate);
        if (
          comparison < 0 ||
          (comparison === 0 && nextNote !== null && file.path < nextNote.path)
        ) {
          nextNote = file;
          nextDate = date;
        }
      }
    }
  }

  // Return the next note, or `null` if no later note exists in this date tree.
  return nextNote;
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
