import { App, FuzzyMatch, FuzzySuggestModal } from "obsidian";

/**
 * Distinguish between the user dismissing the fuzzy picker and the user
 * selecting a value (which may itself be `null`).
 */
type FuzzyPickerResult<T> =
  { wasCancelled: true } | { wasCancelled: false; value: T };

interface FuzzyPickerOptions<T> {
  placeholder: string;
  title: string;

  /**
   * Error messages shown below each suggestion.
   */
  errors?: (item: T) => string[];
}

/**
 * A fuzzy picker that lets the user select an item from a fixed array of items.
 */
class FuzzyPicker<T> extends FuzzySuggestModal<T> {
  private resolved = false;

  constructor(
    app: App,
    private readonly items: T[],
    private readonly itemText: (item: T) => string,
    private readonly resolve: (result: FuzzyPickerResult<T>) => void,
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

  /**
   * Renders a single match with any error messages beneath it.
   */
  renderSuggestion(value: FuzzyMatch<T>, el: HTMLElement): void {
    super.renderSuggestion(value, el.createDiv());
    for (const error of this.errors?.(value.item) ?? []) {
      el.createDiv({ cls: "date-trees-error", text: error });
    }
  }

  /*
   * This is the function Obsidian calls for a successful pick (click or Enter).
   */
  selectSuggestion(
    value: FuzzyMatch<T>,
    evt: MouseEvent | KeyboardEvent,
  ): void {
    this.resolved = true;
    this.resolve({ wasCancelled: false, value: value.item });
    super.selectSuggestion(value, evt);
  }

  /*
   * Required abstract member, but we do all the work in `selectSuggestion`.
   */
  onChooseItem(): void {}

  /*
   * Called when all the selection callbacks have been called and the picker is
   * finally closed.
   */
  onClose(): void {
    super.onClose();

    // If we reached here without `selectSuggestion` being called first, it
    // means the picker was dismissed.
    if (!this.resolved) {
      this.resolve({ wasCancelled: true });
    }
  }
}

/**
 * Open a fuzzy picker that allows the user to pick from `items`.
 */
function pick<T>(
  app: App,
  items: T[],
  itemText: (item: T) => string,
  opts: FuzzyPickerOptions<T>,
): Promise<FuzzyPickerResult<T>> {
  return new Promise((resolve) => {
    const modal = new FuzzyPicker(app, items, itemText, resolve, opts.errors);
    modal.setPlaceholder(opts.placeholder);
    modal.titleEl.setText(opts.title);
    modal.open();
  });
}

export { pick };
