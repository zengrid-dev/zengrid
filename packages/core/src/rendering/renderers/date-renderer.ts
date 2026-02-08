import type { CellRenderer, RenderParams } from './renderer.interface';
import { SimpleLRUCache } from './renderer-utils';

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
  | 'locale'; // Use browser locale

/**
 * Configuration options for DateRenderer
 */
export interface DateRendererOptions {
  /** Date format pattern (default: 'MM/DD/YYYY') */
  format?: DateFormat;
  /** Locale string for date formatting (e.g., 'en-US', 'de-DE') */
  locale?: string;
  /** Minimum allowed date */
  minDate?: Date;
  /** Maximum allowed date */
  maxDate?: Date;
  /** Show calendar icon */
  showCalendar?: boolean;
  /** Custom CSS class for the date element */
  className?: string;
  /** Display format for invalid dates */
  invalidDateText?: string;
  /** Display format for null/undefined values */
  emptyDateText?: string;
  /** Time zone for date formatting */
  timeZone?: string;
  /** Callback when date is clicked */
  onClick?: (date: Date | null, params: RenderParams) => void;
}

/**
 * DateRenderer - Renders formatted dates with locale support
 *
 * Features:
 * - Multiple date format patterns (MM/DD/YYYY, DD/MM/YYYY, etc.)
 * - Locale-aware formatting using Intl.DateTimeFormat
 * - Min/max date validation with visual indicators
 * - LRU cache for formatters and formatted strings (performance optimization)
 * - Time zone support
 * - Calendar icon (optional)
 * - ARIA attributes for accessibility
 * - Invalid date handling
 * - Out-of-range date highlighting
 *
 * Performance: Uses dual LRU cache system to avoid re-formatting the same dates
 * - formatterCache: Caches Intl.DateTimeFormat instances (50 items)
 * - dateStringCache: Caches formatted date strings (500 items)
 *
 * @example
 * ```typescript
 * // Basic usage
 * const renderer = new DateRenderer({
 *   format: 'MM/DD/YYYY',
 *   locale: 'en-US'
 * });
 *
 * // With date range validation
 * const renderer = new DateRenderer({
 *   format: 'DD/MM/YYYY',
 *   locale: 'en-GB',
 *   minDate: new Date('2020-01-01'),
 *   maxDate: new Date('2030-12-31')
 * });
 *
 * // With locale formatting and timezone
 * const renderer = new DateRenderer({
 *   format: 'locale',
 *   locale: 'de-DE',
 *   timeZone: 'Europe/Berlin',
 *   showCalendar: true
 * });
 * ```
 */
export class DateRenderer implements CellRenderer {
  private options: Required<Omit<DateRendererOptions, 'timeZone' | 'onClick'>> & {
    timeZone?: string;
    onClick?: (date: Date | null, params: RenderParams) => void;
  };
  private formatterCache: SimpleLRUCache<string, Intl.DateTimeFormat>;
  private dateStringCache: SimpleLRUCache<string, string>;
  private eventHandlers: Map<HTMLElement, (e: Event) => void>;

  /**
   * Creates a new DateRenderer instance
   *
   * Uses LRUCache for caching Intl.DateTimeFormat instances and formatted strings
   * This significantly improves performance when rendering many dates
   */
  constructor(options: DateRendererOptions = {}) {
    this.options = {
      format: options.format ?? 'MM/DD/YYYY',
      locale: options.locale ?? 'en-US',
      minDate: options.minDate ?? new Date('1900-01-01'),
      maxDate: options.maxDate ?? new Date('2100-12-31'),
      showCalendar: options.showCalendar ?? false,
      className: options.className ?? 'zg-date',
      invalidDateText: options.invalidDateText ?? 'Invalid Date',
      emptyDateText: options.emptyDateText ?? '',
      timeZone: options.timeZone,
      onClick: options.onClick,
    };

    // Cache for Intl.DateTimeFormat instances (locale-specific formatters)
    this.formatterCache = new SimpleLRUCache<string, Intl.DateTimeFormat>(50);

    // Cache for formatted date strings
    this.dateStringCache = new SimpleLRUCache<string, string>(500);

    // Track event handlers for cleanup
    this.eventHandlers = new Map();
  }

  /**
   * Initial render - creates date display structure
   */
  render(element: HTMLElement, params: RenderParams): void {
    element.classList.add('zg-cell-date');

    // Create date container
    const container = document.createElement('div');
    container.className = `zg-date-wrapper ${this.options.className}`;

    // Create date text span
    const textSpan = document.createElement('span');
    textSpan.className = 'zg-date-text';
    container.appendChild(textSpan);

    // Optionally add calendar icon
    if (this.options.showCalendar) {
      const calendarIcon = this.createCalendarIcon();
      container.appendChild(calendarIcon);
    }

    element.appendChild(container);

    // Add click handler if provided
    if (this.options.onClick) {
      const handler = (e: Event) => {
        e.stopPropagation();
        const date = this.parseDate(params.value);
        this.options.onClick!(date, params);
      };
      container.addEventListener('click', handler);
      this.eventHandlers.set(element, handler);
      container.style.cursor = 'pointer';
    }

    // Set initial state via update()
    this.update(element, params);
  }

