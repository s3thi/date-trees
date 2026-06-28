import { normalizePath } from "obsidian";

import type DateTreesPlugin from "../main";
import {
  type DateTreeEntry,
  type DateTreeLocale,
  type DateTreesSettings,
} from "../types";

/**
 * Coerce arbitrary persisted data into a valid settings object. `loadData()`
 * can return anything (corrupt file, older schema, hand-edited JSON), so we
 * never trust its shape and drop entries that don't look like a DateTreeEntry.
 */
function normalizeSettings(data: unknown): DateTreesSettings {
  const raw = (data ?? {}) as Partial<DateTreesSettings>;
  const trees = Array.isArray(raw.trees) ? raw.trees : [];

  const cleaned: DateTreeEntry[] = [];
  const seen = new Set<string>();

  // Validate date tree entries.
  for (const entry of trees) {
    if (!entry || typeof entry !== "object") {
      console.warn(
        "Invalid date tree entry found in settings file. Skipping.",
        entry,
      );
      continue;
    }

    const folderPath =
      typeof entry.folderPath === "string"
        ? normalizePath(entry.folderPath.trim())
        : "";

    if (folderPath.length === 0 || seen.has(folderPath)) {
      console.warn(
        "Invalid date tree entry found in settings file. Skipping.",
        entry,
      );
      continue;
    }

    const templatePath =
      typeof entry.templatePath === "string" && entry.templatePath.trim()
        ? normalizePath(entry.templatePath.trim())
        : "";

    seen.add(folderPath);
    cleaned.push({ folderPath, templatePath });
  }

  // Validate locale.
  const locale: DateTreeLocale =
    raw.locale === "english" || raw.locale === "system"
      ? raw.locale
      : "english";

  return { locale, trees: cleaned };
}

/**
 * Adds or updates the date tree entry for `folderPath`. Returns the persisted
 * normalized entry along with whether it replaced an existing one.
 */
async function markOrUpdateDateTree(
  plugin: DateTreesPlugin,
  folderPathRaw: string,
  templatePathRaw: string,
): Promise<{ wasUpdated: boolean; entry: DateTreeEntry }> {
  const folderPath = normalizePath(folderPathRaw);
  const templatePath = templatePathRaw ? normalizePath(templatePathRaw) : "";

  const entryExists = plugin.settings.trees.some(
    (t) => t.folderPath === folderPath,
  );

  const entry: DateTreeEntry = { folderPath, templatePath };

  plugin.settings.trees = entryExists
    ? plugin.settings.trees.map((t) =>
        t.folderPath === folderPath ? entry : t,
      )
    : [...plugin.settings.trees, entry];

  await plugin.saveSettings();
  return { wasUpdated: entryExists, entry };
}

/**
 * Removes the date tree entry at `folderPath`. Idempotent.
 */
async function unmarkDateTree(
  plugin: DateTreesPlugin,
  folderPathRaw: string,
): Promise<{ wasRemoved: boolean }> {
  const folderPath = normalizePath(folderPathRaw);

  const before = plugin.settings.trees.length;
  plugin.settings.trees = plugin.settings.trees.filter(
    (t) => t.folderPath !== folderPath,
  );

  if (plugin.settings.trees.length === before) {
    return { wasRemoved: false };
  }

  await plugin.saveSettings();

  return { wasRemoved: true };
}

/**
 * Check if `folderPath` is marked as a date tree.
 */
function isDateTree(plugin: DateTreesPlugin, folderPathRaw: string): boolean {
  const folderPath = normalizePath(folderPathRaw);
  return plugin.settings.trees.some((t) => t.folderPath === folderPath);
}

export { normalizeSettings, markOrUpdateDateTree, unmarkDateTree, isDateTree };
