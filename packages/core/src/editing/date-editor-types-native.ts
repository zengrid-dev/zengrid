/**
 * Supported date format patterns for input/output
 */
export type DateFormat =
  | 'MM/DD/YYYY'
  | 'DD/MM/YYYY'
  | 'YYYY-MM-DD'
  | 'DD-MM-YYYY'
  | 'MM-DD-YYYY'
  | 'YYYY/MM/DD';

/**
 * Configuration options for DateEditor
 */
export interface DateEditorOptions {
  /** Date format pattern (default: 'YYYY-MM-DD' for HTML5 input) */
  format?: DateFormat;
  /** Minimum allowed date */
  minDate?: Date | string;
  /** Maximum allowed date */
  maxDate?: Date | string;
  /** Use native HTML5 date picker (default: true) */
  useNativePicker?: boolean;
  /** Input type for native picker (date, datetime-local, time) */
  type?: 'date' | 'datetime-local' | 'time';
  /** Placeholder text */
  placeholder?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Custom CSS class for the input element */
  className?: string;
  /** Auto-focus on init (default: true) */
  autoFocus?: boolean;
  /** Select all text on focus (default: false) */
  selectAllOnFocus?: boolean;
  /** Custom validator function */
  validator?: (value: Date | null) => boolean | string;
  /** Commit on blur (default: true) */
  stopOnBlur?: boolean;
}
