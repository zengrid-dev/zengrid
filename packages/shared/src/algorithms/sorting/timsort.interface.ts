import type { Comparator } from '../../types/common';

/**
 * Minimum gallop threshold
 * How many times one run must "win" before we switch to galloping mode
 *
 * JavaScript Note: Set higher than Python's default (7) due to function call overhead.
 * Galloping mode has more overhead in JS, so we require more consecutive wins
 * to justify entering gallop mode.
 */
export const MIN_GALLOP = 32;

/**
 * Minimum merge threshold for stack invariants
 */
export const MIN_MERGE = 32;

/**
 * Run represents a sorted sequence in the array
 */
export interface Run {
  start: number;
  length: number;
}

/**
 * Internal state shared across Timsort modules
 */
export interface TimsortState<T> {
  array: T[];
  comparator: Comparator<T>;
  minGallop: number;
  runStack: Run[];
  tmp: T[];
}
