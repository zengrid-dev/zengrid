/**
 * DateRangeEditor - Date range picker with dual calendars
 *
 * Uses the new datetime-core infrastructure for:
 * - Reliable click-outside detection
 * - Unified scroll handling
 * - CSS variable theming
 * - Keyboard navigation
 */

import type { CellEditor, EditorParams, ValidationResult } from '../../cell-editor.interface';
import type { DateRange, DateRangeEditorOptions, ResolvedDateRangeEditorOptions } from './types';
import {
  PopupManager,
  parseDate,
  formatDateForCalendar,
  formatDateRange,
  isDateInRange,
  setupDatetimeKeyboard,
  ThemeManager,
} from '../../../datetime-core';

/**
 * DateRangeEditor - Date range picker with dual calendars
 *
 * @example
 * ```typescript
 * const editor = new DateRangeEditor({
 *   format: 'DD/MM/YYYY',
 *   required: true,
 *   allowSameDate: false,
 *   theme: 'dark',
 * });
 * ```
 */
export class DateRangeEditor implements CellEditor<DateRange> {
  private options: ResolvedDateRangeEditorOptions;
  private container: HTMLElement | null = null;
  private inputElement: HTMLInputElement | null = null;
  private popup: HTMLDivElement | null = null;
  private startCalendarDiv: HTMLDivElement | null = null;
  private endCalendarDiv: HTMLDivElement | null = null;
  private startCalendar: any = null;
  private endCalendar: any = null;
  private params: EditorParams | null = null;
  private initialValue: DateRange = { start: null, end: null };
  private currentValue: DateRange = { start: null, end: null };
  private isDestroyed: boolean = false;
  private cleanup: (() => void) | null = null;
  private popupManager: PopupManager;

  constructor(options: DateRangeEditorOptions = {}) {
    this.options = this.resolveOptions(options);
    this.popupManager = PopupManager.getInstance();

    // Apply theme
    if (this.options.theme !== 'auto') {
      ThemeManager.getInstance().setTheme(this.options.theme);
    }
  }

  private resolveOptions(options: DateRangeEditorOptions): ResolvedDateRangeEditorOptions {
    return {
      format: options.format ?? 'DD/MM/YYYY',
      minDate: options.minDate ? parseDate(options.minDate) : null,
      maxDate: options.maxDate ? parseDate(options.maxDate) : null,
      required: options.required ?? false,
      placeholder: options.placeholder ?? 'Select date range...',
      className: options.className ?? 'zg-date-range-editor',
      theme: options.theme ?? 'light',
      autoFocus: options.autoFocus ?? true,
      commitOnBlur: options.commitOnBlur ?? true,
      allowSameDate: options.allowSameDate ?? true,
      closeOnScroll: options.closeOnScroll ?? true,
      separator: options.separator ?? ' - ',
      validator: options.validator,
    };
  }

  private parseRange(value: any): DateRange {
    if (!value || typeof value !== 'object') {
      return { start: null, end: null };
    }

    return {
      start: parseDate(value.start),
      end: parseDate(value.end),
    };
  }

  init(container: HTMLElement, value: DateRange | null, params: EditorParams): void {
    this.isDestroyed = false;
    this.params = params;
    this.container = container;
    this.initialValue = this.parseRange(value);
    this.currentValue = { ...this.initialValue };

    container.innerHTML = '';

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = `${this.options.className}-wrapper zg-datetime-container`;
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    // Create input element
    this.inputElement = this.createInputElement();
    wrapper.appendChild(this.inputElement);

    container.appendChild(wrapper);

    // Create popup
    this.popup = this.createPopup();
    document.body.appendChild(this.popup);

    // Register popup with editor manager if available
    if (params.registerPopup) {
      params.registerPopup(this.popup);
    }

    // Initialize calendars
    this.initializeCalendars().then(() => {
      // Use requestAnimationFrame to ensure DOM layout is complete
      // This fixes popup positioning when the input element hasn't been laid out yet
      requestAnimationFrame(() => {
        if (!this.isDestroyed) {
          this.showPopup();
        }
      });
    });

    // Setup event handlers
    this.setupEventHandlers();

    // Auto-focus
    if (this.options.autoFocus) {
      requestAnimationFrame(() => this.focus());
    }
  }

