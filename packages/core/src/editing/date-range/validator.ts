import type { ValidationResult } from '../cell-editor.interface';
import type { DateRange, DateRangeEditorNormalizedOptions } from './types';
import { parseDate, formatDateForDisplay } from './formatters';

/**
 * Validate date range value
 */
export function validateDateRange(
  value: DateRange,
  options: DateRangeEditorNormalizedOptions
): boolean | ValidationResult {
  if (options.required && (!value.start || !value.end)) {
    return { valid: false, message: 'Both start and end dates are required' };
  }

  if (!value.start && !value.end && !options.required) {
    return true;
  }

  if ((value.start && !value.end) || (!value.start && value.end)) {
    return { valid: false, message: 'Please select both start and end dates' };
  }

  if (value.start && (!(value.start instanceof Date) || isNaN(value.start.getTime()))) {
    return { valid: false, message: 'Invalid start date' };
  }

  if (value.end && (!(value.end instanceof Date) || isNaN(value.end.getTime()))) {
    return { valid: false, message: 'Invalid end date' };
  }

  if (value.start && value.end) {
    if (value.end < value.start) {
      return { valid: false, message: 'End date must be after or equal to start date' };
    }

    if (!options.allowSameDate && value.end.getTime() === value.start.getTime()) {
      return { valid: false, message: 'End date must be different from start date' };
    }
  }

  const minDate = parseDate(options.minDate);
  const maxDate = parseDate(options.maxDate);

  if (minDate && value.start && value.start < minDate) {
    return {
      valid: false,
      message: `Start date must be after ${formatDateForDisplay(minDate, options.format)}`,
    };
  }

  if (maxDate && value.end && value.end > maxDate) {
    return {
      valid: false,
      message: `End date must be before ${formatDateForDisplay(maxDate, options.format)}`,
    };
  }

  if (options.validator) {
    const result = options.validator(value);
    if (typeof result === 'boolean') {
      return result;
    }
    return { valid: false, message: result };
  }

  return true;
}
