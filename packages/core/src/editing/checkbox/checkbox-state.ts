import type { CheckboxEditorOptions } from './checkbox-types';

/**
 * Manages checkbox state and value normalization
 */
export class CheckboxState {
  constructor(private options: Required<Omit<CheckboxEditorOptions, 'validator'>> & {
    validator?: (value: boolean | null) => boolean | string;
  }) {}

  /**
   * Normalize value to boolean or null
   *
   * Converts various input types to boolean or null for indeterminate state.
   *
   * @param value - The value to normalize
   * @returns Boolean or null for indeterminate
   */
  normalizeValue(value: any): boolean | null {
    if (value === null || value === undefined) {
      return this.options.allowIndeterminate ? null : false;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    // Handle string representations
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on') {
        return true;
      }
      if (lower === 'false' || lower === '0' || lower === 'no' || lower === 'off') {
        return false;
      }
      if (lower === 'null' || lower === 'indeterminate' || lower === 'mixed') {
        return this.options.allowIndeterminate ? null : false;
      }
    }

    // Handle numbers
    if (typeof value === 'number') {
      return value !== 0;
    }

    // Default to false for unknown types
    return false;
  }

  /**
   * Get the current value from the checkbox element
   *
   * @param checkboxElement - The checkbox element
   * @returns Boolean or null (if indeterminate is allowed)
   */
  getValue(checkboxElement: HTMLInputElement | null): boolean | null {
    if (!checkboxElement) {
      return null;
    }

    if (checkboxElement.indeterminate && this.options.allowIndeterminate) {
      return null;
    }

    return checkboxElement.checked;
  }

  /**
   * Update aria-checked attribute
   *
   * @param element - The checkbox element
   * @param value - Current value
   */
  updateAriaChecked(element: HTMLInputElement, value: boolean | null): void {
    if (value === null) {
      element.setAttribute('aria-checked', 'mixed');
    } else if (value === true) {
      element.setAttribute('aria-checked', 'true');
    } else {
      element.setAttribute('aria-checked', 'false');
    }
  }
}
