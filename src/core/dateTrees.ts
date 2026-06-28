import { normalizePath } from "obsidian";

import type DateTreesPlugin from "../main";
import type { DateTreeEntry } from "../types";

/**
 * Core date-tree state mutations and queries over `plugin.settings.trees`.
 *
 * These functions own all reads/writes of the persisted tree list and contain
 * no UI: no pickers, no Notices. Command and settings modules call into here
 * and layer their own user-facing feedback on top. Keeping the dependency
 * arrows pointing down into this module (rather than settings depending on a
 * command) is the whole point of the split.
 */

/**
 * Add or replace the entry for `folderPath`. Re-marking an already-marked
 * folder updates its template. Returns the persisted (normalized) entry along
 * with whether it replaced an existing one, so callers can phrase feedback.
 */
export async function upsertDateTree(
  plugin: DateTreesPlugin,
  folderPathRaw: string,
  templatePathRaw: string,
): Promise<{ status: "added" | "updated"; entry: DateTreeEntry }> {
  const folderPath = normalizePath(folderPathRaw);
  const templatePath = templatePathRaw ? normalizePath(templatePathRaw) : "";

  const existed = plugin.settings.trees.some(
    (t) => t.folderPath === folderPath,
  );

  // Replace in place when updating so the folder keeps its position in the
  // list; only a genuinely new entry is appended.
  const entry: DateTreeEntry = { folderPath, templatePath };
  plugin.settings.trees = existed
    ? plugin.settings.trees.map((t) => (t.folderPath === folderPath ? entry : t))
    : [...plugin.settings.trees, entry];

  await plugin.saveSettings();
  return { status: existed ? "updated" : "added", entry };
}

/**
 * Remove the entry at `folderPath`. Idempotent — returns false (and persists
 * nothing) if the path isn't currently marked.
 */
export async function removeDateTree(
  plugin: DateTreesPlugin,
  folderPathRaw: string,
): Promise<boolean> {
  const folderPath = normalizePath(folderPathRaw);

  const before = plugin.settings.trees.length;
  plugin.settings.trees = plugin.settings.trees.filter(
    (t) => t.folderPath !== folderPath,
  );
  if (plugin.settings.trees.length === before) {
    return false;
  }

  await plugin.saveSettings();
  return true;
}

/** Whether `folderPath` is currently marked as a date tree. */
export function isDateTree(
  plugin: DateTreesPlugin,
  folderPathRaw: string,
): boolean {
  const folderPath = normalizePath(folderPathRaw);
  return plugin.settings.trees.some((t) => t.folderPath === folderPath);
}
