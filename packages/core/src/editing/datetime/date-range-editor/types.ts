/**
 * DateRangeEditor Types
 */

import type { DatetimeTheme } from '../../../datetime-core';

/**
 * Date range value type
 */
export interface DateRange {
  start: Date | null;
  end: Date | null;
}

/**
 * Configuration options for DateRangeEditor
 */
export interface DateRangeEditorOptions {
  /** Date format for display (default: 'DD/MM/YYYY') */
  format?: string;
  /** Minimum allowed date */
  minDate?: Date | string;
  /** Maximum allowed date */
  maxDate?: Date | string;
  /** Whether the field is required */
  required?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Custom CSS class */
  className?: string;
  /** Theme (default: 'light') */
  theme?: DatetimeTheme;
  /** Auto-focus on init (default: true) */
  autoFocus?: boolean;
  /** Custom validator function */
  validator?: (value: DateRange) => boolean | string;
  /** Allow same start and end date (default: true) */
  allowSameDate?: boolean;
  /** Close popup when scrolling (default: true) */
  closeOnScroll?: boolean;
  /** Separator between dates in display (default: ' - ') */
  separator?: string;
}

/**
 * Resolved options with all defaults applied
 */
export interface ResolvedDateRangeEditorOptions {
  format: string;
  minDate: Date | null;
  maxDate: Date | null;
  required: boolean;
  placeholder: string;
  className: string;
  theme: DatetimeTheme;
  autoFocus: boolean;
  allowSameDate: boolean;
  closeOnScroll: boolean;
  separator: string;
  validator?: (value: DateRange) => boolean | string;
}
