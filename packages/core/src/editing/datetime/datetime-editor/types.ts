/**
 * DateTimeEditor Types
 */

import type { DatetimeTheme } from '../../../datetime-core';

/**
 * Time format mode
 */
export type TimeFormat = '12h' | '24h';

/**
 * Configuration options for DateTimeEditor
 */
export interface DateTimeEditorOptions {
  /** Date format (default: 'DD/MM/YYYY') */
  dateFormat?: string;
  /** Time format (default: '24h') */
  timeFormat?: TimeFormat;
  /** Show seconds (default: false) */
  showSeconds?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Custom CSS class */
  className?: string;
  /** Theme (default: 'light') */
  theme?: DatetimeTheme;
  /** Auto-focus on init (default: true) */
  autoFocus?: boolean;
  /** Whether field is required */
  required?: boolean;
  /** Minimum date */
  minDate?: Date | string;
  /** Maximum date */
  maxDate?: Date | string;
  /** Custom validator function */
  validator?: (value: Date | null) => boolean | string;
  /** Commit on blur (default: true) */
  commitOnBlur?: boolean;
  /** Close popup when scrolling (default: true) */
  closeOnScroll?: boolean;
}

/**
 * Resolved options with all defaults applied
 */
export interface ResolvedDateTimeEditorOptions {
  dateFormat: string;
  timeFormat: TimeFormat;
  showSeconds: boolean;
  placeholder: string;
  className: string;
  theme: DatetimeTheme;
  autoFocus: boolean;
  required: boolean;
  minDate: Date | null;
  maxDate: Date | null;
  commitOnBlur: boolean;
  closeOnScroll: boolean;
  validator?: (value: Date | null) => boolean | string;
}
