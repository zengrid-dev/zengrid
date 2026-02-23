import type { Comparator } from '../../types/common';
import type { TimsortOptions } from './sorting.interface';
import type { TimsortState } from './timsort.interface';
import {
  countRunAndMakeAscending,
  binaryInsertionSort,
  computeMinRun,
  pushRun,
  mergeCollapse,
  mergeForceCollapse,
} from './timsort-run';
import { mergeRuns } from './timsort-merge';

/**
 * Timsort - Production-grade stable O(n log n) sorting algorithm
 *
 * This is a full implementation of Timsort with all optimizations:
 * - Natural run detection (finds already-sorted sequences)
 * - Galloping mode (binary search optimization during merges)
 * - Stack-based merge strategy (maintains merge invariants)
 * - Reusable temporary buffer (reduces allocations)
 *
 * Used by Python, Java, and V8's Array.sort().
 *
 * @param array - Array to sort (modified in-place)
 * @param comparator - Comparison function
 * @param options - Timsort options
 * @returns The sorted array
 *
 * @complexity
 * - Time: O(n log n) worst case, O(n) best case (already sorted)
 * - Space: O(n) for temporary merge buffer
 */
export function timsort<T>(
  array: T[],
  comparator: Comparator<T>,
  options: TimsortOptions = {}
): T[] {
  const n = array.length;

  if (n < 2) {
    return array;
  }

  const sorter = new TimsortImpl(array, comparator, options);
  sorter.sort();
  return array;
}

/**
 * Sort indices based on values without modifying the values
 *
 * @param indices - Array of indices to sort
 * @param getValue - Function to get value at an index
 * @param comparator - Comparison function for values
 * @param options - Timsort options
 * @returns Sorted array of indices
 *
 * @example
 * ```typescript
 * const values = ['Charlie', 'Alice', 'Bob'];
 * const indices = [0, 1, 2];
 *
 * const sorted = timsortIndices(
 *   indices,
 *   (i) => values[i],
 *   (a, b) => a.localeCompare(b)
 * );
 * // sorted = [1, 2, 0] (Alice, Bob, Charlie)
 * ```
 */
export function timsortIndices<T>(
  indices: number[],
  getValue: (index: number) => T,
  comparator: Comparator<T>,
  options: TimsortOptions = {}
): number[] {
  // Create index comparator
  const indexComparator: Comparator<number> = (idxA, idxB) => {
    return comparator(getValue(idxA), getValue(idxB));
  };

  return timsort(indices, indexComparator, options);
}

/**
 * Check if an array is sorted
 *
 * @param array - Array to check
 * @param comparator - Comparison function
 * @returns True if sorted
 */
export function isSorted<T>(array: readonly T[], comparator: Comparator<T>): boolean {
  for (let i = 1; i < array.length; i++) {
    if (comparator(array[i - 1], array[i]) > 0) {
      return false;
    }
  }
  return true;
}

/**
 * TimsortImpl - Internal implementation class
 * Maintains state for the sorting process
 */
class TimsortImpl<T> {
  private state: TimsortState<T>;
  private readonly configuredMinRun?: number;

  constructor(array: T[], comparator: Comparator<T>, options: TimsortOptions) {
    this.configuredMinRun = options.minRun;

    // Initialize state
    this.state = {
      array,
      comparator,
      minGallop: 32, // MIN_GALLOP constant
      runStack: [],
      tmp: new Array(Math.floor(array.length / 2)),
    };
  }

  /**
   * Main sort entry point
   */
  sort(): void {
    const n = this.state.array.length;

    // Calculate optimal minRun (use configured value if provided)
    const minRun = this.configuredMinRun ?? computeMinRun(n);

    let lo = 0;

    // Identify and sort runs
    while (lo < n) {
      // Find next run (either ascending or descending)
      let runLen = countRunAndMakeAscending(this.state.array, lo, this.state.comparator);

      // If run is too short, extend it with insertion sort
      if (runLen < minRun) {
        const force = Math.min(n - lo, minRun);
        binaryInsertionSort(this.state.array, lo, lo + force, lo + runLen, this.state.comparator);
        runLen = force;
      }

      // Push run onto stack and maybe merge
      pushRun(this.state.runStack, lo, runLen);
      mergeCollapse(this.state, this.mergeAt.bind(this));

      lo += runLen;
    }

    // Force merge all remaining runs
    mergeForceCollapse(this.state, this.mergeAt.bind(this));
  }

  /**
   * Merge the two runs at stack indices i and i+1
   */
  private mergeAt(state: TimsortState<T>, i: number): void {
    const run1 = state.runStack[i];
    const run2 = state.runStack[i + 1];

    // Merge run1 with run2
    mergeRuns(state, run1.start, run1.length, run2.start, run2.length);

    // Update stack
    state.runStack[i] = { start: run1.start, length: run1.length + run2.length };
    state.runStack.splice(i + 1, 1);
  }
}
