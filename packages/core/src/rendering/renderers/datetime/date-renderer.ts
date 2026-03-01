/**
 * DateRenderer - Simple date display renderer (read-only)
 *
 * Displays formatted date values without interactive picker.
 */

import type { CellRenderer, RenderParams } from '../renderer.interface';
import { parseDate, formatDateForDisplay, getDateLabel } from '../../../datetime-core';

export interface DateRendererOptions {
  /** Date format (default: 'DD/MM/YYYY') */
  format?: string;
  /** Text for empty/null values (default: '') */
  emptyText?: string;
  /** Use relative labels like "Today", "Yesterday" (default: false) */
  useRelativeLabels?: boolean;
  /** Custom CSS class */
  className?: string;
}

/**
 * DateRenderer - Displays formatted date values
 */
export class DateRenderer implements CellRenderer {
  private options: Required<DateRendererOptions>;

  constructor(options: DateRendererOptions = {}) {
    this.options = {
      format: options.format ?? 'DD/MM/YYYY',
      emptyText: options.emptyText ?? '',
      useRelativeLabels: options.useRelativeLabels ?? false,
      className: options.className ?? '',
    };
  }

  render(element: HTMLElement, params: RenderParams): void {
    this.destroy(element);
    element.classList.add('zg-cell-date-display');

    const span = document.createElement('span');
    span.className = `zg-datetime-display ${this.options.className}`;

    const value = parseDate(params.value);
    if (value) {
      span.textContent = this.options.useRelativeLabels
        ? getDateLabel(value, this.options.format)
        : formatDateForDisplay(value, this.options.format);
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
      span.textContent = this.options.useRelativeLabels
        ? getDateLabel(value, this.options.format)
        : formatDateForDisplay(value, this.options.format);
      span.classList.remove('empty');
    } else {
      span.textContent = this.options.emptyText;
      span.classList.add('empty');
    }
  }

  destroy(element: HTMLElement): void {
    element.innerHTML = '';
    element.classList.remove('zg-cell-date-display');
  }

  getCellClass(params: RenderParams): string | undefined {
    const value = parseDate(params.value);
    return value ? 'zg-date-display-has-value' : 'zg-date-display-empty';
  }
}

/**
 * Factory function
 */
export function createDateRenderer(options: DateRendererOptions = {}): DateRenderer {
  return new DateRenderer(options);
}
