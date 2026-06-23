import { AbstractInputSuggest, App, TFile, TFolder } from "obsidian";

export class FolderSuggest extends AbstractInputSuggest<TFolder> {
  constructor(app: App, inputEl: HTMLInputElement) {
    super(app, inputEl);
  }

  getSuggestions(query: string): TFolder[] {
    const lower = query.toLowerCase();
    return this.app.vault
      .getAllLoadedFiles()
      .filter(
        (f): f is TFolder =>
          f instanceof TFolder &&
          f.path.toLowerCase().contains(lower),
      )
      .slice(0, 100);
  }

  renderSuggestion(value: TFolder, el: HTMLElement): void {
    el.setText(value.path);
  }

  selectSuggestion(value: TFolder): void {
    this.setValue(value.path);
    this.close();
  }
}

export class FileSuggest extends AbstractInputSuggest<TFile> {
  constructor(app: App, inputEl: HTMLInputElement) {
    super(app, inputEl);
  }

  getSuggestions(query: string): TFile[] {
    const lower = query.toLowerCase();
    return this.app.vault
      .getAllLoadedFiles()
      .filter(
        (f): f is TFile =>
          f instanceof TFile &&
          f.extension === "md" &&
          f.path.toLowerCase().contains(lower),
      )
      .slice(0, 100);
  }

  renderSuggestion(value: TFile, el: HTMLElement): void {
    el.setText(value.path);
  }

  selectSuggestion(value: TFile): void {
    this.setValue(value.path);
    this.close();
  }
}
