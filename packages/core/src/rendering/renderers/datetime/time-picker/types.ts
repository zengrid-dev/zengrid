/**
 * TimePickerRenderer Types
 */

import type { RenderParams } from '../../renderer.interface';
import type { DatetimeTheme } from '../../../../datetime-core';

/**
 * Time format mode
 */
export type TimeFormat = '12h' | '24h';

/**
 * Time value structure
 */
export interface TimeValue {
  hours: number;
  minutes: number;
  seconds?: number;
}

/**
 * Configuration options for TimePickerRenderer
 */
export interface TimePickerRendererOptions {
  /** Time format (default: '24h') */
  format?: TimeFormat;
  /** Show seconds (default: false) */
  showSeconds?: boolean;
  /** Minute step/interval (default: 1) */
  minuteStep?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Custom CSS class */
  className?: string;
  /** Theme (default: 'light') */
  theme?: DatetimeTheme;
  /** Callback when time changes */
  onChange?: (value: TimeValue | null, params: RenderParams) => void;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Minimum time (HH:mm format) */
  minTime?: string;
  /** Maximum time (HH:mm format) */
  maxTime?: string;
}

/**
 * Resolved options with all defaults applied
 */
export interface ResolvedTimePickerOptions {
  format: TimeFormat;
  showSeconds: boolean;
  minuteStep: number;
  placeholder: string;
  className: string;
  theme: DatetimeTheme;
  disabled: boolean;
  minTime: string | null;
  maxTime: string | null;
  onChange?: (value: TimeValue | null, params: RenderParams) => void;
}