  private createInputElement(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = `${this.options.className}-input zg-datetime-input`;
    input.placeholder = this.options.placeholder;
    input.readOnly = true;

    // Set initial display
    input.value = formatDateRange(
      this.currentValue.start,
      this.currentValue.end,
      this.options.format,
      this.options.separator
    );

    // ARIA attributes
    input.setAttribute('aria-label', 'Date range input');
    if (this.options.required) {
      input.setAttribute('aria-required', 'true');
    }

    return input;
  }

  private createPopup(): HTMLDivElement {
    const popup = document.createElement('div');
    popup.className = 'zg-datetime-popup zg-date-range-editor-popup';
    popup.style.display = 'none';
    popup.style.zIndex = '9999';

    // Create header with buttons
    const header = this.createHeader();
    popup.appendChild(header);

    // Create calendars container
    const calendarsContainer = document.createElement('div');
    calendarsContainer.className = 'zg-date-range-calendars';
    calendarsContainer.style.cssText = 'display: flex; gap: 16px;';

    // Start calendar
    const startSection = document.createElement('div');
    startSection.className = 'zg-date-range-start';
    const startLabel = document.createElement('div');
    startLabel.className = 'zg-date-range-label';
    startLabel.textContent = 'Start Date';
    this.startCalendarDiv = document.createElement('div');
    this.startCalendarDiv.className = 'zg-datetime-calendar-wrapper';
    startSection.appendChild(startLabel);
    startSection.appendChild(this.startCalendarDiv);

    // End calendar
    const endSection = document.createElement('div');
    endSection.className = 'zg-date-range-end';
    const endLabel = document.createElement('div');
    endLabel.className = 'zg-date-range-label';
    endLabel.textContent = 'End Date';
    this.endCalendarDiv = document.createElement('div');
    this.endCalendarDiv.className = 'zg-datetime-calendar-wrapper';
    endSection.appendChild(endLabel);
    endSection.appendChild(this.endCalendarDiv);

    calendarsContainer.appendChild(startSection);
    calendarsContainer.appendChild(endSection);
    popup.appendChild(calendarsContainer);

    return popup;
  }

  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'zg-date-range-header';
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--zg-datetime-border-color);';

    // Selected range display
    const rangeDisplay = document.createElement('div');
    rangeDisplay.className = 'zg-date-range-display';
    rangeDisplay.textContent = this.getDisplayText();
    header.appendChild(rangeDisplay);

    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'zg-date-range-buttons';
    buttonContainer.style.cssText = 'display: flex; gap: 8px;';

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'zg-date-range-btn zg-date-range-btn-clear';
    clearBtn.textContent = 'Clear';
    clearBtn.onclick = () => this.handleClear();

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'zg-date-range-btn zg-date-range-btn-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => this.handleCancel();

    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'zg-date-range-btn zg-date-range-btn-apply';
    applyBtn.textContent = 'Apply';
    applyBtn.onclick = () => this.handleApply();

    buttonContainer.appendChild(clearBtn);
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(applyBtn);
    header.appendChild(buttonContainer);

    return header;
  }

  private getDisplayText(): string {
    const { start, end } = this.currentValue;
    if (!start && !end) {
      return this.options.placeholder;
    }
    return formatDateRange(start, end, this.options.format, this.options.separator);
  }

  private async initializeCalendars(): Promise<void> {
    if (!this.startCalendarDiv || !this.endCalendarDiv) return;

    const { minDate, maxDate, theme } = this.options;
    const baseOptions = {
      type: 'default',
      enableJumpToSelectedDate: true,
      settings: {
        visibility: {
          theme: theme === 'auto' ? 'system' : theme,
        },
        selection: {
          day: 'single',
        },
        range: {
          min: minDate ? formatDateForCalendar(minDate) : '1900-01-01',
          max: maxDate ? formatDateForCalendar(maxDate) : '2099-12-31',
        },
      },
    };

    try {
      const { Calendar } = await import('vanilla-calendar-pro');

      // Start calendar
      const startOptions: any = {
        ...baseOptions,
        settings: {
          ...baseOptions.settings,
          selected: this.currentValue.start
            ? {
                dates: [formatDateForCalendar(this.currentValue.start)],
                month: this.currentValue.start.getMonth(),
                year: this.currentValue.start.getFullYear(),
              }
            : {},
        },
        actions: {
          clickDay: (_e: any, self: any) => {
            if (self.selectedDates && self.selectedDates.length > 0) {
              const selectedDate = new Date(self.selectedDates[0]);
              if (!isNaN(selectedDate.getTime())) {
                this.handleStartDateSelect(selectedDate);
              }
            }
          },
        },
      };
      this.startCalendar = new Calendar(this.startCalendarDiv, startOptions);
      this.startCalendar.init();

      // End calendar
      const endOptions: any = {
        ...baseOptions,
        settings: {
          ...baseOptions.settings,
          selected: this.currentValue.end
            ? {
                dates: [formatDateForCalendar(this.currentValue.end)],
                month: this.currentValue.end.getMonth(),
                year: this.currentValue.end.getFullYear(),
              }
            : {},
          range: {
            ...baseOptions.settings.range,
            // End date can't be before start date
            min: this.currentValue.start
              ? formatDateForCalendar(this.currentValue.start)
              : baseOptions.settings.range.min,
          },
        },
        actions: {
          clickDay: (_e: any, self: any) => {
            if (self.selectedDates && self.selectedDates.length > 0) {
              const selectedDate = new Date(self.selectedDates[0]);
              if (!isNaN(selectedDate.getTime())) {
                this.handleEndDateSelect(selectedDate);
              }
            }
          },
        },
      };
      this.endCalendar = new Calendar(this.endCalendarDiv, endOptions);
      this.endCalendar.init();
    } catch (error) {
      console.error('DateRangeEditor: Failed to load vanilla-calendar-pro:', error);
    }
  }

  private setupEventHandlers(): void {
    if (!this.inputElement) return;

    const cleanupFns: (() => void)[] = [];

    // Click to show popup
    const handleClick = () => {
      if (!this.popupManager.isOpen(this.popup!)) {
        this.showPopup();
      }
    };
    this.inputElement.addEventListener('click', handleClick);
    cleanupFns.push(() => this.inputElement?.removeEventListener('click', handleClick));

    // Keyboard navigation
    const cleanupKeyboard = setupDatetimeKeyboard(this.container!, {
      onEscape: () => this.handleCancel(),
      onEnter: () => this.handleApply(),
    });
    cleanupFns.push(cleanupKeyboard);

    this.cleanup = () => {
      cleanupFns.forEach(fn => fn());
    };
  }

  private showPopup(): void {
    if (!this.popup || !this.inputElement) return;

    // Build scroll options with grid's scroll container if available
    const scrollOptions: any = {
      closeOnOutOfView: this.options.closeOnScroll,
    };
    if (this.params?.scrollContainer) {
      scrollOptions.additionalScrollContainers = [this.params.scrollContainer];
    }

    this.popupManager.open({
      popup: this.popup,
      anchor: this.inputElement,
      onClose: () => {
        // Popup closed
      },
      additionalElements: [this.startCalendarDiv!, this.endCalendarDiv!].filter(Boolean),
      positionOptions: {
        placement: 'bottom-start',
        offset: 4,
      },
      scrollOptions,
    });
  }

  private hidePopup(): void {
    if (this.popup) {
      this.popupManager.close(this.popup);
    }
  }

  private handleStartDateSelect(date: Date): void {
    if (this.isDestroyed) return;

    // Validate range
    if (!isDateInRange(date, this.options.minDate, this.options.maxDate)) {
      return;
    }

    this.currentValue.start = date;

    // If end date is before start date, clear it
    if (this.currentValue.end && this.currentValue.end < date) {
      this.currentValue.end = null;
      this.updateEndCalendar();
    }

    // Update end calendar min date
    if (this.endCalendar) {
      this.endCalendar.settings.range.min = formatDateForCalendar(date);
      this.endCalendar.update();
    }

    this.updateDisplay();
  }

  private handleEndDateSelect(date: Date): void {
    if (this.isDestroyed) return;

    // Validate range
    if (!isDateInRange(date, this.options.minDate, this.options.maxDate)) {
      return;
    }

    // Check same date
    if (this.currentValue.start && !this.options.allowSameDate) {
      if (date.getTime() === this.currentValue.start.getTime()) {
        return;
      }
    }

    // Check end >= start
    if (this.currentValue.start && date < this.currentValue.start) {
      return;
    }

    this.currentValue.end = date;
    this.updateDisplay();
  }

  private updateEndCalendar(): void {
    if (!this.endCalendar) return;

    if (this.currentValue.end) {
      this.endCalendar.settings.selected.dates = [formatDateForCalendar(this.currentValue.end)];
    } else {
      this.endCalendar.settings.selected.dates = [];
    }
    this.endCalendar.update();
  }

  private updateDisplay(): void {
    // Update input
    if (this.inputElement) {
      this.inputElement.value = formatDateRange(
        this.currentValue.start,
        this.currentValue.end,
        this.options.format,
        this.options.separator
      );
    }

    // Update header display
    const display = this.popup?.querySelector('.zg-date-range-display');
    if (display) {
      display.textContent = this.getDisplayText();
    }

    // Notify change
    this.params?.onChange?.(this.currentValue);
  }

  private handleClear(): void {
    this.currentValue = { start: null, end: null };

    // Clear calendars
    if (this.startCalendar) {
      this.startCalendar.settings.selected.dates = [];
      this.startCalendar.update();
    }
    if (this.endCalendar) {
      this.endCalendar.settings.selected.dates = [];
      this.endCalendar.settings.range.min = this.options.minDate
        ? formatDateForCalendar(this.options.minDate)
        : '1900-01-01';
      this.endCalendar.update();
    }

    this.updateDisplay();
  }

  private handleCancel(): void {
    if (this.isDestroyed || !this.params) return;

    this.hidePopup();
    this.params.onComplete?.(this.initialValue, true);
  }

  private handleApply(): void {
    if (this.isDestroyed || !this.params) return;

    const validationResult = this.isValid();
    if (validationResult === true || (typeof validationResult === 'object' && validationResult.valid)) {
      this.hidePopup();
      this.params.onComplete?.(this.currentValue, false);
    }
  }

  onKeyDown(event: KeyboardEvent): boolean {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.handleCancel();
      return true;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      this.handleApply();
      return true;
    }

    return true;
  }

  getValue(): DateRange {
    return this.currentValue;
  }

  isValid(): boolean | ValidationResult {
    const { start, end } = this.currentValue;

    // Required check
    if (this.options.required && (!start || !end)) {
      return { valid: false, message: 'Date range is required' };
    }

    // Start before end check
    if (start && end && start > end) {
      return { valid: false, message: 'Start date must be before end date' };
    }

    // Same date check
    if (!this.options.allowSameDate && start && end) {
      if (start.getTime() === end.getTime()) {
        return { valid: false, message: 'Start and end dates cannot be the same' };
      }
    }

    // Range check
    if (start && !isDateInRange(start, this.options.minDate, this.options.maxDate)) {
      return { valid: false, message: 'Start date is outside allowed range' };
    }
    if (end && !isDateInRange(end, this.options.minDate, this.options.maxDate)) {
      return { valid: false, message: 'End date is outside allowed range' };
    }

    // Custom validator
    if (this.options.validator) {
      const result = this.options.validator(this.currentValue);
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

  focus(): void {
    this.inputElement?.focus();
  }

  destroy(): void {
    this.isDestroyed = true;

    // Clean up event handlers
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }

    // Close and unregister popup
    if (this.popup) {
      this.hidePopup();
      if (this.params?.unregisterPopup) {
        this.params.unregisterPopup(this.popup);
      }
    }

    // Destroy calendars
    if (this.startCalendar && typeof this.startCalendar.destroy === 'function') {
      try {
        this.startCalendar.destroy();
      } catch (error) {
        // Ignore errors during cleanup
      }
      this.startCalendar = null;
    }
    if (this.endCalendar && typeof this.endCalendar.destroy === 'function') {
      try {
        this.endCalendar.destroy();
      } catch (error) {
        // Ignore errors during cleanup
      }
      this.endCalendar = null;
    }

    // Remove popup from DOM
    this.popup?.remove();

    // Remove input
    this.inputElement?.remove();

    // Clear references
    this.container = null;
    this.inputElement = null;
    this.popup = null;
    this.startCalendarDiv = null;
    this.endCalendarDiv = null;
    this.params = null;
    this.initialValue = { start: null, end: null };
    this.currentValue = { start: null, end: null };
  }
}

/**
 * Factory function to create DateRangeEditor
 */
export function createDateRangeEditor(options: DateRangeEditorOptions = {}): DateRangeEditor {
  return new DateRangeEditor(options);
}
