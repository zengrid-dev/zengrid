import type { CellEditor, EditorParams, ValidationResult } from './cell-editor.interface';
import { throttle } from '@zengrid/shared';

/**
 * Configuration options for VanillaDateEditor
 */
export interface VanillaDateEditorOptions {
  /** Date format for display (default: 'DD/MM/YYYY') */
  format?: string;
  /** Minimum allowed date */
  minDate?: Date | string;
  /** Maximum allowed date */
  maxDate?: Date | string;
  /** Whether the field is required */
  required?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Custom CSS class for the calendar wrapper */
  className?: string;
  /** Auto-focus on init (default: true) */
  autoFocus?: boolean;
  /** Custom validator function */
  validator?: (value: Date | null) => boolean | string;
  /** Commit on blur (default: true) */
  stopOnBlur?: boolean;
  /** Calendar theme */
  theme?: 'light' | 'dark';
}

/**
 * VanillaDateEditor - Beautiful date picker using vanilla-calendar-pro
 *
 * Features:
 * - Beautiful, consistent UI across all browsers
 * - Works in narrow cells (calendar floats as popup)
 * - Full keyboard navigation
 * - Date range validation
 * - Timezone aware
 * - Lightweight (~13KB)
 * - Fully customizable themes
 *
 * @example
 * ```typescript
 * const editor = new VanillaDateEditor({
 *   format: 'DD/MM/YYYY',
 *   minDate: new Date('2020-01-01'),
 *   maxDate: new Date('2030-12-31'),
 *   required: true
 * });
 * ```
 */
export class VanillaDateEditor implements CellEditor<Date | null> {
  private options: Required<Omit<VanillaDateEditorOptions, 'validator'>> & {
    validator?: (value: Date | null) => boolean | string;
  };
  private inputElement: HTMLInputElement | null = null;
  private calendarWrapper: HTMLDivElement | null = null;
  private calendar: any = null;
  private params: EditorParams | null = null;
  private initialValue: Date | null = null;
  private currentValue: Date | null = null;
  private scrollHandler: (() => void) | null = null;
  private resizeHandler: (() => void) | null = null;

  constructor(options: VanillaDateEditorOptions = {}) {
    this.options = {
      format: options.format ?? 'DD/MM/YYYY',
      minDate: options.minDate ?? new Date('1900-01-01'),
      maxDate: options.maxDate ?? new Date('2099-12-31'),
      required: options.required ?? false,
      placeholder: options.placeholder ?? 'Select date...',
      className: options.className ?? 'zg-vanilla-date-editor',
      autoFocus: options.autoFocus ?? true,
      validator: options.validator,
      stopOnBlur: options.stopOnBlur ?? true,
      theme: options.theme ?? 'light',
    };
  }

