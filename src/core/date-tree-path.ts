import { normalizePath } from "obsidian";

import type DateTreesPlugin from "../main";
import type { DateTreeEntry, DateTreeLocale, DayPath } from "../types";

/**
 * Gets the locale name based on the locale setting the user has picked.
 */
function dateTreeLocaleToLocaleName(
  locale: DateTreeLocale,
): string | undefined {
  return locale === "english" ? "en-US" : undefined;
}

interface DayFormatters {
  /** Emits the year/month/day numeric parts (already zero-padded). */
  numeric: Intl.DateTimeFormat;
  /** Emits the long month and weekday names. */
  names: Intl.DateTimeFormat;
}

const formatterCache = new Map<DateTreeLocale, DayFormatters>();

/**
 * Creates and cache two separate formatters: one for for numeric dates, and the
 * other for localized month/weekday names.
 *
 * Both formatters use the Gregorian calendar. Numeric dates use ASCII digits to
 * keep path prefixes consistent and sortable across locales. The user's
 * selected locale only affects month and weekday names.
 */
function getFormatters(locale: DateTreeLocale): DayFormatters {
  let formatters = formatterCache.get(locale);
  if (formatters === undefined) {
    const tag = dateTreeLocaleToLocaleName(locale);
    formatters = {
      numeric: new Intl.DateTimeFormat(tag, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        calendar: "gregory",
        numberingSystem: "latn",
      }),
      names: new Intl.DateTimeFormat(tag, {
        month: "long",
        weekday: "long",
        calendar: "gregory",
      }),
    };
    formatterCache.set(locale, formatters);
  }
  return formatters;
}

/**
 * Extracts a required part from `Intl.DateTimeFormat.formatToParts()` output.
 * @throws if the formatter did not produce the requested part.
 */
function extractDateTimeFormatPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  const value = parts.find((p) => p.type === type)?.value;
  if (value === undefined) {
    throw new Error(`Intl.DateTimeFormat did not produce a "${type}" part`);
  }
  return value;
}

/**
 * Builds year folder, month folder, and day note paths under `rootFolder`,
 * using stable date prefixes and localized month/weekday names.
 */
function buildDayPath(
  rootFolder: string,
  date: Date,
  locale: DateTreeLocale,
): DayPath {
  const { numeric, names } = getFormatters(locale);

  const numericParts = numeric.formatToParts(date);
  const yyyy = extractDateTimeFormatPart(numericParts, "year");
  const mm = extractDateTimeFormatPart(numericParts, "month");
  const dd = extractDateTimeFormatPart(numericParts, "day");

  const nameParts = names.formatToParts(date);
  const monthName = extractDateTimeFormatPart(nameParts, "month");
  const weekdayName = extractDateTimeFormatPart(nameParts, "weekday");

  const yearFolderName = yyyy;
  const monthFolderName = `${yyyy}-${mm} ${monthName}`;
  const dayFileName = `${yyyy}-${mm}-${dd} ${weekdayName}.md`;

  const root = normalizePath(rootFolder);
  const base = root === "/" || root === "" ? "" : `${root}/`;
  const yearFolderPath = normalizePath(`${base}${yearFolderName}`);
  const monthFolderPath = normalizePath(`${yearFolderPath}/${monthFolderName}`);
  const dayFilePath = normalizePath(`${monthFolderPath}/${dayFileName}`);

  return { yearFolderPath, monthFolderPath, dayFilePath };
}

/** Short display name for a date tree folder path. */
function treeDisplayName(folderPath: string): string {
  return folderPath === "/" ? "/" : folderPath.split("/").pop() || folderPath;
}

/**
 * Finds the date tree containing `path` (the path itself or its nearest
 * marked ancestor). Returns null when `path` is not inside any date tree.
 */
function findNearestDateTree(
  plugin: DateTreesPlugin,
  pathRaw: string,
): DateTreeEntry | null {
  let current = normalizePath(pathRaw);

  for (;;) {
    const entry = plugin.settings.trees.find((t) => t.folderPath === current);
    if (entry) {
      return entry;
    }

    if (current === "/") {
      return null;
    }

    const slash = current.lastIndexOf("/");
    current = slash === -1 ? "/" : current.slice(0, slash);
  }
}

export { buildDayPath, findNearestDateTree, treeDisplayName };
