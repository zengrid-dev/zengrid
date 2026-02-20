/**
 * Date parsing utilities
 *
 * Provides flexible parsing of various date formats.
 */

/**
 * Parse any date-like value into a Date object
 */
export function parseDate(value: any): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Already a Date
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // Number (timestamp)
  if (typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  // String
  if (typeof value === 'string') {
    return parseStringDate(value.trim());
  }

  return null;
}

/**
 * Parse a string into a Date
 */
function parseStringDate(str: string): Date | null {
  // Try ISO format first (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime()) && date.getDate() === day) {
      return date;
    }
  }

  // Try MM/DD/YYYY
  const mdyMatch = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (mdyMatch) {
    const month = parseInt(mdyMatch[1], 10) - 1;
    const day = parseInt(mdyMatch[2], 10);
    const year = parseInt(mdyMatch[3], 10);

    // Only accept if month is valid (1-12)
    if (month >= 0 && month <= 11) {
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime()) && date.getDate() === day) {
        return date;
      }
    }
  }

  // Try YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime()) && date.getDate() === day) {
      return date;
    }
  }

  // Try native Date parsing as fallback
  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Parse a time string (HH:mm or HH:mm:ss)
 */
export function parseTime(str: string): { hours: number; minutes: number; seconds: number } | null {
  const match = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  const ampm = match[4];

  // Handle AM/PM
  if (ampm) {
    const isPM = ampm.toUpperCase() === 'PM';
    if (isPM && hours < 12) {
      hours += 12;
    } else if (!isPM && hours === 12) {
      hours = 0;
    }
  }

  // Validate
  if (hours < 0 || hours > 23) return null;
  if (minutes < 0 || minutes > 59) return null;
  if (seconds < 0 || seconds > 59) return null;

  return { hours, minutes, seconds };
}

/**
 * Parse a datetime string
 */
export function parseDateTime(str: string): Date | null {
  // Try ISO format
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Try splitting by space or T
  const parts = str.split(/[\sT]+/);
  if (parts.length === 2) {
    const datePart = parseDate(parts[0]);
    const timePart = parseTime(parts[1]);

    if (datePart && timePart) {
      datePart.setHours(timePart.hours, timePart.minutes, timePart.seconds);
      return datePart;
    }
  }

  return null;
}

/**
 * Validate that a date is within a range
 */
export function isDateInRange(
  date: Date,
  minDate?: Date | null,
  maxDate?: Date | null
): boolean {
  if (minDate && date < minDate) {
    return false;
  }
  if (maxDate && date > maxDate) {
    return false;
  }
  return true;
}

/**
 * Check if a date is valid
 */
export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}
