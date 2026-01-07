import type { TimsortState } from './timsort.interface';
import { MIN_GALLOP } from './timsort.interface';
import { gallopRight, gallopLeft, gallopRightInArray, gallopLeftInArray } from './timsort-gallop';

/**
 * Merge two adjacent runs with galloping optimization
 */
export function mergeRuns<T>(
  state: TimsortState<T>,
  base1: number,
  len1: number,
  base2: number,
  len2: number
): void {
  // Optimization: Find where first element of run2 goes in run1
  // Elements before that can be ignored
  const k = gallopRight(state.array[base2], state.array, base1, len1, 0, state.comparator);
  base1 += k;
  len1 -= k;

  if (len1 === 0) {
    return;
  }

  // Optimization: Find where last element of run1 goes in run2
  // Elements after that can be ignored
  len2 = gallopLeft(state.array[base1 + len1 - 1], state.array, base2, len2, len2 - 1, state.comparator);

  if (len2 === 0) {
    return;
  }

  // Merge remaining runs, using tmp array for smaller run
  if (len1 <= len2) {
    mergeLo(state, base1, len1, base2, len2);
  } else {
    mergeHi(state, base1, len1, base2, len2);
  }
}

/**
 * Merge with run1 in temporary array (run1 is smaller)
 */
function mergeLo<T>(
  state: TimsortState<T>,
  base1: number,
  len1: number,
  base2: number,
  len2: number
): void {
  const { array, tmp, comparator } = state;

  // Copy run1 to tmp
  for (let i = 0; i < len1; i++) {
    tmp[i] = array[base1 + i];
  }

  let cursor1 = 0;           // Index in tmp
  let cursor2 = base2;       // Index in array
  let dest = base1;          // Index in array

  // Move first element of run2
  array[dest++] = array[cursor2++];
  len2--;

  if (len2 === 0) {
    // Run2 exhausted, copy remaining tmp
    for (let i = 0; i < len1; i++) {
      array[dest + i] = tmp[cursor1 + i];
    }
    return;
  }

  if (len1 === 1) {
    // Run1 has single element, copy run2 then the element
    for (let i = 0; i < len2; i++) {
      array[dest + i] = array[cursor2 + i];
    }
    array[dest + len2] = tmp[cursor1];
    return;
  }

  let minGallop = state.minGallop;

  outer: while (true) {
    let count1 = 0; // Number of times run1 won in a row
    let count2 = 0; // Number of times run2 won in a row

    // Simple merge until one run starts "winning" consistently
    do {
      if (comparator(array[cursor2], tmp[cursor1]) < 0) {
        array[dest++] = array[cursor2++];
        count2++;
        count1 = 0;
        len2--;
        if (len2 === 0) break outer;
      } else {
        array[dest++] = tmp[cursor1++];
        count1++;
        count2 = 0;
        len1--;
        if (len1 === 1) break outer;
      }
    } while ((count1 | count2) < minGallop);

    // One run is winning consistently - switch to galloping mode
    do {
      count1 = gallopRightInArray(array[cursor2], tmp, cursor1, len1, 0, comparator);
      if (count1 !== 0) {
        for (let i = 0; i < count1; i++) {
          array[dest++] = tmp[cursor1++];
        }
        len1 -= count1;
        if (len1 <= 1) break outer;
      }
      array[dest++] = array[cursor2++];
      len2--;
      if (len2 === 0) break outer;

      count2 = gallopLeft(tmp[cursor1], array, cursor2, len2, 0, comparator);
      if (count2 !== 0) {
        for (let i = 0; i < count2; i++) {
          array[dest++] = array[cursor2++];
        }
        len2 -= count2;
        if (len2 === 0) break outer;
      }
      array[dest++] = tmp[cursor1++];
      len1--;
      if (len1 === 1) break outer;

      minGallop--;
    } while (count1 >= MIN_GALLOP || count2 >= MIN_GALLOP);

    if (minGallop < 0) minGallop = 0;
    minGallop += 2; // Penalize leaving gallop mode
  }

  state.minGallop = minGallop < 1 ? 1 : minGallop;

  // Handle remaining elements
  if (len1 === 1) {
    for (let i = 0; i < len2; i++) {
      array[dest + i] = array[cursor2 + i];
    }
    array[dest + len2] = tmp[cursor1];
  } else if (len1 > 0) {
    for (let i = 0; i < len1; i++) {
      array[dest + i] = tmp[cursor1 + i];
    }
  }
}

