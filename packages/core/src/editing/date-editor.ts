import type { CellEditor, EditorParams } from './cell-editor.interface';
import type { DateEditorOptions } from './date-editor-types-native';
import { parseDate } from './date-editor-formatting';
import { createInputElement } from './date-editor-dom';
import { validateDate } from './date-editor-validation-native';
import {
  attachBlurHandler,
  handleKeyDown,
  handleCommit,
  handleCancel,
} from './date-editor-events';

// Re-export types
export type { DateFormat, DateEditorOptions } from './date-editor-types-native';

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
    this.initialValue = parseDate(value);

    // Clear previous content
    container.innerHTML = '';

    // Create input element
    this.inputElement = createInputElement(
      value,
      params,
      this.options,
      params.onChange ? (val) => params.onChange!(val) : undefined
    );

    // Append to container
    container.appendChild(this.inputElement);

    // Attach blur handler if configured
    if (this.options.stopOnBlur) {
      attachBlurHandler(
        this.inputElement,
        () => this.commitValue(),
        () => this.isDestroyed
      );
    }

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
   * Handle key events
   *
   * @param event - Keyboard event
   * @returns True if handled, false to propagate
   */
  onKeyDown(event: KeyboardEvent): boolean {
    return handleKeyDown(
      event,
      () => this.commitValue(),
      () => this.cancelEdit()
    );
  }

  /**
   * Handle commit action (Enter key or blur)
   */
  private commitValue(): void {
    if (this.isDestroyed || !this.params) return;

    const value = this.getValue();
    const validationResult = this.isValid();

    handleCommit(value, validationResult, this.params);
  }

  /**
   * Handle cancel action (Escape key)
   */
  private cancelEdit(): void {
    if (this.isDestroyed || !this.params) return;

    handleCancel(
      this.inputElement,
      this.initialValue,
      this.options.type,
      this.params
    );
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

    return parseDate(value);
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
  isValid() {
    const value = this.getValue();
    return validateDate(value, this.options);
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
