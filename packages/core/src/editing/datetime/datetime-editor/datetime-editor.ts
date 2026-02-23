/**
 * DateTimeEditor - Combined date and time editing
 *
 * Features:
 * - Calendar popup for date selection
 * - Time inputs for time selection
 * - 12h/24h format support
 * - Optional seconds
 */

import type { CellEditor, EditorParams, ValidationResult } from '../../cell-editor.interface';
import type { DateTimeEditorOptions, ResolvedDateTimeEditorOptions } from './types';
import {
  PopupManager,
  parseDate,
  formatDateForDisplay,
  formatDateForCalendar,
  formatTime,
  isDateInRange,
  setupDatetimeKeyboard,
  ThemeManager,
} from '../../../datetime-core';

/**
 * Format datetime for display
 */
function formatDateTime(date: Date | null, dateFormat: string, timeFormat: '12h' | '24h'): string {
  if (!date) return '';
  return `${formatDateForDisplay(date, dateFormat)} ${formatTime(date, timeFormat === '24h')}`;
}

/**
 * DateTimeEditor - Combined date and time editing
 */
export class DateTimeEditor implements CellEditor<Date | null> {
  private options: ResolvedDateTimeEditorOptions;
  private container: HTMLElement | null = null;
  private inputElement: HTMLInputElement | null = null;
  private popup: HTMLDivElement | null = null;
  private calendarWrapper: HTMLDivElement | null = null;
  private calendar: any = null;
  private params: EditorParams | null = null;
  private initialValue: Date | null = null;
  private currentValue: Date | null = null;
  private isDestroyed: boolean = false;
  private cleanup: (() => void) | null = null;
  private popupManager: PopupManager;

  constructor(options: DateTimeEditorOptions = {}) {
    this.options = {
      dateFormat: options.dateFormat ?? 'DD/MM/YYYY',
      timeFormat: options.timeFormat ?? '24h',
      showSeconds: options.showSeconds ?? false,
      placeholder: options.placeholder ?? 'Select date & time...',
      className: options.className ?? 'zg-datetime-editor',
      theme: options.theme ?? 'light',
      autoFocus: options.autoFocus ?? true,
      required: options.required ?? false,
      minDate: options.minDate ? parseDate(options.minDate) : null,
      maxDate: options.maxDate ? parseDate(options.maxDate) : null,
      commitOnBlur: options.commitOnBlur ?? true,
      closeOnScroll: options.closeOnScroll ?? true,
      validator: options.validator,
    };
    this.popupManager = PopupManager.getInstance();

    if (this.options.theme !== 'auto') {
      ThemeManager.getInstance().setTheme(this.options.theme);
    }
  }

  init(container: HTMLElement, value: Date | null, params: EditorParams): void {
    this.isDestroyed = false;
    this.params = params;
    this.container = container;
    this.initialValue = parseDate(value);
    this.currentValue = this.initialValue ? new Date(this.initialValue) : null;

    container.innerHTML = '';

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = `${this.options.className}-wrapper zg-datetime-container`;
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    // Create input
    this.inputElement = document.createElement('input');
    this.inputElement.type = 'text';
    this.inputElement.className = `${this.options.className}-input zg-datetime-input`;
    this.inputElement.placeholder = this.options.placeholder;
    this.inputElement.readOnly = true;
    if (this.currentValue) {
      this.inputElement.value = formatDateTime(
        this.currentValue,
        this.options.dateFormat,
        this.options.timeFormat
      );
    }
    wrapper.appendChild(this.inputElement);

    container.appendChild(wrapper);

    // Create popup
    this.popup = this.createPopup();
    document.body.appendChild(this.popup);

    if (params.registerPopup) {
      params.registerPopup(this.popup);
    }

    // Initialize calendar and show popup
    this.initializeCalendar().then(() => {
      // Use requestAnimationFrame to ensure DOM layout is complete
      // This fixes popup positioning when the input element hasn't been laid out yet
      requestAnimationFrame(() => {
        if (!this.isDestroyed) {
          this.showPopup();
        }
      });
    });

    // Setup events
    this.setupEventHandlers();

    if (this.options.autoFocus) {
      requestAnimationFrame(() => this.focus());
    }
  }