  /**
   * Update existing date - called on value/state changes
   * Optimized for performance during scrolling
   */
  update(element: HTMLElement, params: RenderParams): void {
    const container = element.querySelector('.zg-date-wrapper') as HTMLElement;
    if (!container) return;

    const textSpan = container.querySelector('.zg-date-text') as HTMLSpanElement;
    if (!textSpan) return;

    // Parse date value
    const date = this.parseDate(params.value);

    // Format date text
    const dateText = this.formatDate(date);
    textSpan.textContent = dateText;

    // Update validation classes
    const isOutOfRange = date !== null && !this.isDateInRange(date);
    if (isOutOfRange) {
      container.classList.add('zg-date-out-of-range');
      textSpan.setAttribute('aria-invalid', 'true');
    } else {
      container.classList.remove('zg-date-out-of-range');
      textSpan.removeAttribute('aria-invalid');
    }

    // Set ARIA attributes
    this.setAriaAttributes(textSpan, date, params);

    // Set data attributes for testing/debugging
    // WARNING: data-row/col must ONLY be on .zg-cell elements (set by CellPositioner)
    if (params.column?.field) {
      container.dataset.field = params.column.field;
    }
    if (date) {
      container.dataset.date = date.toISOString();
    } else {
      delete container.dataset.date;
    }
  }

  /**
   * Cleanup before element returns to pool
   */
  destroy(element: HTMLElement): void {
    // Remove event listener
    const handler = this.eventHandlers.get(element);
    if (handler) {
      const container = element.querySelector('.zg-date-wrapper');
      if (container) {
        container.removeEventListener('click', handler);
      }
      this.eventHandlers.delete(element);
    }

    // Clear content and remove classes
    element.innerHTML = '';
    element.classList.remove('zg-cell-date');
  }

  /**
   * Optional: Return CSS class based on date validity
   */
  getCellClass(params: RenderParams): string | undefined {
    const date = this.parseDate(params.value);

    if (date === null) {
      return 'zg-date-empty';
    }

    if (!this.isDateInRange(date)) {
      return 'zg-date-invalid';
    }

    return undefined;
  }

  /**
   * Parse value into a Date object
   */
  private parseDate(value: any): Date | null {
    if (value === null || value === undefined) {
      return null;
    }

    // Already a Date object
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }

    // String or number
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  /**
   * Format date according to the configured format and locale
   *
   * Uses LRU cache to avoid re-formatting the same dates
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
   * Check if date is within the configured min/max range
   */
  private isDateInRange(date: Date): boolean {
    const timestamp = date.getTime();
    const minTimestamp = this.options.minDate.getTime();
    const maxTimestamp = this.options.maxDate.getTime();

    return timestamp >= minTimestamp && timestamp <= maxTimestamp;
  }

  /**
   * Create calendar icon element
   */
  private createCalendarIcon(): HTMLElement {
    const icon = document.createElement('span');
    icon.className = 'zg-date-calendar-icon';
    icon.innerHTML = '📅'; // Simple emoji icon (can be replaced with SVG)
    icon.setAttribute('aria-hidden', 'true');
    return icon;
  }

  /**
   * Set ARIA attributes for accessibility
   */
  private setAriaAttributes(
    element: HTMLElement,
    date: Date | null,
    params: RenderParams
  ): void {
    element.setAttribute('role', 'text');

    // Add label for screen readers
    const fieldLabel = params.column?.header || params.column?.field || 'Date';

    if (date) {
      const longFormat = date.toLocaleDateString(this.options.locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: this.options.timeZone,
      });
      element.setAttribute('aria-label', `${fieldLabel}: ${longFormat}`);
    } else {
      element.setAttribute('aria-label', `${fieldLabel}: Empty date`);
    }
  }
}

/**
 * Factory function to create DateRenderer
 *
 * @example
 * ```typescript
 * // In column definition
 * const column = {
 *   field: 'createdAt',
 *   header: 'Created Date',
 *   renderer: 'date', // Registered name
 * };
 *
 * // Or create directly
 * const renderer = createDateRenderer({
 *   format: 'DD/MM/YYYY',
 *   locale: 'en-GB',
 *   minDate: new Date('2020-01-01'),
 *   maxDate: new Date('2030-12-31')
 * });
 * ```
 */
export function createDateRenderer(
  options: DateRendererOptions = {}
): DateRenderer {
  return new DateRenderer(options);
}
