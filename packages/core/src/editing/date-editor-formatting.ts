/**
 * Parse various date input formats to Date object
 *
 * @param value - The value to parse (Date, string, number, null, undefined)
 * @returns Parsed Date object or null
 */
export function parseDate(value: any): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    // Assume timestamp
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'string') {
    // Try to parse string
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/**
 * Format Date object for HTML5 input based on type
 *
 * Uses LOCAL time for all formats (datetime-local and time inputs expect local time)
 *
 * @param date - The Date object to format
 * @param type - Input type (date, datetime-local, time)
 * @returns Formatted date string
 */
export function formatDateForInput(
  date: Date,
  type: 'date' | 'datetime-local' | 'time'
): string {
  // Get local time components (not UTC)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  if (type === 'date') {
    // YYYY-MM-DD
    return `${year}-${month}-${day}`;
  } else if (type === 'datetime-local') {
    // YYYY-MM-DDTHH:MM (local time, not UTC)
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } else if (type === 'time') {
    // HH:MM (local time, not UTC)
    return `${hours}:${minutes}`;
  }

  // Default to date format
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display in messages
 *
 * @param date - The Date object to format
 * @returns Formatted date string
 */
export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString();
}
