import { ZodError } from "zod";

export type ServerActionResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Wraps a server action with consistent error handling
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
): (...args: T) => Promise<ServerActionResult<R>> {
  return async (...args: T): Promise<ServerActionResult<R>> => {
    try {
      const result = await fn(...args);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`Error in ${fn.name}:`, error);

      // Handle Zod validation errors
      if (error instanceof ZodError) {
        return {
          success: false,
          error: error.issues[0]?.message || "Validation failed",
        };
      }

      // Handle known error types
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Handle unknown errors
      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  };
}

/**
 * Throws an error with a user-friendly message if validation fails
 */
export function handleValidationError(result: {
  success: boolean;
  error?: { message: string };
}): void {
  if (!result.success && result.error) {
    throw new Error(result.error.message);
  }
}

/**
 * Logs errors consistently across server actions
 */
export function logError(context: string, error: unknown): void {
  console.error(`[${context}] Error:`, error);
}
