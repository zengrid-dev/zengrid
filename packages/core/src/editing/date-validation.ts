import type { ValidationResult } from './cell-editor.interface';
import type { VanillaDateEditorOptions } from './date-editor-types';
import { parseDate, formatDateForDisplay } from './date-utils';

/**
 * Validate date value
 */
export function validateDate(
  value: Date | null,
  options: Required<Omit<VanillaDateEditorOptions, 'validator'>> & {
    validator?: (value: Date | null) => boolean | string;
  }
): boolean | ValidationResult {
  if (options.required && value === null) {
    return {
      valid: false,
      message: 'This field is required',
    };
  }

  if (value === null && !options.required) {
    return true;
  }

  if (!(value instanceof Date) || isNaN(value.getTime())) {
    return {
      valid: false,
      message: 'Invalid date',
    };
  }

  const minDate = parseDate(options.minDate);
  if (minDate && value < minDate) {
    return {
      valid: false,
      message: `Date must be after ${formatDateForDisplay(minDate, options.format)}`,
    };
  }

  const maxDate = parseDate(options.maxDate);
  if (maxDate && value > maxDate) {
    return {
      valid: false,
      message: `Date must be before ${formatDateForDisplay(maxDate, options.format)}`,
    };
  }

  if (options.validator) {
    const result = options.validator(value);
    if (typeof result === 'boolean') {
      return result;
    }
    return {
      valid: false,
      message: result,
    };
  }

  return true;
}
