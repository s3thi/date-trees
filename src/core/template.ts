import { TFile } from "obsidian";

import type DateTreesPlugin from "../main";

/**
 * Expand a template file into note content.
 *
 * Substitution is self-implemented to match the tokens supported by Obsidian's
 * built-in Templates core plugin (`{{title}}`, `{{date}}`, `{{date:FORMAT}}`,
 * `{{time}}`, `{{time:FORMAT}}`). We intentionally avoid calling the core
 * plugin's internal API to prevent breakage on future Obsidian versions.
 *
 * Default formats are hardcoded ISO-style (`YYYY-MM-DD`, `HH:mm`) and do not
 * read the core Templates plugin's configured format — this keeps the feature
 * fully decoupled and predictable.
 *
 * Future: a settings dropdown will allow users to opt into Templater community
 * plugin expansion (full `<% %>` syntax, prompts, includes) when it is
 * installed and enabled. That path is intentionally deferred for now.
 *
 * @throws when `templatePath` does not resolve to an existing markdown file.
 */
export async function expandTemplate(
  plugin: DateTreesPlugin,
  templatePath: string,
  targetPath: string,
): Promise<string> {
  const { vault } = plugin.app;

  const templateFile = vault.getAbstractFileByPath(templatePath);
  if (!(templateFile instanceof TFile)) {
    throw new Error(`Template file not found: ${templatePath}`);
  }

  const raw = await vault.cachedRead(templateFile);

  const title = (targetPath.split("/").pop() ?? targetPath).replace(
    /\.md$/u,
    "",
  );
  const now = window.moment();

  return raw
    .replace(/\{\{\s*title\s*\}\}/gu, () => title)
    .replace(/\{\{\s*date\s*:([^}]+)\}\}/gu, (_match, format: string) =>
      now.format(format.trim()),
    )
    .replace(/\{\{\s*date\s*\}\}/gu, () => now.format("YYYY-MM-DD"))
    .replace(/\{\{\s*time\s*:([^}]+)\}\}/gu, (_match, format: string) =>
      now.format(format.trim()),
    )
    .replace(/\{\{\s*time\s*\}\}/gu, () => now.format("HH:mm"));
}
