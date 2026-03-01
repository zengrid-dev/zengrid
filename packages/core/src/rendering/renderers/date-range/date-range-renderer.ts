import type { CellRenderer, RenderParams } from '../renderer.interface';
import { SimpleLRUCache } from '../renderer-utils';

/**
 * Date range value type
 */
export interface DateRange {
  start: Date | null;
  end: Date | null;
}

/**
 * Supported date format patterns
 */
export type DateFormat =
  | 'MM/DD/YYYY'
  | 'DD/MM/YYYY'
  | 'YYYY-MM-DD'
  | 'DD-MM-YYYY'
  | 'MM-DD-YYYY'
  | 'YYYY/MM/DD'
  | 'locale';

/**
 * Configuration options for DateRangeRenderer
 */
export interface DateRangeRendererOptions {
  /** Date format pattern (default: 'MM/DD/YYYY') */
  format?: DateFormat;
  /** Locale string for date formatting (e.g., 'en-US', 'de-DE') */
  locale?: string;
  /** Separator between start and end dates (default: ' - ') */
  separator?: string;
  /** Show calendar icon */
  showCalendar?: boolean;
  /** Show duration in days */
  showDuration?: boolean;
  /** Custom CSS class for the date range element */
  className?: string;
  /** Display format for invalid dates */
  invalidDateText?: string;
  /** Display format for null/undefined values */
  emptyDateText?: string;
  /** Time zone for date formatting */
  timeZone?: string;
  /** Callback when date range is clicked */
  onClick?: (range: DateRange | null, params: RenderParams) => void;
  /** Color for start date */
  startColor?: string;
  /** Color for end date */
  endColor?: string;
  /** Show as chips/badges */
  chipStyle?: boolean;
}

/**
 * DateRangeRenderer - Renders formatted date ranges with visual styling
 *
 * Features:
 * - Multiple date format patterns
 * - Locale-aware formatting
 * - Visual separation between start and end dates
 * - Duration calculation and display
 * - LRU cache for performance
 * - Chip/badge styling option
 * - ARIA attributes for accessibility
 *
 * @example
 * ```typescript
 * const renderer = new DateRangeRenderer({
 *   format: 'DD/MM/YYYY',
 *   showDuration: true,
 *   chipStyle: true
 * });
 * ```
 */
export class DateRangeRenderer implements CellRenderer {
  private options: Required<
    Omit<DateRangeRendererOptions, 'timeZone' | 'onClick' | 'startColor' | 'endColor'>
  > & {
    timeZone?: string;
    onClick?: (range: DateRange | null, params: RenderParams) => void;
    startColor?: string;
    endColor?: string;
  };
  private formatterCache: SimpleLRUCache<string, Intl.DateTimeFormat>;
  private dateStringCache: SimpleLRUCache<string, string>;
  private eventHandlers: Map<HTMLElement, (e: Event) => void>;

  constructor(options: DateRangeRendererOptions = {}) {
    this.options = {
      format: options.format ?? 'MM/DD/YYYY',
      locale: options.locale ?? 'en-US',
      separator: options.separator ?? ' - ',
      showCalendar: options.showCalendar ?? false,
      showDuration: options.showDuration ?? false,
      className: options.className ?? 'zg-date-range',
      invalidDateText: options.invalidDateText ?? 'Invalid Date',
      emptyDateText: options.emptyDateText ?? '',
      timeZone: options.timeZone,
      onClick: options.onClick,
      startColor: options.startColor,
      endColor: options.endColor,
      chipStyle: options.chipStyle ?? false,
    };

    this.formatterCache = new SimpleLRUCache<string, Intl.DateTimeFormat>(50);
    this.dateStringCache = new SimpleLRUCache<string, string>(500);
    this.eventHandlers = new Map();
  }

