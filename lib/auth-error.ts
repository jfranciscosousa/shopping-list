export const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please sign in again.";

export function isAuthError(error: unknown): error is Error {
  return error instanceof Error && error.message === SESSION_EXPIRED_MESSAGE;
}
