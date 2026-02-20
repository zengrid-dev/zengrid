/**
 * DateTimePickerRenderer - Combines date and time selection
 *
 * Features:
 * - Calendar for date selection
 * - Time inputs for time selection
 * - 12h/24h format support
 * - Optional seconds
 */

import type { CellRenderer, RenderParams } from '../../renderer.interface';
import type {
  DateTimePickerRendererOptions,
  ResolvedDateTimePickerOptions,
} from './types';
import {
  PopupManager,
  parseDate,
  formatDateForDisplay,
  formatDateForCalendar,
  formatTime,
  setupDatetimeKeyboard,
  ThemeManager,
} from '../../../../datetime-core';

/**
 * Calendar + Clock icon SVG
 */
const DATETIME_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
  <line x1="16" y1="2" x2="16" y2="6"></line>
  <line x1="8" y1="2" x2="8" y2="6"></line>
  <line x1="3" y1="10" x2="21" y2="10"></line>
  <circle cx="12" cy="16" r="2"></circle>
  <polyline points="12 14 12 16 13 17"></polyline>
</svg>`;

/**
 * Format datetime for display
 */
function formatDateTime(date: Date | null, dateFormat: string, timeFormat: '12h' | '24h'): string {
  if (!date) return '';

  const dateStr = formatDateForDisplay(date, dateFormat);
  const timeStr = formatTime(date, timeFormat === '24h');

  return `${dateStr} ${timeStr}`;
}

/**
 * DateTimePickerRenderer - Renders an interactive datetime picker
 */
export class DateTimePickerRenderer implements CellRenderer {
  private options: ResolvedDateTimePickerOptions;
  private instances: WeakMap<HTMLElement, {
    container: HTMLElement;
    trigger: HTMLElement;
    popup: HTMLElement;
    calendarWrapper: HTMLElement;
    calendar: any | null;
    currentValue: Date | null;
    params: RenderParams;
    isDestroyed: boolean;
    cleanup: (() => void) | null;
  }>;
  private popupManager: PopupManager;

  constructor(options: DateTimePickerRendererOptions = {}) {
    this.options = {
      dateFormat: options.dateFormat ?? 'DD/MM/YYYY',
      timeFormat: options.timeFormat ?? '24h',
      showSeconds: options.showSeconds ?? false,
      placeholder: options.placeholder ?? 'Select date & time...',
      className: options.className ?? '',
      theme: options.theme ?? 'light',
      disabled: options.disabled ?? false,
      minDate: options.minDate ? parseDate(options.minDate) : null,
      maxDate: options.maxDate ? parseDate(options.maxDate) : null,
      closeOnScroll: options.closeOnScroll ?? true,
      onChange: options.onChange,
    };
    this.instances = new WeakMap();
    this.popupManager = PopupManager.getInstance();

    if (this.options.theme !== 'auto') {
      ThemeManager.getInstance().setTheme(this.options.theme);
    }
  }

  render(element: HTMLElement, params: RenderParams): void {
    element.classList.add('zg-cell-datetime-picker');

    const initialValue = parseDate(params.value);

    // Create container
    const container = document.createElement('div');
    container.className = `zg-datetime-container zg-datetime-picker-wrapper ${this.options.className}`;

    // Create trigger
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'zg-datetime-trigger zg-datetime-picker-trigger';
    if (this.options.disabled) {
      trigger.classList.add('zg-datetime-disabled');
      trigger.disabled = true;
    }

    const textSpan = document.createElement('span');
    textSpan.className = 'zg-datetime-trigger-text';
    const displayText = initialValue
      ? formatDateTime(initialValue, this.options.dateFormat, this.options.timeFormat)
      : this.options.placeholder;
    textSpan.textContent = displayText;
    if (!initialValue) textSpan.classList.add('placeholder');
    trigger.appendChild(textSpan);

    const icon = document.createElement('span');
    icon.className = 'zg-datetime-trigger-icon';
    icon.innerHTML = DATETIME_ICON;
    trigger.appendChild(icon);

    container.appendChild(trigger);

    // Create popup
    const popup = document.createElement('div');
    popup.className = 'zg-datetime-popup zg-datetime-picker-popup';
    popup.style.display = 'none';
    popup.style.zIndex = '9999';

    // Calendar section
    const calendarWrapper = document.createElement('div');
    calendarWrapper.className = 'zg-datetime-calendar-wrapper';
    popup.appendChild(calendarWrapper);

    // Time section
    const timeSection = this.createTimeSection(initialValue);
    popup.appendChild(timeSection);

    document.body.appendChild(popup);

    // Create instance
    const instance = {
      container,
      trigger,
      popup,
      calendarWrapper,
      calendar: null as any,
      currentValue: initialValue,
      params,
      isDestroyed: false,
      cleanup: null as (() => void) | null,
    };

    this.instances.set(container, instance);

    // Initialize calendar
    if (!this.options.disabled) {
      this.initializeCalendar(instance);
      this.setupEventHandlers(instance);
    }

    element.appendChild(container);

    container.dataset.row = String(params.cell.row);
    container.dataset.col = String(params.cell.col);
  }

  private createTimeSection(value: Date | null): HTMLElement {
    const section = document.createElement('div');
    section.className = 'zg-datetime-time-section';
    section.style.cssText = 'padding: 12px; border-top: 1px solid var(--zg-datetime-border-color);';

    const label = document.createElement('div');
    label.className = 'zg-datetime-time-label';
    label.textContent = 'Time';
    label.style.cssText = 'margin-bottom: 8px; font-weight: 500;';
    section.appendChild(label);

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
    if (value) {
      const hours = this.options.timeFormat === '12h'
        ? (value.getHours() % 12 || 12)
        : value.getHours();
      hoursInput.value = String(hours).padStart(2, '0');
    }
    timeContainer.appendChild(hoursInput);

    const sep1 = document.createElement('span');
    sep1.className = 'zg-datetime-time-separator';
    sep1.textContent = ':';
    timeContainer.appendChild(sep1);

    // Minutes
    const minutesInput = document.createElement('input');
    minutesInput.type = 'number';
    minutesInput.className = 'zg-datetime-time-input';
    minutesInput.dataset.type = 'minutes';
    minutesInput.min = '0';
    minutesInput.max = '59';
    minutesInput.placeholder = 'MM';
    if (value) {
      minutesInput.value = String(value.getMinutes()).padStart(2, '0');
    }
    timeContainer.appendChild(minutesInput);

    // Seconds (optional)
    if (this.options.showSeconds) {
      const sep2 = document.createElement('span');
      sep2.className = 'zg-datetime-time-separator';
      sep2.textContent = ':';
      timeContainer.appendChild(sep2);

      const secondsInput = document.createElement('input');
      secondsInput.type = 'number';
      secondsInput.className = 'zg-datetime-time-input';
      secondsInput.dataset.type = 'seconds';
      secondsInput.min = '0';
      secondsInput.max = '59';
      secondsInput.placeholder = 'SS';
      if (value) {
        secondsInput.value = String(value.getSeconds()).padStart(2, '0');
      }
      timeContainer.appendChild(secondsInput);
    }

    // AM/PM
    if (this.options.timeFormat === '12h') {
      const ampmSelect = document.createElement('select');
      ampmSelect.className = 'zg-datetime-time-ampm';
      ampmSelect.dataset.type = 'ampm';
      ['AM', 'PM'].forEach(v => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v;
        ampmSelect.appendChild(opt);
      });
      if (value && value.getHours() >= 12) {
        ampmSelect.value = 'PM';
      }
      timeContainer.appendChild(ampmSelect);
    }

    section.appendChild(timeContainer);
    return section;
  }

  private async initializeCalendar(instance: any): Promise<void> {
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
            const selectedDateStr = self.selectedDates[0];
            const selectedDate = new Date(selectedDateStr);
            if (!isNaN(selectedDate.getTime())) {
              this.handleDateSelect(instance, selectedDate);
            }
          }
        },
      },
    };

    if (instance.currentValue) {
      calendarOptions.settings.selected = {
        dates: [formatDateForCalendar(instance.currentValue)],
      };
    }

    try {
      const { Calendar } = await import('vanilla-calendar-pro');
      instance.calendar = new Calendar(instance.calendarWrapper, calendarOptions);
      instance.calendar.init();
    } catch (error) {
      console.error('DateTimePickerRenderer: Failed to load vanilla-calendar-pro:', error);
    }
  }

  private handleDateSelect(instance: any, date: Date): void {
    if (instance.isDestroyed) return;

    // Preserve time if we have a current value
    if (instance.currentValue) {
      date.setHours(
        instance.currentValue.getHours(),
        instance.currentValue.getMinutes(),
        instance.currentValue.getSeconds()
      );
    }

    instance.currentValue = date;
    this.updateTriggerDisplay(instance);
    this.updateTimeInputs(instance);
  }

  private updateTriggerDisplay(instance: any): void {
    const textSpan = instance.trigger.querySelector('.zg-datetime-trigger-text');
    if (textSpan) {
      const displayText = instance.currentValue
        ? formatDateTime(instance.currentValue, this.options.dateFormat, this.options.timeFormat)
        : this.options.placeholder;
      textSpan.textContent = displayText;
      textSpan.classList.toggle('placeholder', !instance.currentValue);
    }
  }

  private updateTimeInputs(instance: any): void {
    const value = instance.currentValue;
    if (!value) return;

    const hoursInput = instance.popup.querySelector('[data-type="hours"]') as HTMLInputElement;
    const minutesInput = instance.popup.querySelector('[data-type="minutes"]') as HTMLInputElement;
    const secondsInput = instance.popup.querySelector('[data-type="seconds"]') as HTMLInputElement;
    const ampmSelect = instance.popup.querySelector('[data-type="ampm"]') as HTMLSelectElement;

    if (hoursInput) {
      const hours = this.options.timeFormat === '12h'
        ? (value.getHours() % 12 || 12)
        : value.getHours();
      hoursInput.value = String(hours).padStart(2, '0');
    }
    if (minutesInput) {
      minutesInput.value = String(value.getMinutes()).padStart(2, '0');
    }
    if (secondsInput) {
      secondsInput.value = String(value.getSeconds()).padStart(2, '0');
    }
    if (ampmSelect) {
      ampmSelect.value = value.getHours() >= 12 ? 'PM' : 'AM';
    }
  }

  private setupEventHandlers(instance: any): void {
    const { container, trigger, popup } = instance;
    const cleanupFns: (() => void)[] = [];

    // Trigger click
    const handleClick = (e: Event) => {
      e.stopPropagation();
      if (instance.isDestroyed) return;

      if (this.popupManager.isOpen(popup)) {
        this.closeAndSave(instance);
      } else {
        this.popupManager.open({
          popup,
          anchor: trigger,
          onClose: () => {},
          positionOptions: { placement: 'bottom-start', offset: 4 },
          scrollOptions: { closeOnOutOfView: this.options.closeOnScroll },
        });
      }
    };

    trigger.addEventListener('click', handleClick);
    cleanupFns.push(() => trigger.removeEventListener('click', handleClick));

    // Time input changes
    const handleTimeChange = () => {
      this.updateValueFromTimeInputs(instance);
    };

    const timeInputs = popup.querySelectorAll('.zg-datetime-time-input, .zg-datetime-time-ampm');
    timeInputs.forEach((input: Element) => {
      input.addEventListener('change', handleTimeChange);
      input.addEventListener('input', handleTimeChange);
      cleanupFns.push(() => {
        input.removeEventListener('change', handleTimeChange);
        input.removeEventListener('input', handleTimeChange);
      });
    });

    // Keyboard
    const cleanupKeyboard = setupDatetimeKeyboard(container, {
      onEscape: () => this.popupManager.close(popup),
      onEnter: () => this.closeAndSave(instance),
    });
    cleanupFns.push(cleanupKeyboard);

    instance.cleanup = () => cleanupFns.forEach(fn => fn());
  }

  private updateValueFromTimeInputs(instance: any): void {
    const hoursInput = instance.popup.querySelector('[data-type="hours"]') as HTMLInputElement;
    const minutesInput = instance.popup.querySelector('[data-type="minutes"]') as HTMLInputElement;
    const secondsInput = instance.popup.querySelector('[data-type="seconds"]') as HTMLInputElement;
    const ampmSelect = instance.popup.querySelector('[data-type="ampm"]') as HTMLSelectElement;

    let hours = parseInt(hoursInput?.value || '0', 10);
    const minutes = parseInt(minutesInput?.value || '0', 10);
    const seconds = secondsInput ? parseInt(secondsInput.value || '0', 10) : 0;

    if (this.options.timeFormat === '12h' && ampmSelect) {
      if (ampmSelect.value === 'PM' && hours < 12) hours += 12;
      if (ampmSelect.value === 'AM' && hours === 12) hours = 0;
    }

    if (!instance.currentValue) {
      instance.currentValue = new Date();
    }

    instance.currentValue.setHours(hours, minutes, seconds);
    this.updateTriggerDisplay(instance);
  }

  private closeAndSave(instance: any): void {
    this.popupManager.close(instance.popup);

    if (this.options.onChange && instance.currentValue) {
      this.options.onChange(instance.currentValue, instance.params);
    }
  }

  update(element: HTMLElement, params: RenderParams): void {
    const container = element.querySelector('.zg-datetime-picker-wrapper') as HTMLElement;
    if (!container) return;

    const instance = this.instances.get(container);
    if (!instance) return;

    const newValue = parseDate(params.value);
    instance.currentValue = newValue;
    instance.params = params;

    this.updateTriggerDisplay(instance);
    this.updateTimeInputs(instance);

    container.dataset.row = String(params.cell.row);
    container.dataset.col = String(params.cell.col);
  }

  destroy(element: HTMLElement): void {
    const container = element.querySelector('.zg-datetime-picker-wrapper') as HTMLElement;
    if (!container) return;

    const instance = this.instances.get(container);
    if (!instance) return;

    instance.isDestroyed = true;

    if (this.popupManager.isOpen(instance.popup)) {
      this.popupManager.close(instance.popup);
    }

    if (instance.cleanup) instance.cleanup();

    if (instance.calendar?.destroy) {
      try { instance.calendar.destroy(); } catch (e) {}
    }

    instance.popup.remove();
    this.instances.delete(container);

    element.innerHTML = '';
    element.classList.remove('zg-cell-datetime-picker');
  }

  getCellClass(params: RenderParams): string | undefined {
    const value = parseDate(params.value);
    return value ? 'zg-datetime-picker-has-value' : 'zg-datetime-picker-empty';
  }
}

/**
 * Factory function
 */
export function createDateTimePickerRenderer(options: DateTimePickerRendererOptions = {}): DateTimePickerRenderer {
  return new DateTimePickerRenderer(options);
}
