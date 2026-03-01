import type { DateRange, DateRangeEditorOptions, ResolvedDateRangeEditorOptions } from './types';
import type { ValidationResult } from '../../cell-editor.interface';
import { parseDate, formatDateRange, isDateInRange } from '../../../datetime-core';

export function resolveOptions(options: DateRangeEditorOptions): ResolvedDateRangeEditorOptions {
  return {
    format: options.format ?? 'DD/MM/YYYY',
    minDate: options.minDate ? parseDate(options.minDate) : null,
    maxDate: options.maxDate ? parseDate(options.maxDate) : null,
    required: options.required ?? false,
    placeholder: options.placeholder ?? 'Select date range...',
    className: options.className ?? 'zg-date-range-editor',
    theme: options.theme ?? 'light',
    autoFocus: options.autoFocus ?? true,
    allowSameDate: options.allowSameDate ?? true,
    closeOnScroll: options.closeOnScroll ?? true,
    separator: options.separator ?? ' - ',
    validator: options.validator,
  };
}

export function parseRange(value: any): DateRange {
  if (!value || typeof value !== 'object') {
    return { start: null, end: null };
  }
  return {
    start: parseDate(value.start),
    end: parseDate(value.end),
  };
}

export function getDisplayText(
  currentValue: DateRange,
  options: ResolvedDateRangeEditorOptions
): string {
  const { start, end } = currentValue;
  if (!start && !end) {
    return options.placeholder;
  }
  return formatDateRange(start, end, options.format, options.separator);
}

export function validateRange(
  currentValue: DateRange,
  options: ResolvedDateRangeEditorOptions
): boolean | ValidationResult {
  const { start, end } = currentValue;

  if (options.required && (!start || !end)) {
    return { valid: false, message: 'Date range is required' };
  }

  if (start && end && start > end) {
    return { valid: false, message: 'Start date must be before end date' };
  }

  if (!options.allowSameDate && start && end) {
    if (start.getTime() === end.getTime()) {
      return { valid: false, message: 'Start and end dates cannot be the same' };
    }
  }

  if (start && !isDateInRange(start, options.minDate, options.maxDate)) {
    return { valid: false, message: 'Start date is outside allowed range' };
  }
  if (end && !isDateInRange(end, options.minDate, options.maxDate)) {
    return { valid: false, message: 'End date is outside allowed range' };
  }

  if (options.validator) {
    const result = options.validator(currentValue);
    if (result === true) {
      return true;
    }
    if (typeof result === 'string') {
      return { valid: false, message: result };
    }
    return { valid: false };
  }

  return true;
}
