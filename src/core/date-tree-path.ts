import { normalizePath } from "obsidian";

import type DateTreesPlugin from "../main";
import type { DateTreeEntry, DateTreeLocale } from "../types";

interface DayPath {
  yearFolderPath: string;
  monthFolderPath: string;
  dayFilePath: string;
}

/**
 * Resolve the `Intl` locale string for a `DateTreeLocale`. "english" is pinned
 * to `en-US`; "system" defers to the runtime default locale (the OS locale
 * under Obsidian's Electron). Only the *language* of the month/weekday names is
 * affected — the calendar and numbering system are forced separately (see
 * `getFormatters`) so the numeric prefix never inherits the locale's defaults.
 */
function intlLocale(locale: DateTreeLocale): string | undefined {
  return locale === "english" ? "en-US" : undefined;
}

interface DayFormatters {
  /** Emits the year/month/day numeric parts (already zero-padded). */
  numeric: Intl.DateTimeFormat;
  /** Emits the long month and weekday names. */
  names: Intl.DateTimeFormat;
}

const formatterCache = new Map<string, DayFormatters>();

/**
 * Build (and memoize) the two formatters used for a locale. Two formatters are
 * needed because a single `DateTimeFormat` can't emit the month as both a
 * `2-digit` number and a `long` name.
 *
 * Both formatters force `calendar: "gregory"`, and the numeric one also forces
 * `numberingSystem: "latn"`. This is deliberate: the `YYYY-MM`/`YYYY-MM-DD`
 * prefix is meant to be a stable, lexically-sortable ASCII date key, so it must
 * never inherit the locale's defaults. Without this, a "system" locale whose
 * default numbering system is non-Latin (e.g. `ar` → "٢٠٢٦", `bn` → "২০২৬") or
 * whose default calendar is non-Gregorian (e.g. a Japanese-era locale → year
 * "R8" instead of "2026") would corrupt the prefix: folders stop sorting,
 * day-file lookups mismatch, and the year number itself can be wrong. Only the
 * *language* of the month/weekday names varies by locale — which is the actual
 * feature "system" exists to provide.
 */
function getFormatters(locale: DateTreeLocale): DayFormatters {
  const key = intlLocale(locale) ?? "default";
  let formatters = formatterCache.get(key);
  if (formatters === undefined) {
    const tag = intlLocale(locale);
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
    formatterCache.set(key, formatters);
  }
  return formatters;
}

function part(
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
 * Compute the date-tree layout for a single day under `rootFolder`. The numeric
 * prefix (year/month/day) is always Gregorian + Latin digits regardless of
 * locale, so it stays a stable, sortable ASCII key (e.g. "2026-05",
 * "2026-05-01"); only the month and weekday *names* follow the configured
 * locale — "english" → `en-US` ("May", "Friday"); "system" → the OS locale's
 * language (see `getFormatters` for why the calendar/numbering are pinned).
 *
 * `rootFolder` may be the vault root (`"/"` or `""`), in which case year/month
 * folders are created at the top level of the vault.
 */
function buildDayPath(
  rootFolder: string,
  date: Date,
  locale: DateTreeLocale,
): DayPath {
  const { numeric, names } = getFormatters(locale);

  const numericParts = numeric.formatToParts(date);
  const yyyy = part(numericParts, "year");
  const mm = part(numericParts, "month");
  const dd = part(numericParts, "day");

  const nameParts = names.formatToParts(date);
  const monthName = part(nameParts, "month");
  const weekdayName = part(nameParts, "weekday");

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

/**
 * Finds the date tree containing `path` (the path itself or its nearest
 * marked ancestor). Returns null when `path` is not inside any date tree.
 */
function findNearestDateTree(
  plugin: DateTreesPlugin,
  pathRaw: string,
): DateTreeEntry | null {
  let current = normalizePath(pathRaw);

  while (current && current !== "/") {
    const entry = plugin.settings.trees.find((t) => t.folderPath === current);
    if (entry) {
      return entry;
    }

    const slash = current.lastIndexOf("/");
    if (slash === -1) {
      break;
    }
    current = current.slice(0, slash);
  }

  return null;
}

export { type DayPath, buildDayPath, findNearestDateTree };