  /**
   * Initialize editor in the container element
   */
  init(container: HTMLElement, value: Date | null, params: EditorParams): void {
    this.params = params;
    this.initialValue = this.parseDate(value);
    this.currentValue = this.initialValue;

    // Clear previous content
    container.innerHTML = '';

    // Create wrapper for input + calendar
    const wrapper = document.createElement('div');
    wrapper.className = `${this.options.className}-wrapper`;
    wrapper.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
    `;

    // Create input element
    this.inputElement = this.createInputElement(value);
    wrapper.appendChild(this.inputElement);

    // Create calendar wrapper (initially hidden)
    this.calendarWrapper = document.createElement('div');
    this.calendarWrapper.className = 'vanilla-calendar-wrapper';
    this.calendarWrapper.style.cssText = `
      position: fixed;
      z-index: 10003;
      background: white;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      border-radius: 8px;
      display: none;
    `;
    // Append calendar to document.body (not to wrapper) so it doesn't scroll with the cell
    document.body.appendChild(this.calendarWrapper);

    // Register popup with editor manager to prevent click-outside close
    if (params.registerPopup) {
      params.registerPopup(this.calendarWrapper);
    }

    container.appendChild(wrapper);

    // Initialize Vanilla Calendar (async)
    this.initializeCalendar().then(() => {
      // Position calendar after a slight delay to ensure input is rendered
      requestAnimationFrame(() => {
        this.positionCalendar();

        // Show calendar
        if (this.calendarWrapper) {
          this.calendarWrapper.style.display = 'block';
        }

        // Auto-focus if configured
        if (this.options.autoFocus) {
          this.focus();
        }

        // Setup scroll handler to close editor on scroll (better UX than following)
        this.scrollHandler = () => {
          if (this.calendarWrapper && this.calendarWrapper.style.display !== 'none') {
            // Commit the value when user scrolls (indicates they want to move on)
            if (this.params?.onComplete) {
              this.params.onComplete(this.currentValue, false);
            }
          }
        };
        window.addEventListener('scroll', this.scrollHandler, true); // Capture phase

        // Setup resize handler to reposition on window resize
        this.resizeHandler = throttle(() => {
          if (this.calendarWrapper && this.calendarWrapper.style.display !== 'none') {
            this.positionCalendar();
          }
        }, 100);
        window.addEventListener('resize', this.resizeHandler);
      });
    });
  }

  /**
   * Create the input element
   */
  private createInputElement(value: Date | null): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.readOnly = true; // Make read-only, calendar handles selection
    input.className = this.options.className;
    input.placeholder = this.options.placeholder;

    // Set initial value
    if (value) {
      input.value = this.formatDateForDisplay(value);
    }

    // Inline styles
    input.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      outline: 2px solid #4CAF50;
      padding: 4px 8px;
      font-size: 13px;
      font-family: inherit;
      background: #fff;
      box-sizing: border-box;
      cursor: pointer;
    `;

    // Click to focus calendar
    input.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showCalendar();
    });

    return input;
  }

  /**
   * Initialize Vanilla Calendar
   */
  private async initializeCalendar(): Promise<void> {
    if (!this.calendarWrapper) return;

    const minDate = this.parseDate(this.options.minDate);
    const maxDate = this.parseDate(this.options.maxDate);

    const calendarOptions: any = {
      type: 'default',
      // Disable weekend highlighting for consistent cross-browser appearance
      selectedWeekends: [],
      settings: {
        visibility: {
          theme: this.options.theme,
        },
        selection: {
          day: 'single',
        },
        range: {
          min: minDate ? this.formatDateForCalendar(minDate) : '1900-01-01',
          max: maxDate ? this.formatDateForCalendar(maxDate) : '2099-12-31',
        },
      },
      actions: {
        clickDay: (_e: any, dates: any) => {
          if (dates.selectedDates && dates.selectedDates.length > 0) {
            const selectedDate = new Date(dates.selectedDates[0]);
            this.currentValue = selectedDate;

            // Update input display
            if (this.inputElement) {
              this.inputElement.value = this.formatDateForDisplay(selectedDate);
            }

            // Commit the value
            setTimeout(() => {
              if (this.params?.onComplete) {
                this.params.onComplete(this.currentValue, false);
              }
            }, 100);
          }
        },
      },
    };

    // Set initial selected date if exists
    if (this.initialValue) {
      calendarOptions.settings = {
        ...calendarOptions.settings,
        selected: {
          dates: [this.formatDateForCalendar(this.initialValue)],
        },
      };
    }

    // Dynamic import for ESM compatibility (v3.x uses named export)
    const { Calendar } = await import('vanilla-calendar-pro');

    this.calendar = new Calendar(this.calendarWrapper, calendarOptions);
    this.calendar.init();
  }

  /**
   * Position calendar popup relative to input element.
   * Automatically adjusts to stay within viewport boundaries.
   */
  private positionCalendar(): void {
    if (!this.inputElement || !this.calendarWrapper) return;

    const inputRect = this.inputElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Get calendar dimensions (use actual if rendered, otherwise estimates)
    const calendarRect = this.calendarWrapper.getBoundingClientRect();
    const calendarWidth = calendarRect.width > 0 ? calendarRect.width : 280;
    const calendarHeight = calendarRect.height > 0 ? calendarRect.height : 320;

    // Calculate default position (below input)
    let top = inputRect.bottom + 4;
    let left = inputRect.left;

    // --- Vertical positioning ---
    const spaceBelow = viewportHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;

    // If not enough space below AND more space above, flip to above
    if (spaceBelow < calendarHeight + 8 && spaceAbove > spaceBelow) {
      top = inputRect.top - calendarHeight - 4;
    }

    // Ensure not off top of viewport
    if (top < 8) {
      top = 8;
    }

    // Ensure not off bottom of viewport
    if (top + calendarHeight > viewportHeight - 8) {
      top = viewportHeight - calendarHeight - 8;
    }

    // --- Horizontal positioning ---
    // If calendar would extend past right edge, align to right edge of input
    if (left + calendarWidth > viewportWidth - 8) {
      left = viewportWidth - calendarWidth - 8;
    }

    // Ensure not off left edge
    if (left < 8) {
      left = 8;
    }

    // Apply position
    this.calendarWrapper.style.left = `${left}px`;
    this.calendarWrapper.style.top = `${top}px`;
  }

  /**
   * Show calendar
   */
  private showCalendar(): void {
    if (this.calendarWrapper) {
      this.calendarWrapper.style.display = 'block';
      this.positionCalendar();
    }
  }

  /**
   * Handle key events
   */
  onKeyDown(event: KeyboardEvent): boolean {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (this.params?.onComplete) {
        this.params.onComplete(this.initialValue, true);
      }
      return true;
    }

    // Let calendar handle other keys
    return true;
  }

  /**
   * Get the current value
   */
  getValue(): Date | null {
    return this.currentValue;
  }

  /**
   * Check if current value is valid
   */
  isValid(): boolean | ValidationResult {
    const value = this.currentValue;

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
        message: 'Invalid date',
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
      return {
        valid: false,
        message: result,
      };
    }

    return true;
  }

  /**
   * Focus the input
   */
  focus(): void {
    if (this.inputElement) {
      this.inputElement.focus();
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Destroy calendar
    if (this.calendar) {
      this.calendar.destroy();
      this.calendar = null;
    }

    // Clean up scroll/resize listeners
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler, true);
      this.scrollHandler = null;
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    // Remove elements
    if (this.inputElement) {
      this.inputElement.remove();
      this.inputElement = null;
    }

    // Unregister popup before destroying
    if (this.params?.unregisterPopup && this.calendarWrapper) {
      this.params.unregisterPopup(this.calendarWrapper);
    }

    if (this.calendarWrapper) {
      this.calendarWrapper.remove();
      this.calendarWrapper = null;
    }

    this.params = null;
    this.initialValue = null;
    this.currentValue = null;
  }

  /**
   * Parse value into a Date object
   */
  private parseDate(value: any): Date | null {
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
   * Format date for display in input (DD/MM/YYYY format)
   */
  private formatDateForDisplay(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    // Use configured format
    const format = this.options.format;
    return format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', String(year));
  }

  /**
   * Format date for Vanilla Calendar (YYYY-MM-DD)
   */
  private formatDateForCalendar(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Factory function to create VanillaDateEditor
 */
export function createVanillaDateEditor(
  options: VanillaDateEditorOptions = {}
): VanillaDateEditor {
  return new VanillaDateEditor(options);
}
