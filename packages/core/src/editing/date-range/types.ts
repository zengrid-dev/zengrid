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
  /** Custom CSS class for the calendar wrapper */
  className?: string;
  /** Auto-focus on init (default: true) */
  autoFocus?: boolean;
  /** Custom validator function */
  validator?: (value: DateRange) => boolean | string;
  /** Commit on blur (default: true) */
  stopOnBlur?: boolean;
  /** Calendar theme */
  theme?: 'light' | 'dark';
  /** Allow same start and end date (default: true) */
  allowSameDate?: boolean;
}

/**
 * Normalized options with defaults applied
 */
export type DateRangeEditorNormalizedOptions = Required<
  Omit<DateRangeEditorOptions, 'validator'>
> & {
  validator?: (value: DateRange) => boolean | string;
};
