/**
 * TimePickerRenderer - Interactive time picker with popup
 *
 * Features:
 * - 12h/24h format support
 * - Optional seconds
 * - Minute stepping
 * - Min/max time constraints
 */

import type { CellRenderer, RenderParams } from '../../renderer.interface';
import type { TimePickerRendererOptions, ResolvedTimePickerOptions, TimeValue } from './types';
import { PopupManager, setupDatetimeKeyboard, ThemeManager } from '../../../../datetime-core';

/**
 * Clock icon SVG
 */
const CLOCK_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"></circle>
  <polyline points="12 6 12 12 16 14"></polyline>
</svg>`;

/**
 * Parse time value from various formats
 */
function parseTimeValue(value: any): TimeValue | null {
  if (!value) return null;

  if (typeof value === 'object' && 'hours' in value) {
    return {
      hours: value.hours ?? 0,
      minutes: value.minutes ?? 0,
      seconds: value.seconds,
    };
  }

  if (typeof value === 'string') {
    const match = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const seconds = match[3] ? parseInt(match[3], 10) : undefined;
      const ampm = match[4];

      if (ampm) {
        if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
      }

      return { hours, minutes, seconds };
    }
  }

  if (value instanceof Date) {
    return {
      hours: value.getHours(),
      minutes: value.getMinutes(),
      seconds: value.getSeconds(),
    };
  }

  return null;
}

/**
 * Format time value for display
 */
function formatTimeDisplay(
  value: TimeValue | null,
  format: '12h' | '24h',
  showSeconds: boolean
): string {
  if (!value) return '';

  let { hours, minutes, seconds } = value;
  let suffix = '';

  if (format === '12h') {
    suffix = hours >= 12 ? ' PM' : ' AM';
    hours = hours % 12 || 12;
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  let result = `${pad(hours)}:${pad(minutes)}`;
  if (showSeconds && seconds !== undefined) {
    result += `:${pad(seconds)}`;
  }
  return result + suffix;
}

/**
 * TimePickerRenderer - Renders an interactive time picker
 */
export class TimePickerRenderer implements CellRenderer {
  private options: ResolvedTimePickerOptions;
  private instances: WeakMap<
    HTMLElement,
    {
      container: HTMLElement;
      trigger: HTMLElement;
      popup: HTMLElement;
      currentValue: TimeValue | null;
      params: RenderParams;
      isDestroyed: boolean;
      cleanup: (() => void) | null;
    }
  >;
  private popupManager: PopupManager;

  constructor(options: TimePickerRendererOptions = {}) {
    this.options = {
      format: options.format ?? '24h',
      showSeconds: options.showSeconds ?? false,
      minuteStep: options.minuteStep ?? 1,
      placeholder: options.placeholder ?? 'Select time...',
      className: options.className ?? '',
      theme: options.theme ?? 'light',
      disabled: options.disabled ?? false,
      minTime: options.minTime ?? null,
      maxTime: options.maxTime ?? null,
      onChange: options.onChange,
    };
    this.instances = new WeakMap();
    this.popupManager = PopupManager.getInstance();

    if (this.options.theme !== 'auto') {
      ThemeManager.getInstance().setTheme(this.options.theme);
    }
  }

  render(element: HTMLElement, params: RenderParams): void {
    element.classList.add('zg-cell-time-picker');

    const initialValue = parseTimeValue(params.value);

    // Create container
    const container = document.createElement('div');
    container.className = `zg-datetime-container zg-time-picker-wrapper ${this.options.className}`;

    // Create trigger
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'zg-datetime-trigger zg-time-picker-trigger';
    if (this.options.disabled) {
      trigger.classList.add('zg-datetime-disabled');
      trigger.disabled = true;
    }

    const textSpan = document.createElement('span');
    textSpan.className = 'zg-datetime-trigger-text';
    const displayText = initialValue
      ? formatTimeDisplay(initialValue, this.options.format, this.options.showSeconds)
      : this.options.placeholder;
    textSpan.textContent = displayText;
    if (!initialValue) textSpan.classList.add('placeholder');
    trigger.appendChild(textSpan);

    const icon = document.createElement('span');
    icon.className = 'zg-datetime-trigger-icon';
    icon.innerHTML = CLOCK_ICON;
    trigger.appendChild(icon);

    container.appendChild(trigger);

    // Create popup
    const popup = document.createElement('div');
    popup.className = 'zg-datetime-popup zg-time-picker-popup';
    popup.style.display = 'none';
    popup.style.zIndex = '9999';

    // Create time inputs
    const timeContainer = this.createTimeInputs(initialValue);
    popup.appendChild(timeContainer);

    document.body.appendChild(popup);

    // Create instance
    const instance = {
      container,
      trigger,
      popup,
      currentValue: initialValue,
      params,
      isDestroyed: false,
      cleanup: null as (() => void) | null,
    };

    this.instances.set(container, instance);

    // Setup events
    if (!this.options.disabled) {
      this.setupEventHandlers(instance);
    }

    element.appendChild(container);

    container.dataset.row = String(params.cell.row);
    container.dataset.col = String(params.cell.col);
  }

  private createTimeInputs(value: TimeValue | null): HTMLElement {
    const container = document.createElement('div');
    container.className = 'zg-datetime-time-container';

    // Hours
    const hoursInput = document.createElement('input');
    hoursInput.type = 'number';
    hoursInput.className = 'zg-datetime-time-input';
    hoursInput.min = this.options.format === '12h' ? '1' : '0';
    hoursInput.max = this.options.format === '12h' ? '12' : '23';
    hoursInput.value = value
      ? String(this.options.format === '12h' ? value.hours % 12 || 12 : value.hours).padStart(
          2,
          '0'
        )
      : '';
    hoursInput.placeholder = 'HH';
    container.appendChild(hoursInput);

    // Separator
    const sep1 = document.createElement('span');
    sep1.className = 'zg-datetime-time-separator';
    sep1.textContent = ':';
    container.appendChild(sep1);

    // Minutes
    const minutesInput = document.createElement('input');
    minutesInput.type = 'number';
    minutesInput.className = 'zg-datetime-time-input';
    minutesInput.min = '0';
    minutesInput.max = '59';
    minutesInput.step = String(this.options.minuteStep);
    minutesInput.value = value ? String(value.minutes).padStart(2, '0') : '';
    minutesInput.placeholder = 'MM';
    container.appendChild(minutesInput);

    // Seconds (optional)
    if (this.options.showSeconds) {
      const sep2 = document.createElement('span');
      sep2.className = 'zg-datetime-time-separator';
      sep2.textContent = ':';
      container.appendChild(sep2);

      const secondsInput = document.createElement('input');
      secondsInput.type = 'number';
      secondsInput.className = 'zg-datetime-time-input';
      secondsInput.min = '0';
      secondsInput.max = '59';
      secondsInput.value =
        value?.seconds !== undefined ? String(value.seconds).padStart(2, '0') : '';
      secondsInput.placeholder = 'SS';
      container.appendChild(secondsInput);
    }

    // AM/PM (for 12h format)
    if (this.options.format === '12h') {
      const ampmSelect = document.createElement('select');
      ampmSelect.className = 'zg-datetime-time-ampm';
      const amOption = document.createElement('option');
      amOption.value = 'AM';
      amOption.textContent = 'AM';
      const pmOption = document.createElement('option');
      pmOption.value = 'PM';
      pmOption.textContent = 'PM';
      ampmSelect.appendChild(amOption);
      ampmSelect.appendChild(pmOption);
      if (value && value.hours >= 12) {
        ampmSelect.value = 'PM';
      }
      container.appendChild(ampmSelect);
    }

    return container;
  }

  private setupEventHandlers(instance: any): void {
    const { container, trigger, popup } = instance;

    const handleClick = (e: Event) => {
      e.stopPropagation();
      if (instance.isDestroyed) return;

      if (this.popupManager.isOpen(popup)) {
        this.popupManager.close(popup);
      } else {
        this.popupManager.open({
          popup,
          anchor: trigger,
          onClose: () => {},
          positionOptions: { placement: 'bottom-start', offset: 4 },
        });
      }
    };

    trigger.addEventListener('click', handleClick);

    const cleanupKeyboard = setupDatetimeKeyboard(container, {
      onEscape: () => this.popupManager.close(popup),
    });

    instance.cleanup = () => {
      trigger.removeEventListener('click', handleClick);
      cleanupKeyboard();
    };
  }

  update(element: HTMLElement, params: RenderParams): void {
    const container = element.querySelector('.zg-time-picker-wrapper') as HTMLElement;
    if (!container) return;

    const instance = this.instances.get(container);
    if (!instance) return;

    const newValue = parseTimeValue(params.value);
    instance.currentValue = newValue;
    instance.params = params;

    const textSpan = instance.trigger.querySelector('.zg-datetime-trigger-text');
    if (textSpan) {
      const displayText = newValue
        ? formatTimeDisplay(newValue, this.options.format, this.options.showSeconds)
        : this.options.placeholder;
      textSpan.textContent = displayText;
      textSpan.classList.toggle('placeholder', !newValue);
    }

    container.dataset.row = String(params.cell.row);
    container.dataset.col = String(params.cell.col);
  }

  destroy(element: HTMLElement): void {
    const container = element.querySelector('.zg-time-picker-wrapper') as HTMLElement;
    if (!container) return;

    const instance = this.instances.get(container);
    if (!instance) return;

    instance.isDestroyed = true;

    if (this.popupManager.isOpen(instance.popup)) {
      this.popupManager.close(instance.popup);
    }

    if (instance.cleanup) {
      instance.cleanup();
    }

    instance.popup.remove();
    this.instances.delete(container);

    element.innerHTML = '';
    element.classList.remove('zg-cell-time-picker');
  }

  getCellClass(params: RenderParams): string | undefined {
    const value = parseTimeValue(params.value);
    return value ? 'zg-time-picker-has-value' : 'zg-time-picker-empty';
  }
}

/**
 * Factory function
 */
export function createTimePickerRenderer(
  options: TimePickerRendererOptions = {}
): TimePickerRenderer {
  return new TimePickerRenderer(options);
}
