const GENERIC_ERROR_MESSAGE = "We couldn't complete that request. Please try again.";

type ActionFailure = {
  success: false;
  error: string;
};

function logServerError(operation: string, error: unknown) {
  console.error("Server operation failed", { operation, error });
}

/**
 * Converts unexpected server-action exceptions into a safe serializable result.
 */
export function withActionHandling<T extends unknown[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>,
): (...args: T) => Promise<R | ActionFailure> {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (error) {
      logServerError(operation, error);
      return { success: false, error: GENERIC_ERROR_MESSAGE };
    }
  };
}

/** Logs read/render failures while exposing only a generic error to the client boundary. */
export function withServerLogging<T extends unknown[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>,
): (...args: T) => Promise<R> {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (error) {
      logServerError(operation, error);
      throw new Error(GENERIC_ERROR_MESSAGE, { cause: error });
    }
  };
}
