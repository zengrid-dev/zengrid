/**
 * TimeEditor - Time input editor for cell editing
 *
 * Features:
 * - 12h/24h format support
 * - Optional seconds
 * - Minute stepping
 * - Min/max time constraints
 */

import type { CellEditor, EditorParams, ValidationResult } from '../../cell-editor.interface';
import type { TimeEditorOptions, ResolvedTimeEditorOptions, TimeValue } from './types';
import { setupDatetimeKeyboard, ThemeManager } from '../../../datetime-core';

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
 * TimeEditor - Time input editor for cell editing
 */
export class TimeEditor implements CellEditor<TimeValue | null> {
  private options: ResolvedTimeEditorOptions;
  private container: HTMLElement | null = null;
  private hoursInput: HTMLInputElement | null = null;
  private minutesInput: HTMLInputElement | null = null;
  private secondsInput: HTMLInputElement | null = null;
  private ampmSelect: HTMLSelectElement | null = null;
  private params: EditorParams | null = null;
  private initialValue: TimeValue | null = null;
  private currentValue: TimeValue | null = null;
  private isDestroyed: boolean = false;
  private cleanup: (() => void) | null = null;

  constructor(options: TimeEditorOptions = {}) {
    this.options = {
      format: options.format ?? '24h',
      showSeconds: options.showSeconds ?? false,
      minuteStep: options.minuteStep ?? 1,
      placeholder: options.placeholder ?? 'HH:MM',
      className: options.className ?? 'zg-time-editor',
      theme: options.theme ?? 'light',
      autoFocus: options.autoFocus ?? true,
      required: options.required ?? false,
      commitOnBlur: options.commitOnBlur ?? true,
      minTime: options.minTime ?? null,
      maxTime: options.maxTime ?? null,
      validator: options.validator,
    };

    if (this.options.theme !== 'auto') {
      ThemeManager.getInstance().setTheme(this.options.theme);
    }
  }

  init(container: HTMLElement, value: TimeValue | null, params: EditorParams): void {
    this.isDestroyed = false;
    this.params = params;
    this.container = container;
    this.initialValue = parseTimeValue(value);
    this.currentValue = this.initialValue ? { ...this.initialValue } : null;

    container.innerHTML = '';

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = `${this.options.className}-wrapper zg-datetime-container`;
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    // Create time inputs
    const timeContainer = document.createElement('div');
    timeContainer.className = 'zg-datetime-time-container';

    // Hours input
    this.hoursInput = document.createElement('input');
    this.hoursInput.type = 'number';
    this.hoursInput.className = 'zg-datetime-time-input';
    this.hoursInput.min = this.options.format === '12h' ? '1' : '0';
    this.hoursInput.max = this.options.format === '12h' ? '12' : '23';
    this.hoursInput.placeholder = 'HH';
    if (this.currentValue) {
      const displayHours =
        this.options.format === '12h'
          ? this.currentValue.hours % 12 || 12
          : this.currentValue.hours;
      this.hoursInput.value = String(displayHours).padStart(2, '0');
    }
    timeContainer.appendChild(this.hoursInput);

    // Separator
    const sep1 = document.createElement('span');
    sep1.className = 'zg-datetime-time-separator';
    sep1.textContent = ':';
    timeContainer.appendChild(sep1);

    // Minutes input
    this.minutesInput = document.createElement('input');
    this.minutesInput.type = 'number';
    this.minutesInput.className = 'zg-datetime-time-input';
    this.minutesInput.min = '0';
    this.minutesInput.max = '59';
    this.minutesInput.step = String(this.options.minuteStep);
    this.minutesInput.placeholder = 'MM';
    if (this.currentValue) {
      this.minutesInput.value = String(this.currentValue.minutes).padStart(2, '0');
    }
    timeContainer.appendChild(this.minutesInput);

    // Seconds (optional)
    if (this.options.showSeconds) {
      const sep2 = document.createElement('span');
      sep2.className = 'zg-datetime-time-separator';
      sep2.textContent = ':';
      timeContainer.appendChild(sep2);

      this.secondsInput = document.createElement('input');
      this.secondsInput.type = 'number';
      this.secondsInput.className = 'zg-datetime-time-input';
      this.secondsInput.min = '0';
      this.secondsInput.max = '59';
      this.secondsInput.placeholder = 'SS';
      if (this.currentValue?.seconds !== undefined) {
        this.secondsInput.value = String(this.currentValue.seconds).padStart(2, '0');
      }
      timeContainer.appendChild(this.secondsInput);
    }

    // AM/PM (for 12h format)
    if (this.options.format === '12h') {
      this.ampmSelect = document.createElement('select');
      this.ampmSelect.className = 'zg-datetime-time-ampm';
      const amOption = document.createElement('option');
      amOption.value = 'AM';
      amOption.textContent = 'AM';
      const pmOption = document.createElement('option');
      pmOption.value = 'PM';
      pmOption.textContent = 'PM';
      this.ampmSelect.appendChild(amOption);
      this.ampmSelect.appendChild(pmOption);
      if (this.currentValue && this.currentValue.hours >= 12) {
        this.ampmSelect.value = 'PM';
      }
      timeContainer.appendChild(this.ampmSelect);
    }

    wrapper.appendChild(timeContainer);
    container.appendChild(wrapper);

    // Setup event handlers
    this.setupEventHandlers();

    // Auto-focus
    if (this.options.autoFocus) {
      requestAnimationFrame(() => this.focus());
    }
  }

