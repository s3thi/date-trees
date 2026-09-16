/**
 * Extracts an error message from a thrown error. If there's no error message
 * attached to the argument, returns a generic message.
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "An unexpected error occurred.";
}

export { extractErrorMessage };
