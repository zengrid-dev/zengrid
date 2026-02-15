import type { DateRange } from './types';

/**
 * Parse value into a DateRange object
 */
export function parseRange(value: any): DateRange {
  if (!value) {
    return { start: null, end: null };
  }

  if (typeof value === 'object' && 'start' in value && 'end' in value) {
    return {
      start: parseDate(value.start),
      end: parseDate(value.end),
    };
  }

  return { start: null, end: null };
}

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
 * Format date for display in input
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
 * Format date range for display
 */
export function formatRangeForDisplay(range: DateRange, format: string): string {
  if (!range.start || !range.end) return '';
  return `${formatDateForDisplay(range.start, format)} - ${formatDateForDisplay(range.end, format)}`;
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

/**
 * Format date in long format (e.g., "10 February 2023")
 */
export function formatDateLong(date: Date): string {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}