  private setupEventHandlers(): void {
    const cleanupFns: (() => void)[] = [];

    const updateValue = () => {
      const hours = parseInt(this.hoursInput?.value || '0', 10);
      const minutes = parseInt(this.minutesInput?.value || '0', 10);
      const seconds = this.secondsInput ? parseInt(this.secondsInput.value || '0', 10) : undefined;

      let finalHours = hours;
      if (this.options.format === '12h' && this.ampmSelect) {
        if (this.ampmSelect.value === 'PM' && hours < 12) finalHours += 12;
        if (this.ampmSelect.value === 'AM' && hours === 12) finalHours = 0;
      }

      this.currentValue = {
        hours: finalHours,
        minutes,
        seconds,
      };

      this.params?.onChange?.(this.currentValue);
    };

    // Input change handlers
    [this.hoursInput, this.minutesInput, this.secondsInput].forEach((input) => {
      if (input) {
        const handler = () => updateValue();
        input.addEventListener('input', handler);
        cleanupFns.push(() => input.removeEventListener('input', handler));
      }
    });

    if (this.ampmSelect) {
      const handler = () => updateValue();
      this.ampmSelect.addEventListener('change', handler);
      cleanupFns.push(() => this.ampmSelect?.removeEventListener('change', handler));
    }

    // Blur handler
    if (this.options.commitOnBlur) {
      const handleBlur = (e: Event) => {
        if (this.isDestroyed) return;

        const focusEvent = e as FocusEvent;
        const relatedTarget = focusEvent.relatedTarget as HTMLElement;
        if (this.container?.contains(relatedTarget)) {
          return;
        }

        setTimeout(() => {
          if (!this.isDestroyed) {
            this.commit();
          }
        }, 100);
      };

      [this.hoursInput, this.minutesInput, this.secondsInput, this.ampmSelect].forEach((el) => {
        if (el) {
          el.addEventListener('blur', handleBlur);
          cleanupFns.push(() => el.removeEventListener('blur', handleBlur));
        }
      });
    }

    // Keyboard navigation
    const cleanupKeyboard = setupDatetimeKeyboard(this.container!, {
      onEscape: () => this.cancel(),
      onEnter: () => this.commit(),
    });
    cleanupFns.push(cleanupKeyboard);

    this.cleanup = () => {
      cleanupFns.forEach((fn) => fn());
    };
  }

  private commit(): void {
    if (this.isDestroyed || !this.params) return;

    const validationResult = this.isValid();
    if (
      validationResult === true ||
      (typeof validationResult === 'object' && validationResult.valid)
    ) {
      this.params.onComplete?.(this.currentValue, false);
    }
  }

  private cancel(): void {
    if (this.isDestroyed || !this.params) return;
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

  getValue(): TimeValue | null {
    return this.currentValue;
  }

  isValid(): boolean | ValidationResult {
    const value = this.currentValue;

    // Required check
    if (this.options.required && !value) {
      return { valid: false, message: 'Time is required' };
    }

    if (value) {
      // Range check
      if (value.hours < 0 || value.hours > 23) {
        return { valid: false, message: 'Invalid hours' };
      }
      if (value.minutes < 0 || value.minutes > 59) {
        return { valid: false, message: 'Invalid minutes' };
      }
      if (value.seconds !== undefined && (value.seconds < 0 || value.seconds > 59)) {
        return { valid: false, message: 'Invalid seconds' };
      }

      // Min/max time check
      if (this.options.minTime) {
        const minParts = this.options.minTime.split(':');
        const minHours = parseInt(minParts[0], 10);
        const minMinutes = parseInt(minParts[1], 10);
        const minTotal = minHours * 60 + minMinutes;
        const valueTotal = value.hours * 60 + value.minutes;
        if (valueTotal < minTotal) {
          return { valid: false, message: `Time must be after ${this.options.minTime}` };
        }
      }

      if (this.options.maxTime) {
        const maxParts = this.options.maxTime.split(':');
        const maxHours = parseInt(maxParts[0], 10);
        const maxMinutes = parseInt(maxParts[1], 10);
        const maxTotal = maxHours * 60 + maxMinutes;
        const valueTotal = value.hours * 60 + value.minutes;
        if (valueTotal > maxTotal) {
          return { valid: false, message: `Time must be before ${this.options.maxTime}` };
        }
      }
    }

    // Custom validator
    if (this.options.validator) {
      const result = this.options.validator(value);
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
    this.hoursInput?.focus();
  }

  destroy(): void {
    this.isDestroyed = true;

    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }

    this.container = null;
    this.hoursInput = null;
    this.minutesInput = null;
    this.secondsInput = null;
    this.ampmSelect = null;
    this.params = null;
    this.initialValue = null;
    this.currentValue = null;
  }
}

/**
 * Factory function
 */
export function createTimeEditor(options: TimeEditorOptions = {}): TimeEditor {
  return new TimeEditor(options);
}
