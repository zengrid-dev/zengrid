/**
 * DatePickerRenderer Types
 */

import type { RenderParams } from '../../renderer.interface';
import type { DatetimeTheme } from '../../../../datetime-core';

/**
 * Configuration options for DatePickerRenderer
 */
export interface DatePickerRendererOptions {
  /** Date format for display (default: 'DD/MM/YYYY') */
  format?: string;
  /** Minimum selectable date */
  minDate?: Date | string;
  /** Maximum selectable date */
  maxDate?: Date | string;
  /** Placeholder text when no date is selected */
  placeholder?: string;
  /** Custom CSS class for the date picker */
  className?: string;
  /** Theme (default: 'light') */
  theme?: DatetimeTheme;
  /** Callback when date changes */
  onChange?: (value: Date | null, params: RenderParams) => void;
  /** Custom validator function */
  validator?: (value: Date | null) => boolean | string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Close popup when scrolling (default: true) */
  closeOnScroll?: boolean;
  /** Close popup when clicking outside (default: true) */
  closeOnClickOutside?: boolean;
  /** Popup z-index (default: 9999) */
  zIndex?: number;
}

/**
 * Resolved options with all defaults applied
 */
export interface ResolvedDatePickerOptions {
  format: string;
  minDate: Date | null;
  maxDate: Date | null;
  placeholder: string;
  className: string;
  theme: DatetimeTheme;
  disabled: boolean;
  closeOnScroll: boolean;
  closeOnClickOutside: boolean;
  zIndex: number;
  onChange?: (value: Date | null, params: RenderParams) => void;
  validator?: (value: Date | null) => boolean | string;
}

/**
 * Internal state for a date picker instance
 */
export interface DatePickerInstance {
  container: HTMLElement;
  trigger: HTMLElement;
  popup: HTMLElement;
  calendarWrapper: HTMLElement;
  calendar: any | null;
  currentValue: Date | null;
  params: RenderParams;
  isDestroyed: boolean;
  cleanup: (() => void) | null;
}
