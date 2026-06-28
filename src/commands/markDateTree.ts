import {
  App,
  FuzzySuggestModal,
  Notice,
  TFile,
  TFolder,
  normalizePath,
} from "obsidian";

import DateTreesPlugin from "../main";

type PickResult =
  | { cancelled: true }
  | { cancelled: false; file: TFile | null };

/**
 * Mark a folder as a date tree. Opens a single fuzzy-find modal listing
 * "No template" followed by every file in the vault; persists the chosen
 * entry to settings. Aborts silently if the user closes without choosing.
 */
export async function markAsDateTree(
  plugin: DateTreesPlugin,
  folder: TFolder,
): Promise<void> {
  const result = await pickTemplate(plugin.app);
  if (result.cancelled) {
    return;
  }

  const templatePath =
    result.file === null ? "" : normalizePath(result.file.path);
  const folderPath = normalizePath(folder.path);

  const isUpdate = plugin.settings.trees.some(
    (t) => t.folderPath === folderPath,
  );

  // Replace any existing entry for this folder so re-marking updates it.
  const trees = plugin.settings.trees.filter(
    (t) => t.folderPath !== folderPath,
  );
  trees.push({ folderPath, templatePath });
  plugin.settings.trees = trees;

  await plugin.saveSettings();
  const verb = isUpdate ? "updated" : "added";
  new Notice(
    templatePath
      ? `Date tree ${verb}: ${folderPath} (template: ${templatePath})`
      : `Date tree ${verb}: ${folderPath}`,
  );
}

/**
 * Single fuzzy modal. First item is always "No template" (null sentinel);
 * the rest are the vault's markdown files. Resolves the pick, or a cancelled
 * result if the user closed the modal without choosing.
 */
class TemplatePickerModal extends FuzzySuggestModal<TFile | null> {
  private resolved = false;
  // Built once: FuzzySuggestModal calls getItems() on every keystroke, so we
  // avoid re-scanning the vault and re-allocating the array each filter pass.
  private readonly items: (TFile | null)[];

  constructor(
    app: App,
    private readonly resolve: (result: PickResult) => void,
  ) {
    super(app);
    this.items = [null, ...app.vault.getMarkdownFiles()];
  }

  getItems(): (TFile | null)[] {
    return this.items;
  }

  getItemText(item: TFile | null): string {
    return item === null ? "No template" : item.path;
  }

  onChooseItem(item: TFile | null): void {
    this.resolved = true;
    this.resolve({ cancelled: false, file: item });
  }

  onClose(): void {
    super.onClose();
    // selectSuggestion() calls close() before onChooseItem(), so defer the
    // cancellation check until the current synchronous flow finishes. If an
    // item was chosen, `resolved` will be true by the time this runs.
    queueMicrotask(() => {
      if (!this.resolved) this.resolve({ cancelled: true });
    });
  }
}

function pickTemplate(app: App): Promise<PickResult> {
  return new Promise((resolve) => {
    const modal = new TemplatePickerModal(app, resolve);
    modal.setPlaceholder("Pick a template file (or choose no template)…");
    modal.titleEl.setText("Select template");
    modal.open();
  });
}
