import type { ValidationResult } from './cell-editor.interface';
import type { DateEditorOptions } from './date-editor-types-native';
import { parseDate, formatDateForDisplay } from './date-editor-formatting';

/**
 * Check if current value is valid
 *
 * Checks:
 * - Required field validation
 * - Valid date format
 * - Min/max date range validation
 * - Custom validator function
 *
 * @param value - The date value to validate
 * @param options - Editor options
 * @returns True if valid, false otherwise, or ValidationResult object
 */
export function validateDate(
  value: Date | null,
  options: Required<Omit<DateEditorOptions, 'validator'>> & {
    validator?: (value: Date | null) => boolean | string;
  }
): boolean | ValidationResult {
  // Required validation
  if (options.required && value === null) {
    return {
      valid: false,
      message: 'This field is required',
    };
  }

  // Skip other validations if value is null and not required
  if (value === null && !options.required) {
    return true;
  }

  // Check if value is a valid Date
  if (!(value instanceof Date) || isNaN(value.getTime())) {
    return {
      valid: false,
      message: 'Invalid date format',
    };
  }

  // Min date validation
  const minDate = parseDate(options.minDate);
  if (minDate && value < minDate) {
    return {
      valid: false,
      message: `Date must be after ${formatDateForDisplay(minDate)}`,
    };
  }

  // Max date validation
  const maxDate = parseDate(options.maxDate);
  if (maxDate && value > maxDate) {
    return {
      valid: false,
      message: `Date must be before ${formatDateForDisplay(maxDate)}`,
    };
  }

  // Custom validator
  if (options.validator) {
    const result = options.validator(value);
    if (typeof result === 'boolean') {
      return result;
    }
    // If string is returned, it's an error message
    return {
      valid: false,
      message: result,
    };
  }

  return true;
}
