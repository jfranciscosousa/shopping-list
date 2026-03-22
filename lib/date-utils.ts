/**
 * Formats a date object removing it's time information
 */
export function datetimeToDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Parses a date input from HTML date inputs into a Date object
 */
export function parseDateFromInput(dateInput: unknown): Date {
  if (dateInput instanceof Date) return dateInput;

  if (typeof dateInput !== "string" && typeof dateInput !== "number") {
    throw new Error(`invalid date input of type ${typeof dateInput}`);
  }

  return new Date(dateInput);
}

/**
 * Checks if a date is expired (before today)
 */
export function isExpired(expiryDate: Date): boolean {
  return expiryDate < new Date();
}

/**
 * Calculates the number of days until a date expires
 */
export function getDaysUntilExpiry(expiryDate: Date): number {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Gets the current date with time set to midnight
 */
export function getCurrentDate(): Date {
  return new Date();
}

/**
 * Safely parses a date string from form data, returns null if invalid
 */
export function safeParseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}
