import { TFile, Workspace } from "obsidian";

/**
 * Open `file` in a new tab, or focus an existing leaf that's already showing
 * it. Avoids duplicate tabs on repeated invocations.
 *
 * `getViewState()` (rather than `leaf.view instanceof MarkdownView`) is used
 * so that a deferred (background) leaf is still detected — a deferred leaf's
 * `view` is a `DeferredView`, not `MarkdownView`, but its view-state still
 * carries the file path.
 *
 * When a deferred leaf is matched, `loadIfDeferred()` is awaited before
 * focusing so the user sees the real content rather than a placeholder, and
 * any state the leaf needs is fully resolved before it becomes active.
 */
export async function openFileInTab(
  workspace: Workspace,
  file: TFile,
): Promise<void> {
  const targetPath = file.path;
  for (const leaf of workspace.getLeavesOfType("markdown")) {
    const state = leaf.getViewState();
    if (state?.state?.file === targetPath) {
      if (leaf.isDeferred) {
        await leaf.loadIfDeferred();
      }
      workspace.setActiveLeaf(leaf, { focus: true });
      return;
    }
  }
  const leaf = workspace.getLeaf(true);
  await leaf.openFile(file);
}
