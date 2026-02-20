/**
 * Clean wrapper for vanilla-calendar-pro
 *
 * Provides a consistent API and handles integration with ZenGrid's
 * popup management and theming system.
 */

// Type declarations for vanilla-calendar-pro
interface VanillaCalendarConfig {
  input?: boolean;
  type?: 'default' | 'multiple' | 'range';
  actions?: {
    clickDay?: (e: Event, self: any) => void;
  };
  settings?: {
    visibility?: {
      theme?: 'light' | 'dark' | 'system';
    };
    range?: {
      disablePast?: boolean;
      min?: string;
      max?: string;
    };
    selected?: {
      dates?: string[];
      month?: number;
      year?: number;
    };
  };
}

interface VanillaCalendarInstance {
  init: () => void;
  update: (config?: Partial<VanillaCalendarConfig>) => void;
  destroy: () => void;
  HTMLElement: HTMLElement;
}

export interface CalendarOptions {
  /** Calendar type */
  type?: 'single' | 'multiple' | 'range';
  /** Theme */
  theme?: 'light' | 'dark' | 'auto';
  /** Minimum selectable date */
  minDate?: Date | string;
  /** Maximum selectable date */
  maxDate?: Date | string;
  /** Initially selected date(s) */
  selectedDates?: Date[];
  /** Callback when date is selected */
  onSelect?: (dates: Date[]) => void;
  /** Callback when range is selected (for range type) */
  onRangeSelect?: (start: Date | null, end: Date | null) => void;
  /** Whether to disable past dates */
  disablePast?: boolean;
  /** First day of week (0 = Sunday, 1 = Monday) */
  firstDayOfWeek?: 0 | 1;
}

/**
 * Format a Date to YYYY-MM-DD for vanilla-calendar-pro
 */
export function formatDateForCalendar(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string to Date
 */
export function parseCalendarDate(dateStr: string): Date | null {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;

  return date;
}

/**
 * Adapter for vanilla-calendar-pro
 */
export class VanillaCalendarAdapter {
  private container: HTMLElement;
  private options: CalendarOptions;
  private calendar: VanillaCalendarInstance | null = null;
  private VanillaCalendar: any = null;

  constructor(container: HTMLElement, options: CalendarOptions = {}) {
    this.container = container;
    this.options = options;
  }

  /**
   * Initialize the calendar
   */
  async init(): Promise<void> {
    // Dynamically import vanilla-calendar-pro
    try {
      const module = await import('vanilla-calendar-pro');
      // vanilla-calendar-pro exports { Calendar } or has Calendar as default
      this.VanillaCalendar = module.Calendar || module.default;
    } catch (error) {
      console.error('Failed to load vanilla-calendar-pro:', error);
      throw new Error('vanilla-calendar-pro is required but failed to load');
    }

    if (!this.VanillaCalendar) {
      throw new Error('Failed to load vanilla-calendar-pro Calendar class');
    }

    const config = this.buildConfig();
    this.calendar = new this.VanillaCalendar(this.container, config);
    this.calendar!.init();
  }

  /**
   * Initialize synchronously (assumes vanilla-calendar-pro is already loaded)
   */
  initSync(VanillaCalendar: any): void {
    this.VanillaCalendar = VanillaCalendar;
    const config = this.buildConfig();
    this.calendar = new this.VanillaCalendar(this.container, config);
    this.calendar!.init();
  }

  /**
   * Build configuration for vanilla-calendar-pro
   */
  private buildConfig(): VanillaCalendarConfig {
    const { type, theme, minDate, maxDate, selectedDates, disablePast, onSelect, onRangeSelect } = this.options;

    const config: VanillaCalendarConfig = {
      input: false,
      type: type === 'range' ? 'range' : type === 'multiple' ? 'multiple' : 'default',
      settings: {
        visibility: {
          theme: theme === 'auto' ? 'system' : theme || 'light',
        },
        range: {},
        selected: {},
      },
      actions: {},
    };

    // Date constraints
    if (minDate) {
      config.settings!.range!.min = minDate instanceof Date ? formatDateForCalendar(minDate) : minDate;
    }
    if (maxDate) {
      config.settings!.range!.max = maxDate instanceof Date ? formatDateForCalendar(maxDate) : maxDate;
    }
    if (disablePast) {
      config.settings!.range!.disablePast = true;
    }

    // Selected dates
    if (selectedDates && selectedDates.length > 0) {
      config.settings!.selected!.dates = selectedDates.map(formatDateForCalendar);
      const firstDate = selectedDates[0];
      config.settings!.selected!.month = firstDate.getMonth();
      config.settings!.selected!.year = firstDate.getFullYear();
    }

    // Date selection handler
    config.actions!.clickDay = (_e: Event, self: any) => {
      if (type === 'range') {
        // Handle range selection
        const selectedDates = self.selectedDates || [];
        if (selectedDates.length === 2) {
          const start = parseCalendarDate(selectedDates[0]);
          const end = parseCalendarDate(selectedDates[1]);
          onRangeSelect?.(start, end);
        } else if (selectedDates.length === 1) {
          const start = parseCalendarDate(selectedDates[0]);
          onRangeSelect?.(start, null);
        }
      } else {
        // Handle single/multiple selection
        const selectedDates = self.selectedDates || [];
        const dates = selectedDates
          .map((d: string) => parseCalendarDate(d))
          .filter((d: Date | null): d is Date => d !== null);
        onSelect?.(dates);
      }
    };

    return config;
  }

  /**
   * Update calendar configuration
   */
  update(options: Partial<CalendarOptions>): void {
    this.options = { ...this.options, ...options };

    if (this.calendar) {
      const config = this.buildConfig();
      this.calendar.update(config);
    }
  }

  /**
   * Set selected dates
   */
  setSelectedDates(dates: Date[]): void {
    if (!this.calendar) return;

    this.calendar.update({
      settings: {
        selected: {
          dates: dates.map(formatDateForCalendar),
        },
      },
    });
  }

  /**
   * Navigate to a specific month/year
   */
  navigateTo(year: number, month: number): void {
    if (!this.calendar) return;

    this.calendar.update({
      settings: {
        selected: {
          year,
          month,
        },
      },
    });
  }

  /**
   * Get the calendar container element
   */
  getElement(): HTMLElement {
    return this.container;
  }

  /**
   * Get the vanilla-calendar instance
   */
  getInstance(): VanillaCalendarInstance | null {
    return this.calendar;
  }

  /**
   * Destroy the calendar
   */
  destroy(): void {
    if (this.calendar) {
      this.calendar.destroy();
      this.calendar = null;
    }
    this.container.innerHTML = '';
  }
}

/**
 * Create a calendar instance
 */
export function createCalendar(
  container: HTMLElement,
  options: CalendarOptions = {}
): VanillaCalendarAdapter {
  return new VanillaCalendarAdapter(container, options);
}
