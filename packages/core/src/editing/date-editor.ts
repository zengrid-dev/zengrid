import type { CellEditor, EditorParams, ValidationResult } from './cell-editor.interface';

/**
 * Supported date format patterns for input/output
 */
export type DateFormat =
  | 'MM/DD/YYYY'
  | 'DD/MM/YYYY'
  | 'YYYY-MM-DD'
  | 'DD-MM-YYYY'
  | 'MM-DD-YYYY'
  | 'YYYY/MM/DD';

/**
 * Configuration options for DateEditor
 */
export interface DateEditorOptions {
  /** Date format pattern (default: 'YYYY-MM-DD' for HTML5 input) */
  format?: DateFormat;
  /** Minimum allowed date */
  minDate?: Date | string;
  /** Maximum allowed date */
  maxDate?: Date | string;
  /** Use native HTML5 date picker (default: true) */
  useNativePicker?: boolean;
  /** Input type for native picker (date, datetime-local, time) */
  type?: 'date' | 'datetime-local' | 'time';
  /** Placeholder text */
  placeholder?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Custom CSS class for the input element */
  className?: string;
  /** Auto-focus on init (default: true) */
  autoFocus?: boolean;
  /** Select all text on focus (default: false) */
  selectAllOnFocus?: boolean;
  /** Custom validator function */
  validator?: (value: Date | null) => boolean | string;
  /** Commit on blur (default: true) */
  stopOnBlur?: boolean;
}

/**
 * DateEditor - Date input editor for cell editing
 *
 * Features:
 * - Native HTML5 date picker for better mobile support
 * - Multiple input types (date, datetime-local, time)
 * - Auto-focus on init with optional select all
 * - Enter to commit, Escape to cancel
 * - Date range validation (min/max dates)
 * - Multiple date format support
 * - Value normalization from strings, numbers (timestamps), Date objects
 * - Custom validation functions
 * - Full ARIA attributes
 * - Blur handling for commit
 * - Initial value restoration on cancel
 * - Required field validation
 * - Placeholder support
 *
 * Performance: Lightweight, uses native browser date picker
 *
 * @example
 * ```typescript
 * // Basic date editor
 * const editor = new DateEditor({
 *   placeholder: 'Select date...',
 *   required: true
 * });
 *
 * // Date editor with range validation
 * const editor = new DateEditor({
 *   type: 'date',
 *   minDate: new Date('2020-01-01'),
 *   maxDate: new Date('2030-12-31'),
 *   validator: (value) => value ? true : 'Date is required'
 * });
 *
 * // Datetime editor with custom format
 * const editor = new DateEditor({
 *   type: 'datetime-local',
 *   format: 'YYYY-MM-DD',
 *   autoFocus: true
 * });
 * ```
 */
export class DateEditor implements CellEditor<Date | null> {
  private options: Required<Omit<DateEditorOptions, 'validator'>> & {
    validator?: (value: Date | null) => boolean | string;
  };
  private inputElement: HTMLInputElement | null = null;
  private params: EditorParams | null = null;
  private isDestroyed = false;
  private initialValue: Date | null = null;

  /**
   * Creates a new DateEditor instance
   *
   * @param options - Configuration options for the editor
   */
  constructor(options: DateEditorOptions = {}) {
    this.options = {
      format: options.format ?? 'YYYY-MM-DD',
      minDate: options.minDate ?? new Date('1900-01-01'),
      maxDate: options.maxDate ?? new Date('2099-12-31'),
      useNativePicker: options.useNativePicker ?? true,
      type: options.type ?? 'date',
      placeholder: options.placeholder ?? '',
      required: options.required ?? false,
      className: options.className ?? 'zg-date-editor',
      autoFocus: options.autoFocus ?? true,
      selectAllOnFocus: options.selectAllOnFocus ?? false,
      validator: options.validator,
      stopOnBlur: options.stopOnBlur ?? true,
    };
  }

