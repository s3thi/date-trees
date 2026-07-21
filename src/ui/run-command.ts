import { Notice } from "obsidian";
import { extractErrorMessage } from "../core/errors";

/** Runs a command, reporting failures instead of dropping them. */
function runCommand(action: () => Promise<void>): void {
  void action().catch((error: unknown) => {
    console.error("Date trees: command failed", error);

    new Notice(`Date trees: ${extractErrorMessage(error)}`);
  });
}

export { runCommand };
