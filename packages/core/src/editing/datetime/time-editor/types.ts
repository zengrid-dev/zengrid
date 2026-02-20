/**
 * TimeEditor Types
 */

import type { DatetimeTheme } from '../../../datetime-core';

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
 * Configuration options for TimeEditor
 */
export interface TimeEditorOptions {
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
  /** Auto-focus on init (default: true) */
  autoFocus?: boolean;
  /** Whether field is required */
  required?: boolean;
  /** Custom validator function */
  validator?: (value: TimeValue | null) => boolean | string;
  /** Commit on blur (default: true) */
  commitOnBlur?: boolean;
  /** Minimum time (HH:mm format) */
  minTime?: string;
  /** Maximum time (HH:mm format) */
  maxTime?: string;
}

/**
 * Resolved options with all defaults applied
 */
export interface ResolvedTimeEditorOptions {
  format: TimeFormat;
  showSeconds: boolean;
  minuteStep: number;
  placeholder: string;
  className: string;
  theme: DatetimeTheme;
  autoFocus: boolean;
  required: boolean;
  commitOnBlur: boolean;
  minTime: string | null;
  maxTime: string | null;
  validator?: (value: TimeValue | null) => boolean | string;
}
