/**
 * TimeRenderer - Simple time display renderer (read-only)
 *
 * Displays formatted time values without interactive picker.
 */

import type { CellRenderer, RenderParams } from '../renderer.interface';

export type TimeFormat = '12h' | '24h';

export interface TimeValue {
  hours: number;
  minutes: number;
  seconds?: number;
}

export interface TimeRendererOptions {
  /** Time format (default: '24h') */
  format?: TimeFormat;
  /** Show seconds (default: false) */
  showSeconds?: boolean;
  /** Text for empty/null values (default: '') */
  emptyText?: string;
  /** Custom CSS class */
  className?: string;
}

/**
 * Parse time value from various formats
 */
function parseTimeValue(value: any): TimeValue | null {
  if (!value) return null;

  if (typeof value === 'object' && 'hours' in value) {
    return value as TimeValue;
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
function formatTimeValue(value: TimeValue, format: TimeFormat, showSeconds: boolean): string {
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
 * TimeRenderer - Displays formatted time values
 */
export class TimeRenderer implements CellRenderer {
  private options: Required<TimeRendererOptions>;

  constructor(options: TimeRendererOptions = {}) {
    this.options = {
      format: options.format ?? '24h',
      showSeconds: options.showSeconds ?? false,
      emptyText: options.emptyText ?? '',
      className: options.className ?? '',
    };
  }

  render(element: HTMLElement, params: RenderParams): void {
    element.classList.add('zg-cell-time-display');

    const span = document.createElement('span');
    span.className = `zg-datetime-display ${this.options.className}`;

    const value = parseTimeValue(params.value);
    if (value) {
      span.textContent = formatTimeValue(value, this.options.format, this.options.showSeconds);
    } else {
      span.textContent = this.options.emptyText;
      span.classList.add('empty');
    }

    element.appendChild(span);
  }

  update(element: HTMLElement, params: RenderParams): void {
    const span = element.querySelector('.zg-datetime-display');
    if (!span) return;

    const value = parseTimeValue(params.value);
    if (value) {
      span.textContent = formatTimeValue(value, this.options.format, this.options.showSeconds);
      span.classList.remove('empty');
    } else {
      span.textContent = this.options.emptyText;
      span.classList.add('empty');
    }
  }

  destroy(element: HTMLElement): void {
    element.innerHTML = '';
    element.classList.remove('zg-cell-time-display');
  }

  getCellClass(params: RenderParams): string | undefined {
    const value = parseTimeValue(params.value);
    return value ? 'zg-time-display-has-value' : 'zg-time-display-empty';
  }
}

/**
 * Factory function
 */
export function createTimeRenderer(options: TimeRendererOptions = {}): TimeRenderer {
  return new TimeRenderer(options);
}