/**
 * Merge with run2 in temporary array (run2 is smaller)
 */
function mergeHi<T>(
  state: TimsortState<T>,
  base1: number,
  len1: number,
  base2: number,
  len2: number
): void {
  const { array, tmp, comparator } = state;

  // Copy run2 to tmp
  for (let i = 0; i < len2; i++) {
    tmp[i] = array[base2 + i];
  }

  let cursor1 = base1 + len1 - 1;  // Index in array (run1, from end)
  let cursor2 = len2 - 1;          // Index in tmp (from end)
  let dest = base2 + len2 - 1;     // Index in array (from end)

  // Move last element of run1
  array[dest--] = array[cursor1--];
  len1--;

  if (len1 === 0) {
    // Run1 exhausted, copy remaining tmp
    for (let i = 0; i < len2; i++) {
      array[dest - len2 + 1 + i] = tmp[i];
    }
    return;
  }

  if (len2 === 1) {
    // Run2 has single element
    dest -= len1;
    cursor1 -= len1;
    for (let i = len1 - 1; i >= 0; i--) {
      array[dest + 1 + i] = array[cursor1 + 1 + i];
    }
    array[dest] = tmp[cursor2];
    return;
  }

  let minGallop = state.minGallop;

  outer: while (true) {
    let count1 = 0;
    let count2 = 0;

    do {
      if (comparator(tmp[cursor2], array[cursor1]) < 0) {
        array[dest--] = array[cursor1--];
        count1++;
        count2 = 0;
        len1--;
        if (len1 === 0) break outer;
      } else {
        array[dest--] = tmp[cursor2--];
        count2++;
        count1 = 0;
        len2--;
        if (len2 === 1) break outer;
      }
    } while ((count1 | count2) < minGallop);

    do {
      count1 = len1 - gallopRight(tmp[cursor2], array, base1, len1, cursor1 - base1, comparator);
      if (count1 !== 0) {
        dest -= count1;
        cursor1 -= count1;
        len1 -= count1;
        for (let i = count1 - 1; i >= 0; i--) {
          array[dest + 1 + i] = array[cursor1 + 1 + i];
        }
        if (len1 === 0) break outer;
      }
      array[dest--] = tmp[cursor2--];
      len2--;
      if (len2 === 1) break outer;

      count2 = len2 - gallopLeftInArray(array[cursor1], tmp, 0, len2, cursor2, comparator);
      if (count2 !== 0) {
        dest -= count2;
        cursor2 -= count2;
        len2 -= count2;
        for (let i = 0; i < count2; i++) {
          array[dest + 1 + i] = tmp[cursor2 + 1 + i];
        }
        if (len2 <= 1) break outer;
      }
      array[dest--] = array[cursor1--];
      len1--;
      if (len1 === 0) break outer;

      minGallop--;
    } while (count1 >= MIN_GALLOP || count2 >= MIN_GALLOP);

    if (minGallop < 0) minGallop = 0;
    minGallop += 2;
  }

  state.minGallop = minGallop < 1 ? 1 : minGallop;

  if (len2 === 1) {
    dest -= len1;
    cursor1 -= len1;
    for (let i = len1 - 1; i >= 0; i--) {
      array[dest + 1 + i] = array[cursor1 + 1 + i];
    }
    array[dest] = tmp[cursor2];
  } else if (len2 > 0) {
    for (let i = 0; i < len2; i++) {
      array[dest - len2 + 1 + i] = tmp[i];
    }
  }
}
