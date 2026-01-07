import type { Comparator } from '../../types/common';

/**
 * Gallop right: Find position where key belongs in array[base:base+len]
 * Returns offset k where array[base+k-1] < key <= array[base+k]
 * Uses exponential search followed by binary search
 */
export function gallopRight<T>(
  key: T,
  array: T[],
  base: number,
  len: number,
  hint: number,
  comparator: Comparator<T>
): number {
  let lastOfs = 0;
  let ofs = 1;

  if (comparator(key, array[base + hint]) < 0) {
    // Gallop left until array[base+hint-ofs] < key <= array[base+hint-lastOfs]
    const maxOfs = hint + 1;
    while (ofs < maxOfs && comparator(key, array[base + hint - ofs]) < 0) {
      lastOfs = ofs;
      ofs = (ofs << 1) + 1;
      if (ofs <= 0) ofs = maxOfs; // Overflow
    }
    if (ofs > maxOfs) ofs = maxOfs;

    // Make offsets relative to base
    const tmp = lastOfs;
    lastOfs = hint - ofs;
    ofs = hint - tmp;
  } else {
    // Gallop right until array[base+hint+lastOfs] < key <= array[base+hint+ofs]
    const maxOfs = len - hint;
    while (ofs < maxOfs && comparator(key, array[base + hint + ofs]) >= 0) {
      lastOfs = ofs;
      ofs = (ofs << 1) + 1;
      if (ofs <= 0) ofs = maxOfs;
    }
    if (ofs > maxOfs) ofs = maxOfs;

    // Make offsets relative to base
    lastOfs += hint;
    ofs += hint;
  }

  // Binary search in array[base+lastOfs:base+ofs]
  lastOfs++;
  while (lastOfs < ofs) {
    const m = lastOfs + ((ofs - lastOfs) >>> 1);
    if (comparator(key, array[base + m]) < 0) {
      ofs = m;
    } else {
      lastOfs = m + 1;
    }
  }

  return ofs;
}

/**
 * Gallop left: Like gallopRight, but finds position where key < array[base+k]
 */
export function gallopLeft<T>(
  key: T,
  array: T[],
  base: number,
  len: number,
  hint: number,
  comparator: Comparator<T>
): number {
  let lastOfs = 0;
  let ofs = 1;

  if (comparator(key, array[base + hint]) > 0) {
    const maxOfs = len - hint;
    while (ofs < maxOfs && comparator(key, array[base + hint + ofs]) > 0) {
      lastOfs = ofs;
      ofs = (ofs << 1) + 1;
      if (ofs <= 0) ofs = maxOfs;
    }
    if (ofs > maxOfs) ofs = maxOfs;

    lastOfs += hint;
    ofs += hint;
  } else {
    const maxOfs = hint + 1;
    while (ofs < maxOfs && comparator(key, array[base + hint - ofs]) <= 0) {
      lastOfs = ofs;
      ofs = (ofs << 1) + 1;
      if (ofs <= 0) ofs = maxOfs;
    }
    if (ofs > maxOfs) ofs = maxOfs;

    const tmp = lastOfs;
    lastOfs = hint - ofs;
    ofs = hint - tmp;
  }

  lastOfs++;
  while (lastOfs < ofs) {
    const m = lastOfs + ((ofs - lastOfs) >>> 1);
    if (comparator(key, array[base + m]) > 0) {
      lastOfs = m + 1;
    } else {
      ofs = m;
    }
  }

  return ofs;
}

/**
 * Gallop right in a generic array (for temporary buffer)
 * Find position where key belongs in arr[base:base+len]
 */
export function gallopRightInArray<T>(
  key: T,
  arr: T[],
  base: number,
  len: number,
  hint: number,
  comparator: Comparator<T>
): number {
  let lastOfs = 0;
  let ofs = 1;

  if (comparator(key, arr[base + hint]) < 0) {
    const maxOfs = hint + 1;
    while (ofs < maxOfs && comparator(key, arr[base + hint - ofs]) < 0) {
      lastOfs = ofs;
      ofs = (ofs << 1) + 1;
      if (ofs <= 0) ofs = maxOfs;
    }
    if (ofs > maxOfs) ofs = maxOfs;

    const tmp = lastOfs;
    lastOfs = hint - ofs;
    ofs = hint - tmp;
  } else {
    const maxOfs = len - hint;
    while (ofs < maxOfs && comparator(key, arr[base + hint + ofs]) >= 0) {
      lastOfs = ofs;
      ofs = (ofs << 1) + 1;
      if (ofs <= 0) ofs = maxOfs;
    }
    if (ofs > maxOfs) ofs = maxOfs;

    lastOfs += hint;
    ofs += hint;
  }

  lastOfs++;
  while (lastOfs < ofs) {
    const m = lastOfs + ((ofs - lastOfs) >>> 1);
    if (comparator(key, arr[base + m]) < 0) {
      ofs = m;
    } else {
      lastOfs = m + 1;
    }
  }

  return ofs;
}

/**
 * Gallop left in a generic array (for temporary buffer)
 */
export function gallopLeftInArray<T>(
  key: T,
  arr: T[],
  base: number,
  len: number,
  hint: number,
  comparator: Comparator<T>
): number {
  let lastOfs = 0;
  let ofs = 1;

  if (comparator(key, arr[base + hint]) > 0) {
    const maxOfs = len - hint;
    while (ofs < maxOfs && comparator(key, arr[base + hint + ofs]) > 0) {
      lastOfs = ofs;
      ofs = (ofs << 1) + 1;
      if (ofs <= 0) ofs = maxOfs;
    }
    if (ofs > maxOfs) ofs = maxOfs;

    lastOfs += hint;
    ofs += hint;
  } else {
    const maxOfs = hint + 1;
    while (ofs < maxOfs && comparator(key, arr[base + hint - ofs]) <= 0) {
      lastOfs = ofs;
      ofs = (ofs << 1) + 1;
      if (ofs <= 0) ofs = maxOfs;
    }
    if (ofs > maxOfs) ofs = maxOfs;

    const tmp = lastOfs;
    lastOfs = hint - ofs;
    ofs = hint - tmp;
  }

  lastOfs++;
  while (lastOfs < ofs) {
    const m = lastOfs + ((ofs - lastOfs) >>> 1);
    if (comparator(key, arr[base + m]) > 0) {
      lastOfs = m + 1;
    } else {
      ofs = m;
    }
  }

  return ofs;
}