  private createPopup(): HTMLDivElement {
    const popup = document.createElement('div');
    popup.className = 'zg-datetime-popup zg-datetime-editor-popup';
    popup.style.display = 'none';
    popup.style.zIndex = '9999';

    // Calendar
    this.calendarWrapper = document.createElement('div');
    this.calendarWrapper.className = 'zg-datetime-calendar-wrapper';
    popup.appendChild(this.calendarWrapper);

    // Time section
    const timeSection = document.createElement('div');
    timeSection.className = 'zg-datetime-time-section';
    timeSection.style.cssText =
      'padding: 12px; border-top: 1px solid var(--zg-datetime-border-color);';

    const timeLabel = document.createElement('div');
    timeLabel.textContent = 'Time';
    timeLabel.style.cssText = 'margin-bottom: 8px; font-weight: 500;';
    timeSection.appendChild(timeLabel);

    const timeContainer = document.createElement('div');
    timeContainer.className = 'zg-datetime-time-container';

    // Hours
    const hoursInput = document.createElement('input');
    hoursInput.type = 'number';
    hoursInput.className = 'zg-datetime-time-input';
    hoursInput.dataset.type = 'hours';
    hoursInput.min = this.options.timeFormat === '12h' ? '1' : '0';
    hoursInput.max = this.options.timeFormat === '12h' ? '12' : '23';
    hoursInput.placeholder = 'HH';
    if (this.currentValue) {
      const hours =
        this.options.timeFormat === '12h'
          ? this.currentValue.getHours() % 12 || 12
          : this.currentValue.getHours();
      hoursInput.value = String(hours).padStart(2, '0');
    }
    timeContainer.appendChild(hoursInput);

    timeContainer.appendChild(this.createSeparator(':'));

    // Minutes
    const minutesInput = document.createElement('input');
    minutesInput.type = 'number';
    minutesInput.className = 'zg-datetime-time-input';
    minutesInput.dataset.type = 'minutes';
    minutesInput.min = '0';
    minutesInput.max = '59';
    minutesInput.placeholder = 'MM';
    if (this.currentValue) {
      minutesInput.value = String(this.currentValue.getMinutes()).padStart(2, '0');
    }
    timeContainer.appendChild(minutesInput);

    // Seconds
    if (this.options.showSeconds) {
      timeContainer.appendChild(this.createSeparator(':'));

      const secondsInput = document.createElement('input');
      secondsInput.type = 'number';
      secondsInput.className = 'zg-datetime-time-input';
      secondsInput.dataset.type = 'seconds';
      secondsInput.min = '0';
      secondsInput.max = '59';
      secondsInput.placeholder = 'SS';
      if (this.currentValue) {
        secondsInput.value = String(this.currentValue.getSeconds()).padStart(2, '0');
      }
      timeContainer.appendChild(secondsInput);
    }

    // AM/PM
    if (this.options.timeFormat === '12h') {
      const ampmSelect = document.createElement('select');
      ampmSelect.className = 'zg-datetime-time-ampm';
      ampmSelect.dataset.type = 'ampm';
      ['AM', 'PM'].forEach((v) => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v;
        ampmSelect.appendChild(opt);
      });
      if (this.currentValue && this.currentValue.getHours() >= 12) {
        ampmSelect.value = 'PM';
      }
      timeContainer.appendChild(ampmSelect);
    }

    timeSection.appendChild(timeContainer);
    popup.appendChild(timeSection);

    // Buttons
    const buttonSection = document.createElement('div');
    buttonSection.style.cssText =
      'display: flex; justify-content: flex-end; gap: 8px; padding: 12px; border-top: 1px solid var(--zg-datetime-border-color);';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'zg-datetime-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => this.cancel();

    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'zg-datetime-btn zg-datetime-btn-primary';
    applyBtn.textContent = 'Apply';
    applyBtn.style.cssText =
      'background: var(--zg-datetime-primary-color); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;';
    applyBtn.onclick = () => this.commit();

    buttonSection.appendChild(cancelBtn);
    buttonSection.appendChild(applyBtn);
    popup.appendChild(buttonSection);

