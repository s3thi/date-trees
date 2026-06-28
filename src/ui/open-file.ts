import { TFile, Workspace } from "obsidian";

/**
 * Opens `file` in a new tab, or focuses an existing tab that's already showing
 * it.
 */
export async function openFileInTab(
  workspace: Workspace,
  file: TFile,
): Promise<void> {
  const targetPath = file.path;

  // Iterate over open Markdown tabs.
  for (const leaf of workspace.getLeavesOfType("markdown")) {
    // Grab tab state.
    const state = leaf.getViewState();

    // Is a tab containing our file already open?
    if (state?.state?.file === targetPath) {
      // If the tab is deferred (i.e. currently unloaded), load it.
      if (leaf.isDeferred) {
        await leaf.loadIfDeferred();
      }

      // Set currently open tab as active.
      workspace.setActiveLeaf(leaf, { focus: true });
      return;
    }
  }

  // If there's no tab pointing to our file, open a new one.
  const leaf = workspace.getLeaf(true);
  await leaf.openFile(file);
}
