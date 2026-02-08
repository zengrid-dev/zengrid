import type { CellEditor, EditorParams, ValidationResult } from './cell-editor.interface';
import { throttle } from '@zengrid/shared';

/**
 * Date range value type
 */
export interface DateRange {
  start: Date | null;
  end: Date | null;
}

/**
 * Configuration options for DateRangeEditor
 */
export interface DateRangeEditorOptions {
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
  validator?: (value: DateRange) => boolean | string;
  /** Commit on blur (default: true) */
  stopOnBlur?: boolean;
  /** Calendar theme */
  theme?: 'light' | 'dark';
  /** Allow same start and end date (default: true) */
  allowSameDate?: boolean;
}

/**
 * DateRangeEditor - Date range picker with dual calendars
 *
 * Features:
 * - Two side-by-side calendars for start and end dates
 * - Visual range selection
 * - Validation (end >= start)
 * - Keyboard navigation
 * - Responsive popup positioning
 *
 * @example
 * ```typescript
 * const editor = new DateRangeEditor({
 *   format: 'DD/MM/YYYY',
 *   minDate: new Date('2020-01-01'),
 *   required: true
 * });
 * ```
 */
export class DateRangeEditor implements CellEditor<DateRange> {
  private options: Required<Omit<DateRangeEditorOptions, 'validator'>> & {
    validator?: (value: DateRange) => boolean | string;
  };
  private inputElement: HTMLInputElement | null = null;
  private calendarWrapper: HTMLDivElement | null = null;
  private startCalendarDiv: HTMLDivElement | null = null;
  private endCalendarDiv: HTMLDivElement | null = null;
  private startCalendar: any = null;
  private endCalendar: any = null;
  private params: EditorParams | null = null;
  private initialValue: DateRange = { start: null, end: null };
  private currentValue: DateRange = { start: null, end: null };
  private scrollHandler: (() => void) | null = null;
  private resizeHandler: (() => void) | null = null;

  constructor(options: DateRangeEditorOptions = {}) {
    this.options = {
      format: options.format ?? 'DD/MM/YYYY',
      minDate: options.minDate ?? new Date('1900-01-01'),
      maxDate: options.maxDate ?? new Date('2099-12-31'),
      required: options.required ?? false,
      placeholder: options.placeholder ?? 'Select date range...',
      className: options.className ?? 'zg-date-range-editor',
      autoFocus: options.autoFocus ?? true,
      validator: options.validator,
      stopOnBlur: options.stopOnBlur ?? true,
      theme: options.theme ?? 'light',
      allowSameDate: options.allowSameDate ?? true,
    };
  }