    return popup;
  }

  private createSeparator(text: string): HTMLElement {
    const sep = document.createElement('span');
    sep.className = 'zg-datetime-time-separator';
    sep.textContent = text;
    return sep;
  }

  private async initializeCalendar(): Promise<void> {
    if (!this.calendarWrapper) return;

    const { minDate, maxDate, theme } = this.options;

    const calendarOptions: any = {
      type: 'default',
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
      actions: {
        clickDay: (_e: any, self: any) => {
          if (self.selectedDates && self.selectedDates.length > 0) {
            const selectedDate = new Date(self.selectedDates[0]);
            if (!isNaN(selectedDate.getTime())) {
              this.handleDateSelect(selectedDate);
            }
          }
        },
      },
    };

    if (this.currentValue) {
      calendarOptions.settings.selected = {
        dates: [formatDateForCalendar(this.currentValue)],
      };
    }

    try {
      const { Calendar } = await import('vanilla-calendar-pro');
      this.calendar = new Calendar(this.calendarWrapper, calendarOptions);
      this.calendar.init();
    } catch (error) {
      console.error('DateTimeEditor: Failed to load vanilla-calendar-pro:', error);
    }
  }

  private handleDateSelect(date: Date): void {
    if (this.isDestroyed) return;

    // Preserve time from current value
    if (this.currentValue) {
      date.setHours(
        this.currentValue.getHours(),
        this.currentValue.getMinutes(),
        this.currentValue.getSeconds()
      );
    }

    this.currentValue = date;
    this.updateInputDisplay();
    this.params?.onChange?.(this.currentValue);
  }

  private updateInputDisplay(): void {
    if (this.inputElement && this.currentValue) {
      this.inputElement.value = formatDateTime(
        this.currentValue,
        this.options.dateFormat,
        this.options.timeFormat
      );
    }
  }

  private setupEventHandlers(): void {
    const cleanupFns: (() => void)[] = [];

    // Input click
    if (this.inputElement) {
      const handleClick = () => {
        if (!this.popupManager.isOpen(this.popup!)) {
          this.showPopup();
        }
      };
      this.inputElement.addEventListener('click', handleClick);
      cleanupFns.push(() => this.inputElement?.removeEventListener('click', handleClick));
    }

    // Time input changes
    if (this.popup) {
      const handleTimeChange = () => this.updateValueFromTimeInputs();
      const timeInputs = this.popup.querySelectorAll(
        '.zg-datetime-time-input, .zg-datetime-time-ampm'
      );
      timeInputs.forEach((input) => {
        input.addEventListener('change', handleTimeChange);
        input.addEventListener('input', handleTimeChange);
        cleanupFns.push(() => {
          input.removeEventListener('change', handleTimeChange);
          input.removeEventListener('input', handleTimeChange);
        });
      });
    }

    // Keyboard
    const cleanupKeyboard = setupDatetimeKeyboard(this.container!, {
      onEscape: () => this.cancel(),
      onEnter: () => this.commit(),
    });
    cleanupFns.push(cleanupKeyboard);

    this.cleanup = () => cleanupFns.forEach((fn) => fn());
  }

  private updateValueFromTimeInputs(): void {
    if (!this.popup) return;

    const hoursInput = this.popup.querySelector('[data-type="hours"]') as HTMLInputElement;
    const minutesInput = this.popup.querySelector('[data-type="minutes"]') as HTMLInputElement;
    const secondsInput = this.popup.querySelector('[data-type="seconds"]') as HTMLInputElement;
    const ampmSelect = this.popup.querySelector('[data-type="ampm"]') as HTMLSelectElement;

    let hours = parseInt(hoursInput?.value || '0', 10);
    const minutes = parseInt(minutesInput?.value || '0', 10);
    const seconds = secondsInput ? parseInt(secondsInput.value || '0', 10) : 0;

    if (this.options.timeFormat === '12h' && ampmSelect) {
      if (ampmSelect.value === 'PM' && hours < 12) hours += 12;
      if (ampmSelect.value === 'AM' && hours === 12) hours = 0;
    }

    if (!this.currentValue) {
      this.currentValue = new Date();
    }

    this.currentValue.setHours(hours, minutes, seconds);
    this.updateInputDisplay();
    this.params?.onChange?.(this.currentValue);
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
      onClose: () => {},
      additionalElements: this.calendarWrapper ? [this.calendarWrapper] : undefined,
      positionOptions: { placement: 'bottom-start', offset: 4 },
      scrollOptions,
    });
  }

  private hidePopup(): void {
    if (this.popup) {
      this.popupManager.close(this.popup);
    }
  }

  private commit(): void {
    if (this.isDestroyed || !this.params) return;

    const validationResult = this.isValid();
    if (
      validationResult === true ||
      (typeof validationResult === 'object' && validationResult.valid)
    ) {
      this.hidePopup();
      this.params.onComplete?.(this.currentValue, false);
    }
  }

  private cancel(): void {
    if (this.isDestroyed || !this.params) return;

    this.hidePopup();
    this.params.onComplete?.(this.initialValue, true);
  }

  onKeyDown(event: KeyboardEvent): boolean {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.cancel();
      return true;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      this.commit();
      return true;
    }

    return true;
  }

  getValue(): Date | null {
    return this.currentValue;
  }

  isValid(): boolean | ValidationResult {
    const value = this.currentValue;

    if (this.options.required && !value) {
      return { valid: false, message: 'Date and time are required' };
    }

    if (value) {
      if (!isDateInRange(value, this.options.minDate, this.options.maxDate)) {
        return { valid: false, message: 'Date is outside allowed range' };
      }
    }

    if (this.options.validator) {
      const result = this.options.validator(value);
      if (result === true) return true;
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

    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }

    if (this.popup) {
      this.hidePopup();
      if (this.params?.unregisterPopup) {
        this.params.unregisterPopup(this.popup);
      }
    }

    if (this.calendar?.destroy) {
      try {
        this.calendar.destroy();
      } catch (e) {}
      this.calendar = null;
    }

    this.popup?.remove();
    this.inputElement?.remove();

    this.container = null;
    this.inputElement = null;
    this.popup = null;
    this.calendarWrapper = null;
    this.params = null;
    this.initialValue = null;
    this.currentValue = null;
  }
}

/**
 * Factory function
 */
export function createDateTimeEditor(options: DateTimeEditorOptions = {}): DateTimeEditor {
  return new DateTimeEditor(options);
}
