import type { Comparator } from '../../types/common';
import type { Run, TimsortState } from './timsort.interface';
import { MIN_MERGE } from './timsort.interface';

/**
 * Count length of run starting at lo and reverse if descending
 * Returns length of run (at least 2 if array has 2+ elements)
 */
export function countRunAndMakeAscending<T>(
  array: T[],
  lo: number,
  comparator: Comparator<T>
): number {
  const n = array.length;

  if (lo + 1 >= n) {
    return 1;
  }

  let runHi = lo + 1;

  // Check if descending
  if (comparator(array[runHi], array[lo]) < 0) {
    // Descending run - find end and reverse
    runHi++;
    while (runHi < n && comparator(array[runHi], array[runHi - 1]) < 0) {
      runHi++;
    }
    reverseRange(array, lo, runHi);
  } else {
    // Ascending run - find end
    while (runHi < n && comparator(array[runHi], array[runHi - 1]) >= 0) {
      runHi++;
    }
  }

  return runHi - lo;
}

/**
 * Reverse array[lo:hi]
 */
export function reverseRange<T>(array: T[], lo: number, hi: number): void {
  hi--;
  while (lo < hi) {
    const temp = array[lo];
    array[lo++] = array[hi];
    array[hi--] = temp;
  }
}

/**
 * Binary insertion sort - more efficient than regular insertion sort
 * Sorts array[lo:hi] where array[lo:start] is already sorted
 */
export function binaryInsertionSort<T>(
  array: T[],
  lo: number,
  hi: number,
  start: number,
  comparator: Comparator<T>
): void {
  if (start === lo) {
    start++;
  }

  for (; start < hi; start++) {
    const pivot = array[start];

    // Binary search to find insertion point
    let left = lo;
    let right = start;

    while (left < right) {
      const mid = (left + right) >>> 1;
      if (comparator(pivot, array[mid]) < 0) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }

    // Shift elements and insert
    const n = start - left;
    if (n > 0) {
      for (let i = start; i > left; i--) {
        array[i] = array[i - 1];
      }
      array[left] = pivot;
    }
  }
}

/**
 * Compute optimal minRun value
 * Returns a value in range [32, 64] such that n/minRun is close to a power of 2
 */
export function computeMinRun(n: number): number {
  let r = 0;

  while (n >= MIN_MERGE) {
    r |= n & 1;
    n >>= 1;
  }

  return n + r;
}

/**
 * Push a run onto the pending-run stack
 */
export function pushRun(runStack: Run[], runBase: number, runLen: number): void {
  runStack.push({ start: runBase, length: runLen });
}

/**
 * Merge runs to maintain stack invariants
 *
 * Invariants (from Python's timsort):
 * 1. runLen[i - 2] > runLen[i - 1] + runLen[i]
 * 2. runLen[i - 1] > runLen[i]
 */
export function mergeCollapse<T>(
  state: TimsortState<T>,
  mergeAtFn: (state: TimsortState<T>, i: number) => void
): void {
  while (state.runStack.length > 1) {
    let n = state.runStack.length - 2;

    if (
      (n > 0 && state.runStack[n - 1].length <= state.runStack[n].length + state.runStack[n + 1].length) ||
      (n > 1 && state.runStack[n - 2].length <= state.runStack[n - 1].length + state.runStack[n].length)
    ) {
      // Merge the smaller of the two pairs
      if (state.runStack[n - 1].length < state.runStack[n + 1].length) {
        n--;
      }
      mergeAtFn(state, n);
    } else if (state.runStack[n].length <= state.runStack[n + 1].length) {
      mergeAtFn(state, n);
    } else {
      break; // Invariants are satisfied
    }
  }
}

/**
 * Force merge all runs on the stack
 */
export function mergeForceCollapse<T>(
  state: TimsortState<T>,
  mergeAtFn: (state: TimsortState<T>, i: number) => void
): void {
  while (state.runStack.length > 1) {
    let n = state.runStack.length - 2;

    if (n > 0 && state.runStack[n - 1].length < state.runStack[n + 1].length) {
      n--;
    }

    mergeAtFn(state, n);
  }
}