  /**
   * Initialize editor in the container element
   */
  init(container: HTMLElement, value: DateRange | null, params: EditorParams): void {
    this.params = params;
    this.initialValue = this.parseRange(value);
    this.currentValue = { ...this.initialValue };

    // Clear previous content
    container.innerHTML = '';

    // Create wrapper for input + calendars
    const wrapper = document.createElement('div');
    wrapper.className = `${this.options.className}-wrapper`;
    wrapper.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
    `;

    // Create input element
    this.inputElement = this.createInputElement(this.initialValue);
    wrapper.appendChild(this.inputElement);

    // Create calendar wrapper (initially hidden)
    this.calendarWrapper = document.createElement('div');
    this.calendarWrapper.className = 'date-range-calendar-wrapper zg-date-range-picker';
    this.calendarWrapper.style.cssText = `
      position: fixed;
      z-index: 10003;
      background: white;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      border-radius: 12px;
      display: none;
      padding: 20px 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create header
    const header = document.createElement('div');
    header.className = 'zg-date-range-header';
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
      gap: 16px;
    `;

    // Date range display pill
    const dateRangePill = document.createElement('div');
    dateRangePill.id = 'date-range-pill';
    dateRangePill.className = 'zg-date-range-pill';
    dateRangePill.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 24px;
      font-size: 14px;
      color: #374151;
      white-space: nowrap;
    `;
    dateRangePill.innerHTML = `
      <span id="pill-start-date" style="color: #111827;">Select start date</span>
      <span style="color: #9ca3af;">—</span>
      <span id="pill-end-date" style="color: #111827;">Select end date</span>
    `;

    // Actions container
    const actionsContainer = document.createElement('div');
    actionsContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
    `;

    // Clear filters button
    const clearBtn = document.createElement('button');
    clearBtn.id = 'range-clear-btn';
    clearBtn.textContent = 'Clear filters';
    clearBtn.style.cssText = `
      background: transparent;
      color: #4f7df3;
      border: none;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `;
    clearBtn.addEventListener('mouseenter', () => {
      clearBtn.style.textDecoration = 'underline';
    });
    clearBtn.addEventListener('mouseleave', () => {
      clearBtn.style.textDecoration = 'none';
    });

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'range-cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
      background: transparent;
      color: #374151;
      border: none;
      padding: 8px 16px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `;
    cancelBtn.addEventListener('mouseenter', () => {
      cancelBtn.style.color = '#111827';
    });
    cancelBtn.addEventListener('mouseleave', () => {
      cancelBtn.style.color = '#374151';
    });

    // Apply button
    const applyBtn = document.createElement('button');
    applyBtn.id = 'range-apply-btn';
    applyBtn.textContent = 'Apply';
    applyBtn.style.cssText = `
      background: #4f7df3;
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
    `;
    applyBtn.addEventListener('mouseenter', () => {
      applyBtn.style.background = '#3b6ce7';
    });
    applyBtn.addEventListener('mouseleave', () => {
      applyBtn.style.background = '#4f7df3';
    });

    actionsContainer.appendChild(clearBtn);
    actionsContainer.appendChild(cancelBtn);
    actionsContainer.appendChild(applyBtn);

    header.appendChild(dateRangePill);
    header.appendChild(actionsContainer);
    this.calendarWrapper.appendChild(header);

    // Create calendars container
    const calendarsContainer = document.createElement('div');
    calendarsContainer.style.cssText = `
      display: flex;
      gap: 32px;
    `;

    // Create start date calendar section
    const startSection = document.createElement('div');
    startSection.style.cssText = `
      flex: 1;
    `;
    const startLabel = document.createElement('div');
    startLabel.textContent = 'From';
    startLabel.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 12px;
    `;
    startSection.appendChild(startLabel);

    this.startCalendarDiv = document.createElement('div');
    this.startCalendarDiv.className = 'start-calendar zg-custom-calendar';
    startSection.appendChild(this.startCalendarDiv);
    calendarsContainer.appendChild(startSection);

    // Create end date calendar section
    const endSection = document.createElement('div');
    endSection.style.cssText = `
      flex: 1;
    `;
    const endLabel = document.createElement('div');
    endLabel.textContent = 'To';
    endLabel.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 12px;
    `;
    endSection.appendChild(endLabel);

    this.endCalendarDiv = document.createElement('div');
    this.endCalendarDiv.className = 'end-calendar zg-custom-calendar';
    endSection.appendChild(this.endCalendarDiv);
    calendarsContainer.appendChild(endSection);

    this.calendarWrapper.appendChild(calendarsContainer);

    // Append calendar to document.body (not to wrapper) so it doesn't scroll with the cell
    document.body.appendChild(this.calendarWrapper);

    // Register popup with editor manager to prevent click-outside close
    if (params.registerPopup) {
      params.registerPopup(this.calendarWrapper);
    }

    container.appendChild(wrapper);

    // Setup button handlers
    this.setupButtonHandlers();

    // Initialize Calendars (async)
    this.initializeCalendars().then(() => {
      // Position calendar after a slight delay to ensure input is rendered
      requestAnimationFrame(() => {
        this.positionCalendar();

        // Show calendar
        if (this.calendarWrapper) {
          this.calendarWrapper.style.display = 'block';
        }

        // Update date pill with initial values
        this.updateDatePill();

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
  private createInputElement(value: DateRange): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.readOnly = true;
    input.className = this.options.className;
    input.placeholder = this.options.placeholder;

    // Set initial value
    if (value.start && value.end) {
      input.value = this.formatRangeForDisplay(value);
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
   * Initialize both calendars
   */
  private async initializeCalendars(): Promise<void> {
    if (!this.startCalendarDiv || !this.endCalendarDiv) return;

    // Dynamic import for ESM compatibility (v3.x uses named export)
    const { Calendar } = await import('vanilla-calendar-pro');

    const minDate = this.parseDate(this.options.minDate);
    const maxDate = this.parseDate(this.options.maxDate);

    // Determine initial view date for start calendar
    const startViewDate = this.currentValue.start || new Date();

    // For end calendar, show the next month after start calendar
    // This ensures the two panels always show consecutive months (e.g., Jan and Feb)
    const startMonth = startViewDate.getMonth();
    const startYear = startViewDate.getFullYear();
    const endViewDate = new Date(startYear, startMonth + 1, 1); // Next month

    // Start calendar - v3 flat API
    const startOptions: any = {
      type: 'default',
      dateMin: minDate ? this.formatDateForCalendar(minDate) : '1900-01-01',
      dateMax: maxDate ? this.formatDateForCalendar(maxDate) : '2099-12-31',
      selectedDates: this.currentValue.start
        ? [this.formatDateForCalendar(this.currentValue.start)]
        : [],
      // Set initial view month/year (0-indexed month)
      selectedMonth: startViewDate.getMonth(),
      selectedYear: startViewDate.getFullYear(),
      // Disable weekend highlighting for consistent cross-browser appearance
      selectedWeekends: [],
      onClickDate: (self: any) => {
        const selectedDates = self.context.selectedDates;
        if (selectedDates && selectedDates.length > 0) {
          const selectedDate = new Date(selectedDates[0]);
          this.currentValue.start = selectedDate;

          // If end date exists and is before start, clear it
          if (this.currentValue.end && this.currentValue.end < selectedDate) {
            this.currentValue.end = null;
          }

          this.updateInputDisplay();
          this.updateDatePill();
          // Update end calendar min date without destroying
          this.updateEndCalendarMinDate();
        }
      },
    };

    // End calendar - v3 flat API
    const endMinDate = this.currentValue.start
      ? this.formatDateForCalendar(this.currentValue.start)
      : (minDate ? this.formatDateForCalendar(minDate) : '1900-01-01');

    const endOptions: any = {
      type: 'default',
      dateMin: endMinDate,
      dateMax: maxDate ? this.formatDateForCalendar(maxDate) : '2099-12-31',
      selectedDates: this.currentValue.end
        ? [this.formatDateForCalendar(this.currentValue.end)]
        : [],
      // Set initial view month/year (0-indexed month)
      selectedMonth: endViewDate.getMonth(),
      selectedYear: endViewDate.getFullYear(),
      // Disable weekend highlighting for consistent cross-browser appearance
      selectedWeekends: [],
      onClickDate: (self: any) => {
        const selectedDates = self.context.selectedDates;
        if (selectedDates && selectedDates.length > 0) {
          const selectedDate = new Date(selectedDates[0]);
          this.currentValue.end = selectedDate;

          this.updateInputDisplay();
          this.updateDatePill();
          // No need to reinitialize - just update displays
        }
      },
    };

    this.startCalendar = new Calendar(this.startCalendarDiv, startOptions);
    this.startCalendar.init();

    this.endCalendar = new Calendar(this.endCalendarDiv, endOptions);
    this.endCalendar.init();
  }

  /**
   * Update end calendar's minimum date after start date selection
   * Uses vanilla-calendar-pro v3's update() method to avoid destroy/recreate issues
   */
  private updateEndCalendarMinDate(): void {
    if (!this.endCalendar) return;

    // Update the minimum date for end calendar
    if (this.currentValue.start) {
      const newMinDate = this.formatDateForCalendar(this.currentValue.start);
      this.endCalendar.set({ dateMin: newMinDate });

      // Clear end calendar's selected dates if end date was cleared
      if (!this.currentValue.end) {
        this.endCalendar.set({ selectedDates: [] });
      }

      this.endCalendar.update();
    }
  }

  /**
   * Reinitialize calendars (used for Clear button to reset both calendars)
   */
  private reinitializeCalendars(): void {
    // For clear, just use update() to reset both calendars
    const minDate = this.parseDate(this.options.minDate);

    if (this.startCalendar) {
      this.startCalendar.set({ selectedDates: [] });
      this.startCalendar.update();
    }

    if (this.endCalendar) {
      this.endCalendar.set({
        dateMin: minDate ? this.formatDateForCalendar(minDate) : '1900-01-01',
        selectedDates: []
      });
      this.endCalendar.update();
    }
  }

  /**
   * Update input display
   */
  private updateInputDisplay(): void {
    if (!this.inputElement) return;

    if (this.currentValue.start && this.currentValue.end) {
      this.inputElement.value = this.formatRangeForDisplay(this.currentValue);
    } else if (this.currentValue.start) {
      this.inputElement.value = `${this.formatDateForDisplay(this.currentValue.start)} - ...`;
    } else {
      this.inputElement.value = '';
    }
  }

  /**
   * Setup button event handlers
   */
  private setupButtonHandlers(): void {
    if (!this.calendarWrapper) return;

    // Clear button
    const clearBtn = this.calendarWrapper.querySelector('#range-clear-btn') as HTMLButtonElement;
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.currentValue = { start: null, end: null };
        this.updateInputDisplay();
        this.updateDatePill();
        this.reinitializeCalendars();
      });
    }

    // Cancel button
    const cancelBtn = this.calendarWrapper.querySelector('#range-cancel-btn') as HTMLButtonElement;
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        if (this.params?.onComplete) {
          this.params.onComplete(this.initialValue, true);
        }
      });
    }

    // Apply button
    const applyBtn = this.calendarWrapper.querySelector('#range-apply-btn') as HTMLButtonElement;
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        if (this.params?.onComplete) {
          this.params.onComplete(this.currentValue, false);
        }
      });
    }
  }

  /**
   * Update the date pill display in header
   */
  private updateDatePill(): void {
    const startDateEl = this.calendarWrapper?.querySelector('#pill-start-date');
    const endDateEl = this.calendarWrapper?.querySelector('#pill-end-date');

    if (startDateEl) {
      if (this.currentValue.start) {
        startDateEl.textContent = this.formatDateLong(this.currentValue.start);
      } else {
        startDateEl.textContent = 'Select start date';
      }
    }

    if (endDateEl) {
      if (this.currentValue.end) {
        endDateEl.textContent = this.formatDateLong(this.currentValue.end);
      } else {
        endDateEl.textContent = 'Select end date';
      }
    }
  }

  /**
   * Format date in long format (e.g., "10 February 2023")
   */
  private formatDateLong(date: Date): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
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
    // Date range picker is wider due to two calendars side by side
    const calendarRect = this.calendarWrapper.getBoundingClientRect();
    const calendarWidth = calendarRect.width > 0 ? calendarRect.width : 560;
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

    return true;
  }

  /**
   * Get the current value
   */
  getValue(): DateRange {
    return this.currentValue;
  }

  /**
   * Check if current value is valid
   */
  isValid(): boolean | ValidationResult {
    const value = this.currentValue;

    // Required validation
    if (this.options.required && (!value.start || !value.end)) {
      return {
        valid: false,
        message: 'Both start and end dates are required',
      };
    }

    // Skip other validations if both dates are null and not required
    if (!value.start && !value.end && !this.options.required) {
      return true;
    }

    // Partial selection validation
    if ((value.start && !value.end) || (!value.start && value.end)) {
      return {
        valid: false,
        message: 'Please select both start and end dates',
      };
    }

    // Check if both are valid dates
    if (value.start && (!(value.start instanceof Date) || isNaN(value.start.getTime()))) {
      return {
        valid: false,
        message: 'Invalid start date',
      };
    }

    if (value.end && (!(value.end instanceof Date) || isNaN(value.end.getTime()))) {
      return {
        valid: false,
        message: 'Invalid end date',
      };
    }

    // End date >= start date validation
    if (value.start && value.end) {
      if (value.end < value.start) {
        return {
          valid: false,
          message: 'End date must be after or equal to start date',
        };
      }

      if (!this.options.allowSameDate && value.end.getTime() === value.start.getTime()) {
        return {
          valid: false,
          message: 'End date must be different from start date',
        };
      }
    }

    // Min/Max date validation
    const minDate = this.parseDate(this.options.minDate);
    const maxDate = this.parseDate(this.options.maxDate);

    if (minDate && value.start && value.start < minDate) {
      return {
        valid: false,
        message: `Start date must be after ${this.formatDateForDisplay(minDate)}`,
      };
    }

    if (maxDate && value.end && value.end > maxDate) {
      return {
        valid: false,
        message: `End date must be before ${this.formatDateForDisplay(maxDate)}`,
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
    if (this.startCalendar) {
      this.startCalendar.destroy();
      this.startCalendar = null;
    }

    if (this.endCalendar) {
      this.endCalendar.destroy();
      this.endCalendar = null;
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

    this.startCalendarDiv = null;
    this.endCalendarDiv = null;
    this.params = null;
  }

  /**
   * Parse value into a DateRange object
   */
  private parseRange(value: any): DateRange {
    if (!value) {
      return { start: null, end: null };
    }

    if (typeof value === 'object' && 'start' in value && 'end' in value) {
      return {
        start: this.parseDate(value.start),
        end: this.parseDate(value.end),
      };
    }

    return { start: null, end: null };
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
   * Format date for display in input
   */
  private formatDateForDisplay(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const format = this.options.format;
    return format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', String(year));
  }

  /**
   * Format date range for display
   */
  private formatRangeForDisplay(range: DateRange): string {
    if (!range.start || !range.end) return '';
    return `${this.formatDateForDisplay(range.start)} - ${this.formatDateForDisplay(range.end)}`;
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
 * Factory function to create DateRangeEditor
 */
export function createDateRangeEditor(
  options: DateRangeEditorOptions = {}
): DateRangeEditor {
  return new DateRangeEditor(options);
}
