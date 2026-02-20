/**
 * DateEditor Types
 */

import type { DatetimeTheme } from '../../../datetime-core';

/**
 * Input type for date editor
 */
export type DateInputType = 'date' | 'datetime-local' | 'time';

/**
 * Configuration options for DateEditor
 */
export interface DateEditorOptions {
  /** Date format for display (default: 'DD/MM/YYYY') */
  format?: string;
  /** Input type (default: 'date') */
  type?: DateInputType;
  /** Minimum selectable date */
  minDate?: Date | string;
  /** Maximum selectable date */
  maxDate?: Date | string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether field is required */
  required?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Theme (default: 'light') */
  theme?: DatetimeTheme;
  /** Auto-focus on init (default: true) */
  autoFocus?: boolean;
  /** Use calendar popup vs native picker (default: true) */
  useCalendarPopup?: boolean;
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
export interface ResolvedDateEditorOptions {
  format: string;
  type: DateInputType;
  minDate: Date | null;
  maxDate: Date | null;
  placeholder: string;
  required: boolean;
  className: string;
  theme: DatetimeTheme;
  autoFocus: boolean;
  useCalendarPopup: boolean;
  commitOnBlur: boolean;
  closeOnScroll: boolean;
  validator?: (value: Date | null) => boolean | string;
}
