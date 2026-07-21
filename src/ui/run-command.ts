import { Notice } from "obsidian";

/** Runs a command, reporting failures instead of dropping them. */
function runCommand(action: () => Promise<void>): void {
  void action().catch((error: unknown) => {
    console.error("Date trees: command failed", error);

    const reason =
      error instanceof Error && error.message
        ? error.message
        : "An unexpected error occurred.";

    new Notice(`Date trees: ${reason}`);
  });
}

export { runCommand };
