import {
  App,
  FuzzyMatch,
  FuzzySuggestModal,
  Notice,
  TFile,
  TFolder,
  normalizePath,
} from "obsidian";

import DateTreesPlugin from "../main";

type PickResult<T> = { cancelled: true } | { cancelled: false; value: T };

/**
 * Core: mark a folder as a date tree. Opens a single fuzzy-find modal listing
 * "No template" followed by every markdown file in the vault; persists the
 * chosen entry to settings. Aborts silently if the user closes without choosing.
 *
 * Both the right-click menu entry and the command-palette entry funnel here.
 */
export async function markFolderAsDateTree(
  plugin: DateTreesPlugin,
  folder: TFolder,
): Promise<void> {
  const result = await pickTemplate(plugin.app);
  if (result.cancelled) {
    return;
  }

  const templatePath =
    result.value === null ? "" : normalizePath(result.value.path);
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
 * Command-palette entry: prompt the user for a folder via the fuzzy picker,
 * then delegate to {@link markFolderAsDateTree} for template selection and
 * persistence. Aborts silently if the folder picker is dismissed.
 */
export async function markFolderAsDateTreeViaPicker(
  plugin: DateTreesPlugin,
): Promise<void> {
  const folderResult = await pickFolder(plugin.app);
  if (folderResult.cancelled) {
    return;
  }
  await markFolderAsDateTree(plugin, folderResult.value);
}

/**
 * Generic base for the two pickers. Handles the selectSuggestion/onClose
 * resolution dance so subclasses only need to supply items + item text.
 */
abstract class FuzzyPickModal<T> extends FuzzySuggestModal<T> {
  private resolved = false;

  constructor(
    app: App,
    private readonly resolve: (result: PickResult<T>) => void,
  ) {
    super(app);
  }

  abstract getItems(): T[];
  abstract getItemText(item: T): string;

  // selectSuggestion is the single entry point Obsidian calls for any
  // successful pick (click or Enter). Settle here, before super closes the
  // modal, so onClose sees `resolved === true` synchronously.
  selectSuggestion(
    value: FuzzyMatch<T>,
    evt: MouseEvent | KeyboardEvent,
  ): void {
    this.resolved = true;
    this.resolve({ cancelled: false, value: value.item });
    super.selectSuggestion(value, evt);
  }

  // Required abstract member, but selectSuggestion already did the work.
  onChooseItem(): void {}

  onClose(): void {
    super.onClose();
    // Reached without selectSuggestion firing => dismissed (Esc / click-out).
    if (!this.resolved) this.resolve({ cancelled: true });
  }
}

/**
 * Folder picker. Items are built once by walking the vault tree from the root
 * (FuzzySuggestModal calls getItems() on every keystroke, so we avoid
 * re-walking the tree and re-allocating each filter pass).
 *
 * The root folder ("/") is intentionally included: a user may want their
 * entire vault treated as a date tree.
 */
class FolderPickerModal extends FuzzyPickModal<TFolder> {
  private readonly items: TFolder[];

  constructor(
    app: App,
    resolve: (result: PickResult<TFolder>) => void,
  ) {
    super(app, resolve);
    this.items = collectFolders(app.vault.getRoot());
  }

  getItems(): TFolder[] {
    return this.items;
  }

  getItemText(folder: TFolder): string {
    return folder.isRoot() ? "/" : folder.path;
  }
}

/**
 * Template picker. First item is always "No template" (null sentinel); the
 * rest are the vault's markdown files. Resolves the pick, or a cancelled
 * result if the user closed the modal without choosing.
 */
class TemplatePickerModal extends FuzzyPickModal<TFile | null> {
  // Built once (see FolderPickerModal for the same rationale).
  private readonly items: (TFile | null)[];

  constructor(
    app: App,
    resolve: (result: PickResult<TFile | null>) => void,
  ) {
    super(app, resolve);
    this.items = [null, ...app.vault.getMarkdownFiles()];
  }

  getItems(): (TFile | null)[] {
    return this.items;
  }

  getItemText(item: TFile | null): string {
    return item === null ? "No template" : item.path;
  }
}

function pickFolder(app: App): Promise<PickResult<TFolder>> {
  return new Promise((resolve) => {
    const modal = new FolderPickerModal(app, resolve);
    modal.setPlaceholder("Pick a folder…");
    modal.titleEl.setText("Select folder");
    modal.open();
  });
}

function pickTemplate(app: App): Promise<PickResult<TFile | null>> {
  return new Promise((resolve) => {
    const modal = new TemplatePickerModal(app, resolve);
    modal.setPlaceholder("Pick a template file (or choose no template)…");
    modal.titleEl.setText("Select template");
    modal.open();
  });
}

/** Recursively collect every TFolder under `root` (inclusive of `root`). */
function collectFolders(root: TFolder): TFolder[] {
  const out: TFolder[] = [root];
  const stack: TFolder[] = [root];
  while (stack.length > 0) {
    const folder = stack.pop()!;
    for (const child of folder.children) {
      if (child instanceof TFolder) {
        out.push(child);
        stack.push(child);
      }
    }
  }
  return out;
}
