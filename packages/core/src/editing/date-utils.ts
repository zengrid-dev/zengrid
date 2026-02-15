/**
 * Parse value into a Date object
 */
export function parseDate(value: any): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

/**
 * Format date for display in input (DD/MM/YYYY format)
 */
export function formatDateForDisplay(date: Date, format: string): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', String(year));
}

/**
 * Format date for Vanilla Calendar (YYYY-MM-DD)
 */
export function formatDateForCalendar(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
