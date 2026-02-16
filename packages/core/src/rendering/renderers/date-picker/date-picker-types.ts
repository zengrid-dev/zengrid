import type { RenderParams } from '../renderer.interface';

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
  /** Theme for vanilla-calendar-pro */
  theme?: 'light' | 'dark';
  /** Callback when date changes */
  onChange?: (value: Date | null, params: RenderParams) => void;
  /** Custom validator function */
  validator?: (value: Date | null) => boolean | string;
  /** Whether the picker is disabled */
  disabled?: boolean;
}

/**
 * Internal state for a date picker instance
 */
export interface DatePickerInstance {
  trigger: HTMLElement;
  popup: HTMLElement;
  calendar: any;
  currentValue: Date | null;
  isDestroyed: boolean;
}
