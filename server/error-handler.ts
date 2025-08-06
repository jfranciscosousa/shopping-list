import { ZodError } from "zod";

/**
 * Wraps a server action with consistent error handling
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
): (...args: T) => Promise<R> {
  return async (...args: T) => {
    try {
      return fn(...args);
    } catch (error) {
      console.error(`Error in ${fn.name}:`, error);

      // Handle Zod validation errors
      if (error instanceof ZodError) {
        throw new Error(error.issues[0]?.message || "Validation failed");
      }

      // Handle known error types
      if (error instanceof Error) {
        throw error;
      }

      // Handle unknown errors
      throw new Error("An unexpected error occurred");
    }
  };
}
