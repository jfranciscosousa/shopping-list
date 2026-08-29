type ActionResult = {
  success: boolean;
  error?: string;
};

/** Converts expected server-action failures into mutation failures for rollback. */
export async function requireSuccess<T extends ActionResult>(operation: Promise<T>): Promise<T> {
  const result = await operation;

  if (!result.success) {
    throw new Error(result.error || "We couldn't complete that request. Please try again.");
  }

  return result;
}
