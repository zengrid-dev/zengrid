import type { EditorParams } from './cell-editor.interface';

/**
 * Configuration options for VanillaDateEditor
 */
export interface VanillaDateEditorOptions {
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
  validator?: (value: Date | null) => boolean | string;
  /** Commit on blur (default: true) */
  stopOnBlur?: boolean;
  /** Calendar theme */
  theme?: 'light' | 'dark';
}

/**
 * Internal editor state
 */
export interface DateEditorState {
  inputElement: HTMLInputElement | null;
  calendarWrapper: HTMLDivElement | null;
  calendar: any;
  params: EditorParams | null;
  initialValue: Date | null;
  currentValue: Date | null;
  scrollHandler: (() => void) | null;
  resizeHandler: (() => void) | null;
}
