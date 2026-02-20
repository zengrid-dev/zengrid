/**
 * DateTimePickerRenderer Types
 */

import type { RenderParams } from '../../renderer.interface';
import type { DatetimeTheme } from '../../../../datetime-core';

/**
 * Time format mode
 */
export type TimeFormat = '12h' | '24h';

/**
 * Configuration options for DateTimePickerRenderer
 */
export interface DateTimePickerRendererOptions {
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
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Minimum date */
  minDate?: Date | string;
  /** Maximum date */
  maxDate?: Date | string;
  /** Callback when datetime changes */
  onChange?: (value: Date | null, params: RenderParams) => void;
  /** Close popup when scrolling (default: true) */
  closeOnScroll?: boolean;
}

/**
 * Resolved options with all defaults applied
 */
export interface ResolvedDateTimePickerOptions {
  dateFormat: string;
  timeFormat: TimeFormat;
  showSeconds: boolean;
  placeholder: string;
  className: string;
  theme: DatetimeTheme;
  disabled: boolean;
  minDate: Date | null;
  maxDate: Date | null;
  closeOnScroll: boolean;
  onChange?: (value: Date | null, params: RenderParams) => void;
}