  /**
   * Initial render - creates date range display structure
   */
  render(element: HTMLElement, params: RenderParams): void {
    this.destroy(element);
    element.classList.add('zg-cell-date-range');

    // Create date range container
    const container = document.createElement('div');
    container.className = `zg-date-range-wrapper ${this.options.className}`;
    container.style.cssText = `
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 4px 8px;
      box-sizing: border-box;
    `;

    if (this.options.chipStyle) {
      container.classList.add('zg-date-range-chips');
    }

    // Create start date element
    const startDate = document.createElement('span');
    startDate.className = 'zg-date-range-start';
    if (this.options.startColor) {
      startDate.style.color = this.options.startColor;
    }
    container.appendChild(startDate);

    // Create separator
    const separator = document.createElement('span');
    separator.className = 'zg-date-range-separator';
    separator.textContent = this.options.separator;
    container.appendChild(separator);

    // Create end date element
    const endDate = document.createElement('span');
    endDate.className = 'zg-date-range-end';
    if (this.options.endColor) {
      endDate.style.color = this.options.endColor;
    }
    container.appendChild(endDate);

    // Optionally add calendar icon
    if (this.options.showCalendar) {
      const calendarIcon = this.createCalendarIcon();
      container.appendChild(calendarIcon);
    }

    // Optionally add duration display
    if (this.options.showDuration) {
      const durationSpan = document.createElement('span');
      durationSpan.className = 'zg-date-range-duration';
      container.appendChild(durationSpan);
    }

    element.appendChild(container);

    // Add click handler if provided
    if (this.options.onClick) {
      const handler = (e: Event) => {
        e.stopPropagation();
        const range = this.parseRange(params.value);
        this.options.onClick!(range, params);
      };
      container.addEventListener('click', handler);
      this.eventHandlers.set(element, handler);
      container.style.cursor = 'pointer';
    }

    // Set initial state via update()
    this.update(element, params);
  }

  /**
   * Update existing date range - called on value/state changes
   */
  update(element: HTMLElement, params: RenderParams): void {
    const container = element.querySelector('.zg-date-range-wrapper') as HTMLElement;
    if (!container) return;

    const startSpan = container.querySelector('.zg-date-range-start') as HTMLSpanElement;
    const endSpan = container.querySelector('.zg-date-range-end') as HTMLSpanElement;
    const separator = container.querySelector('.zg-date-range-separator') as HTMLSpanElement;
    const durationSpan = container.querySelector('.zg-date-range-duration') as HTMLSpanElement;

    if (!startSpan || !endSpan) return;

    // Parse date range value
    const range = this.parseRange(params.value);

    // Format and display dates
    if (range.start && range.end) {
      startSpan.textContent = this.formatDate(range.start);
      endSpan.textContent = this.formatDate(range.end);
      separator.style.display = 'inline';

      // Show duration if enabled
      if (this.options.showDuration && durationSpan) {
        const days = this.calculateDuration(range.start, range.end);
        durationSpan.textContent = ` (${days} day${days !== 1 ? 's' : ''})`;
        durationSpan.style.display = 'inline';
        durationSpan.style.marginLeft = '4px';
        durationSpan.style.color = '#666';
        durationSpan.style.fontSize = '12px';
      }

      // Apply chip styles if enabled
      if (this.options.chipStyle) {
        this.applyChipStyles(startSpan, endSpan);
      }

      container.classList.remove('zg-date-range-empty', 'zg-date-range-partial');
    } else if (range.start || range.end) {
      // Partial range (only start or end)
      startSpan.textContent = range.start ? this.formatDate(range.start) : '';
      endSpan.textContent = range.end ? this.formatDate(range.end) : '';
      separator.style.display = range.start && range.end ? 'inline' : 'none';
      container.classList.add('zg-date-range-partial');
      container.classList.remove('zg-date-range-empty');

      if (durationSpan) {
        durationSpan.style.display = 'none';
      }
    } else {
      // Empty range
      startSpan.textContent = this.options.emptyDateText;
      endSpan.textContent = '';
      separator.style.display = 'none';
      container.classList.add('zg-date-range-empty');
      container.classList.remove('zg-date-range-partial');

      if (durationSpan) {
        durationSpan.style.display = 'none';
      }
    }

    // Set ARIA attributes
    this.setAriaAttributes(container, range, params);

    // Set data attributes
    // WARNING: data-row/col must ONLY be on .zg-cell elements (set by CellPositioner)
    if (params.column?.field) {
      container.dataset['field'] = params.column.field;
    }
    if (range.start) {
      container.dataset['startDate'] = range.start.toISOString();
    } else {
      delete container.dataset['startDate'];
    }
    if (range.end) {
      container.dataset['endDate'] = range.end.toISOString();
    } else {
      delete container.dataset['endDate'];
    }
  }

  /**
   * Cleanup before element returns to pool
   */
  destroy(element: HTMLElement): void {
    const handler = this.eventHandlers.get(element);
    if (handler) {
      const container = element.querySelector('.zg-date-range-wrapper');
      if (container) {
        container.removeEventListener('click', handler);
      }
      this.eventHandlers.delete(element);
    }

    element.innerHTML = '';
    element.classList.remove('zg-cell-date-range');
  }

