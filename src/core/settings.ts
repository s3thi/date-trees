import { normalizePath } from "obsidian";

import type DateTreesPlugin from "../main";
import {
  type DateTreeEntry,
  type DateTreeLocale,
  type DateTreesSettings,
} from "../types";

/**
 * Load saved settings, check them for errors, and return a valid settings
 * object.
 */
function normalizeSettings(data: unknown): DateTreesSettings {
  const rawSettings = (data ?? {}) as Partial<DateTreesSettings>;
  const rawTrees = Array.isArray(rawSettings.trees) ? rawSettings.trees : [];

  // Collect valid trees and track their paths to make sure each folder appears
  // only once in the settings object.
  const cleanedTrees: DateTreeEntry[] = [];
  const seenPaths = new Set<string>();

  // Check each saved tree before adding it to the settings.
  for (const entry of rawTrees) {
    // Skip values that cannot describe a tree.
    if (!entry || typeof entry !== "object") {
      console.warn(
        "Invalid date tree entry found in settings file. Skipping.",
        entry,
      );
      continue;
    }

    // Clean the folder path. Skip empty paths and folders already added.
    const folderPath =
      typeof entry.folderPath === "string"
        ? normalizePath(entry.folderPath.trim())
        : "";

    if (folderPath.length === 0 || seenPaths.has(folderPath)) {
      console.warn(
        "Invalid date tree entry found in settings file. Skipping.",
        entry,
      );
      continue;
    }

    // Silently drop invalid template paths.
    const templatePath =
      typeof entry.templatePath === "string" && entry.templatePath.trim()
        ? normalizePath(entry.templatePath.trim())
        : "";

    // Save this tree and prevent another entry from using the same folder.
    seenPaths.add(folderPath);
    cleanedTrees.push({ folderPath, templatePath });
  }

  // Use a supported locale, falling back to English for other saved values.
  const locale: DateTreeLocale =
    rawSettings.locale === "english" || rawSettings.locale === "system"
      ? rawSettings.locale
      : "english";

  // Return only the settings the plugin still uses.
  return {
    locale,
    trees: cleanedTrees,
  };
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
