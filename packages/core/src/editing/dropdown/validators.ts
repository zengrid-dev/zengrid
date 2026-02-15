import type { ValidationResult } from '../cell-editor.interface';
import type { DropdownOption, DropdownEditorNormalizedOptions } from './types';

/**
 * Validate dropdown value
 */
export function validateDropdownValue(
  value: any,
  options: DropdownEditorNormalizedOptions,
  allOptions: DropdownOption[]
): boolean | ValidationResult {
  // Required validation
  if (options.required) {
    if (options.multiSelect) {
      if (!Array.isArray(value) || value.length === 0) {
        return {
          valid: false,
          message: 'Please select at least one option',
        };
      }
    } else {
      if (value === null || value === undefined || value === '') {
        return {
          valid: false,
          message: 'This field is required',
        };
      }
    }
  }

  // Check if value exists in options (unless custom values allowed)
  if (!options.allowCustom) {
    const validValues = new Set(allOptions.map((opt) => opt.value));
    if (options.multiSelect) {
      if (Array.isArray(value)) {
        for (const v of value) {
          if (!validValues.has(v)) {
            return {
              valid: false,
              message: `Invalid value: ${v}`,
            };
          }
        }
      }
    } else {
      if (value !== null && value !== undefined && !validValues.has(value)) {
        return {
          valid: false,
          message: 'Please select a valid option',
        };
      }
    }
  }

  // Custom validator
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
