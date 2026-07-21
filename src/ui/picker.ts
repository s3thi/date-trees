import { App, FuzzyMatch, FuzzySuggestModal } from "obsidian";

type PickResult<T> = { wasCancelled: true } | { wasCancelled: false; value: T };

interface PickOptions<T> {
  placeholder: string;
  title: string;
  errors?: (item: T) => string[];
}

/**
 * Concrete fuzzy picker over a fixed item list. Items are captured once at
 * construction (FuzzySuggestModal calls getItems() on every keystroke), so
 * callers should pass an already-built array rather than a lazily-recomputed
 * expression.
 */
class FuzzyPickModal<T> extends FuzzySuggestModal<T> {
  private resolved = false;

  constructor(
    app: App,
    private readonly items: T[],
    private readonly itemText: (item: T) => string,
    private readonly resolve: (result: PickResult<T>) => void,
    private readonly errors?: (item: T) => string[],
  ) {
    super(app);
  }

  getItems(): T[] {
    return this.items;
  }

  getItemText(item: T): string {
    return this.itemText(item);
  }

  renderSuggestion(value: FuzzyMatch<T>, el: HTMLElement): void {
    super.renderSuggestion(value, el.createDiv());
    for (const error of this.errors?.(value.item) ?? []) {
      el.createDiv({ cls: "date-trees-error", text: error });
    }
  }

  // selectSuggestion is the single entry point Obsidian calls for any
  // successful pick (click or Enter). Settle here, before super closes the
  // modal, so onClose sees `resolved === true` synchronously.
  selectSuggestion(
    value: FuzzyMatch<T>,
    evt: MouseEvent | KeyboardEvent,
  ): void {
    this.resolved = true;
    this.resolve({ wasCancelled: false, value: value.item });
    super.selectSuggestion(value, evt);
  }

  // Required abstract member, but selectSuggestion already did the work.
  onChooseItem(): void {}

  onClose(): void {
    super.onClose();
    // Reached without selectSuggestion firing => dismissed (Esc / click-out).
    if (!this.resolved) this.resolve({ wasCancelled: true });
  }
}

/** Open a fuzzy picker over `items` and resolve with the choice (or cancelled). */
function pick<T>(
  app: App,
  items: T[],
  itemText: (item: T) => string,
  opts: PickOptions<T>,
): Promise<PickResult<T>> {
  return new Promise((resolve) => {
    const modal = new FuzzyPickModal(app, items, itemText, resolve, opts.errors);
    modal.setPlaceholder(opts.placeholder);
    modal.titleEl.setText(opts.title);
    modal.open();
  });
}

export { type PickResult, pick };
