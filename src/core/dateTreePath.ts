import { normalizePath } from "obsidian";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export interface DayPath {
  yearFolderPath: string;
  monthFolderPath: string;
  dayFilePath: string;
}

/**
 * Compute the date-tree layout for a single day under `rootFolder`. All segment
 * names use fixed US-English month and weekday names (e.g. "2026-05 May",
 * "2026-05-01 Friday.md") to match the README's documented structure.
 *
 * Locale selection is a planned future enhancement; for now the names are
 * intentionally hard-coded so paths are stable regardless of the user's system
 * locale.
 *
 * `rootFolder` may be the vault root (`"/"` or `""`), in which case year/month
 * folders are created at the top level of the vault.
 */
export function buildDayPath(rootFolder: string, date: Date): DayPath {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const weekday = date.getDay();

  const yyyy = String(year);
  const mm = pad2(month + 1);
  const dd = pad2(day);

  const yearFolderName = yyyy;
  const monthFolderName = `${yyyy}-${mm} ${MONTH_NAMES[month]}`;
  const dayFileName = `${yyyy}-${mm}-${dd} ${WEEKDAY_NAMES[weekday]}.md`;

  const root = normalizePath(rootFolder);
  const base = root === "/" || root === "" ? "" : `${root}/`;
  const yearFolderPath = normalizePath(`${base}${yearFolderName}`);
  const monthFolderPath = normalizePath(`${yearFolderPath}/${monthFolderName}`);
  const dayFilePath = normalizePath(`${monthFolderPath}/${dayFileName}`);

  return { yearFolderPath, monthFolderPath, dayFilePath };
}