  /**
   * Optional: Return CSS class based on date range validity
   */
  getCellClass(params: RenderParams): string | undefined {
    const range = this.parseRange(params.value);

    if (!range.start && !range.end) {
      return 'zg-date-range-empty';
    }

    if ((range.start && !range.end) || (!range.start && range.end)) {
      return 'zg-date-range-partial';
    }

    if (range.start && range.end && range.end < range.start) {
      return 'zg-date-range-invalid';
    }

    return undefined;
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
   * Format date according to the configured format and locale
   */
  private formatDate(date: Date | null): string {
    if (date === null) {
      return this.options.emptyDateText;
    }

    // Check cache first
    const cacheKey = `${date.getTime()}_${this.options.format}_${this.options.locale}_${this.options.timeZone ?? 'default'}`;
    const cached = this.dateStringCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    // Format the date
    let formatted: string;

    if (this.options.format === 'locale') {
      formatted = this.formatWithLocale(date);
    } else {
      formatted = this.formatWithPattern(date, this.options.format);
    }

    // Cache the result
    this.dateStringCache.set(cacheKey, formatted);

    return formatted;
  }

  /**
   * Format date using Intl.DateTimeFormat (locale-aware)
   */
  private formatWithLocale(date: Date): string {
    const cacheKey = `${this.options.locale}_${this.options.timeZone ?? 'default'}`;
    let formatter = this.formatterCache.get(cacheKey);

    if (!formatter) {
      formatter = new Intl.DateTimeFormat(this.options.locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: this.options.timeZone,
      });
      this.formatterCache.set(cacheKey, formatter);
    }

    return formatter.format(date);
  }

  /**
   * Format date using a specific pattern
   */
  private formatWithPattern(date: Date, format: DateFormat): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (format) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'DD-MM-YYYY':
        return `${day}-${month}-${year}`;
      case 'MM-DD-YYYY':
        return `${month}-${day}-${year}`;
      case 'YYYY/MM/DD':
        return `${year}/${month}/${day}`;
      default:
        return this.options.invalidDateText;
    }
  }

  /**
   * Calculate duration in days between two dates
   */
  private calculateDuration(start: Date, end: Date): number {
    const diffMs = end.getTime() - start.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Apply chip/badge styles to date elements
   */
  private applyChipStyles(startSpan: HTMLSpanElement, endSpan: HTMLSpanElement): void {
    const chipStyle = `
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      margin: 2px;
    `;

    startSpan.style.cssText =
      chipStyle +
      `
      background: ${this.options.startColor ? this.options.startColor + '20' : '#e3f2fd'};
      color: ${this.options.startColor ?? '#1976d2'};
      border: 1px solid ${this.options.startColor ?? '#1976d2'};
    `;

    endSpan.style.cssText =
      chipStyle +
      `
      background: ${this.options.endColor ? this.options.endColor + '20' : '#f3e5f5'};
      color: ${this.options.endColor ?? '#7b1fa2'};
      border: 1px solid ${this.options.endColor ?? '#7b1fa2'};
    `;
  }

  /**
   * Create calendar icon element
   */
  private createCalendarIcon(): HTMLElement {
    const icon = document.createElement('span');
    icon.className = 'zg-date-range-calendar-icon';
    icon.innerHTML = '📅';
    icon.setAttribute('aria-hidden', 'true');
    icon.style.marginLeft = '6px';
    return icon;
  }

  /**
   * Set ARIA attributes for accessibility
   */
  private setAriaAttributes(element: HTMLElement, range: DateRange, params: RenderParams): void {
    element.setAttribute('role', 'text');

    const fieldLabel = params.column?.header || params.column?.field || 'Date Range';

    if (range.start && range.end) {
      const startFormat = range.start.toLocaleDateString(this.options.locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: this.options.timeZone,
      });
      const endFormat = range.end.toLocaleDateString(this.options.locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: this.options.timeZone,
      });
      const duration = this.calculateDuration(range.start, range.end);
      element.setAttribute(
        'aria-label',
        `${fieldLabel}: From ${startFormat} to ${endFormat}, ${duration} day${duration !== 1 ? 's' : ''}`
      );
    } else if (range.start) {
      const startFormat = range.start.toLocaleDateString(this.options.locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: this.options.timeZone,
      });
      element.setAttribute('aria-label', `${fieldLabel}: Start date ${startFormat}, no end date`);
    } else if (range.end) {
      const endFormat = range.end.toLocaleDateString(this.options.locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: this.options.timeZone,
      });
      element.setAttribute('aria-label', `${fieldLabel}: End date ${endFormat}, no start date`);
    } else {
      element.setAttribute('aria-label', `${fieldLabel}: Empty date range`);
    }
  }
}

/**
 * Factory function to create DateRangeRenderer
 */
export function createDateRangeRenderer(options: DateRangeRendererOptions = {}): DateRangeRenderer {
  return new DateRangeRenderer(options);
}
