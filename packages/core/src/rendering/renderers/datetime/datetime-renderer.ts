/**
 * DateTimeRenderer - Simple datetime display renderer (read-only)
 *
 * Displays formatted datetime values without interactive picker.
 */

import type { CellRenderer, RenderParams } from '../renderer.interface';
import { parseDate, formatDateTime, getDateLabel, formatTime } from '../../../datetime-core';

export type TimeFormat = '12h' | '24h';

export interface DateTimeRendererOptions {
  /** Date format (default: 'DD/MM/YYYY') */
  dateFormat?: string;
  /** Time format (default: '24h') */
  timeFormat?: TimeFormat;
  /** Show seconds (default: false) */
  showSeconds?: boolean;
  /** Separator between date and time (default: ' ') */
  separator?: string;
  /** Text for empty/null values (default: '') */
  emptyText?: string;
  /** Use relative labels like "Today", "Yesterday" for date part (default: false) */
  useRelativeLabels?: boolean;
  /** Custom CSS class */
  className?: string;
}

/**
 * Format datetime for display
 */
function formatDateTimeValue(
  date: Date,
  dateFormat: string,
  timeFormat: TimeFormat,
  separator: string,
  useRelativeLabels: boolean
): string {
  const dateStr = useRelativeLabels
    ? getDateLabel(date, dateFormat)
    : formatDateTime(date, dateFormat, 'HH:mm').split(' ')[0]; // Just date part

  const timeStr = formatTime(date, timeFormat === '24h');

  return `${dateStr}${separator}${timeStr}`;
}

/**
 * DateTimeRenderer - Displays formatted datetime values
 */
export class DateTimeRenderer implements CellRenderer {
  private options: Required<DateTimeRendererOptions>;

  constructor(options: DateTimeRendererOptions = {}) {
    this.options = {
      dateFormat: options.dateFormat ?? 'DD/MM/YYYY',
      timeFormat: options.timeFormat ?? '24h',
      showSeconds: options.showSeconds ?? false,
      separator: options.separator ?? ' ',
      emptyText: options.emptyText ?? '',
      useRelativeLabels: options.useRelativeLabels ?? false,
      className: options.className ?? '',
    };
  }

  render(element: HTMLElement, params: RenderParams): void {
    element.classList.add('zg-cell-datetime-display');

    const span = document.createElement('span');
    span.className = `zg-datetime-display ${this.options.className}`;

    const value = parseDate(params.value);
    if (value) {
      span.textContent = formatDateTimeValue(
        value,
        this.options.dateFormat,
        this.options.timeFormat,
        this.options.separator,
        this.options.useRelativeLabels
      );
    } else {
      span.textContent = this.options.emptyText;
      span.classList.add('empty');
    }

    element.appendChild(span);
  }

  update(element: HTMLElement, params: RenderParams): void {
    const span = element.querySelector('.zg-datetime-display');
    if (!span) return;

    const value = parseDate(params.value);
    if (value) {
      span.textContent = formatDateTimeValue(
        value,
        this.options.dateFormat,
        this.options.timeFormat,
        this.options.separator,
        this.options.useRelativeLabels
      );
      span.classList.remove('empty');
    } else {
      span.textContent = this.options.emptyText;
      span.classList.add('empty');
    }
  }

  destroy(element: HTMLElement): void {
    element.innerHTML = '';
    element.classList.remove('zg-cell-datetime-display');
  }

  getCellClass(params: RenderParams): string | undefined {
    const value = parseDate(params.value);
    return value ? 'zg-datetime-display-has-value' : 'zg-datetime-display-empty';
  }
}

/**
 * Factory function
 */
export function createDateTimeRenderer(options: DateTimeRendererOptions = {}): DateTimeRenderer {
  return new DateTimeRenderer(options);
}