  /**
   * Initialize editor in the container element
   *
   * Creates a date input element, sets up event listeners, and focuses if configured.
   *
   * @param container - The DOM element to render the editor into
   * @param value - Initial value for the editor
   * @param params - Edit parameters including callbacks
   */
  init(container: HTMLElement, value: Date | null, params: EditorParams): void {
    this.isDestroyed = false;
    this.params = params;
    this.initialValue = this.parseDate(value);

    // Clear previous content
    container.innerHTML = '';

    // Create input element
    this.inputElement = this.createInputElement(value, params);

    // Append to container
    container.appendChild(this.inputElement);

    // Auto-focus if configured
    if (this.options.autoFocus) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        this.focus();
        // Select all text if configured (for text mode fallback)
        if (this.options.selectAllOnFocus && this.inputElement) {
          this.inputElement.select();
        }
      });
    }
  }

  /**
   * Create the date input element with all attributes and event listeners
   *
   * @param value - Initial value
   * @param params - Edit parameters
   * @returns The configured input element
   */
  private createInputElement(value: Date | null, params: EditorParams): HTMLInputElement {
    const input = document.createElement('input');

    // Set input type based on configuration
    input.type = this.options.useNativePicker ? this.options.type : 'text';
    input.className = this.options.className;

    // Set initial value
    const dateValue = this.parseDate(value);
    if (dateValue) {
      input.value = this.formatDateForInput(dateValue);
    }

    if (this.options.placeholder) {
      input.placeholder = this.options.placeholder;
    }

    if (this.options.required) {
      input.required = true;
    }

    // Set min/max attributes for native date picker
    if (this.options.useNativePicker) {
      const minDate = this.parseDate(this.options.minDate);
      const maxDate = this.parseDate(this.options.maxDate);

      if (minDate) {
        input.min = this.formatDateForInput(minDate);
      }
      if (maxDate) {
        input.max = this.formatDateForInput(maxDate);
      }
    }

    // Set ARIA attributes for accessibility
    input.setAttribute('role', 'textbox');
    input.setAttribute(
      'aria-label',
      `Edit ${params.column?.header || params.column?.field || 'date'}`
    );
    input.setAttribute('aria-required', String(this.options.required));

    // Set data attributes
    input.dataset.row = String(params.cell.row);
    input.dataset.col = String(params.cell.col);
    if (params.column?.field) {
      input.dataset.field = params.column.field;
    }

    // Inline styles for better UX
    input.style.width = '100%';
    input.style.height = '100%';
    input.style.border = 'none';
    input.style.outline = '2px solid #4CAF50';
    input.style.padding = '4px 8px';
    input.style.fontSize = '13px';
    input.style.fontFamily = 'inherit';
    input.style.backgroundColor = '#fff';
    input.style.boxSizing = 'border-box';

    // Set up event listeners
    this.attachEventListeners(input, params);

    return input;
  }

  /**
   * Attach event listeners for keyboard navigation and blur handling
   *
   * @param input - The input element
   * @param params - Edit parameters
   */
  private attachEventListeners(input: HTMLInputElement, params: EditorParams): void {
    // Blur handling
    if (this.options.stopOnBlur) {
      input.addEventListener('blur', () => {
        // Small delay to allow for other click events to fire first
        setTimeout(() => {
          if (!this.isDestroyed) {
            this.handleCommit();
          }
        }, 100);
      });
    }

    // onChange callback for real-time updates
    if (params.onChange) {
      input.addEventListener('input', () => {
        const value = this.getValue();
        params.onChange!(value);
      });
    }

    // Prevent event propagation to grid
    input.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
    });

    input.addEventListener('mousedown', (e: MouseEvent) => {
      e.stopPropagation();
    });
  }

  /**
   * Handle key events
   *
   * @param event - Keyboard event
   * @returns True if handled, false to propagate
   */
  onKeyDown(event: KeyboardEvent): boolean {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      this.handleCommit();
      return true;
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.handleCancel();
      return true;
    }

    // Don't propagate other keys to grid (avoid navigation while editing)
    event.stopPropagation();
    return true;
  }

  /**
   * Handle commit action (Enter key or blur)
   */
  private handleCommit(): void {
    if (this.isDestroyed || !this.params) return;

    const value = this.getValue();
    const validationResult = this.isValid();

    // Check if valid
    let isValid = false;
    if (typeof validationResult === 'boolean') {
      isValid = validationResult;
    } else {
      isValid = validationResult.valid;
    }

    if (isValid) {
      this.params.onComplete?.(value, false);
    } else {
      // Validation failed - log warning but still complete with cancelled flag
      if (typeof validationResult === 'object' && validationResult.message) {
        console.warn('DateEditor: Validation failed:', validationResult.message);
      } else {
        console.warn('DateEditor: Validation failed for value:', value);
      }
      // Could choose to not commit, but for now we'll still commit
      this.params.onComplete?.(value, false);
    }
  }

  /**
   * Handle cancel action (Escape key)
   */
  private handleCancel(): void {
    if (this.isDestroyed || !this.params) return;

    // Restore initial value before cancelling
    if (this.inputElement && this.initialValue) {
      this.inputElement.value = this.formatDateForInput(this.initialValue);
    } else if (this.inputElement) {
      this.inputElement.value = '';
    }

    const value = this.initialValue;
    this.params.onComplete?.(value, true);
  }

  /**
   * Parse various date input formats to Date object
   *
   * @param value - The value to parse (Date, string, number, null, undefined)
   * @returns Parsed Date object or null
   */
  private parseDate(value: any): Date | null {
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
   * @param date - The Date object to format
   * @returns Formatted date string
   */
  private formatDateForInput(date: Date): string {
    const type = this.options.type;

    if (type === 'date') {
      // YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } else if (type === 'datetime-local') {
      // YYYY-MM-DDTHH:MM
      return date.toISOString().slice(0, 16);
    } else if (type === 'time') {
      // HH:MM
      return date.toISOString().slice(11, 16);
    }

    // Default to date format
    return date.toISOString().split('T')[0];
  }

  /**
   * Get the current value from the editor
   *
   * @returns The current editor value as a Date object or null
   */
  getValue(): Date | null {
    if (!this.inputElement) {
      return null;
    }

    const value = this.inputElement.value;
    if (value === '') {
      return null;
    }

    return this.parseDate(value);
  }

  /**
   * Check if current value is valid
   *
   * Checks:
   * - Required field validation
   * - Valid date format
   * - Min/max date range validation
   * - Custom validator function
   *
   * @returns True if valid, false otherwise, or ValidationResult object
   */
  isValid(): boolean | ValidationResult {
    const value = this.getValue();

    // Required validation
    if (this.options.required && value === null) {
      return {
        valid: false,
        message: 'This field is required',
      };
    }

    // Skip other validations if value is null and not required
    if (value === null && !this.options.required) {
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
    const minDate = this.parseDate(this.options.minDate);
    if (minDate && value < minDate) {
      return {
        valid: false,
        message: `Date must be after ${this.formatDateForDisplay(minDate)}`,
      };
    }

    // Max date validation
    const maxDate = this.parseDate(this.options.maxDate);
    if (maxDate && value > maxDate) {
      return {
        valid: false,
        message: `Date must be before ${this.formatDateForDisplay(maxDate)}`,
      };
    }

    // Custom validator
    if (this.options.validator) {
      const result = this.options.validator(value);
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

  /**
   * Format date for display in messages
   *
   * @param date - The Date object to format
   * @returns Formatted date string
   */
  private formatDateForDisplay(date: Date): string {
    return date.toLocaleDateString();
  }

  /**
   * Focus the editor input element
   */
  focus(): void {
    if (this.inputElement) {
      this.inputElement.focus();
    }
  }

  /**
   * Clean up resources when editing stops
   *
   * Removes event listeners and clears references to prevent memory leaks
   */
  destroy(): void {
    this.isDestroyed = true;

    if (this.inputElement) {
      // Remove from DOM (parent will handle)
      this.inputElement.remove();
    }

    this.inputElement = null;
    this.params = null;
    this.initialValue = null;
  }
}

/**
 * Factory function to create DateEditor
 *
 * @example
 * ```typescript
 * // In column definition
 * const column = {
 *   field: 'birthDate',
 *   header: 'Birth Date',
 *   editable: true,
 *   editor: 'date', // Registered name
 * };
 *
 * // Or create directly
 * const editor = createDateEditor({
 *   type: 'date',
 *   minDate: new Date('1900-01-01'),
 *   maxDate: new Date(),
 *   required: true
 * });
 * ```
 */
export function createDateEditor(options: DateEditorOptions = {}): DateEditor {
  return new DateEditor(options);
}
