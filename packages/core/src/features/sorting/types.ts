/**
 * Sorting types for ZenGrid multi-column sorting system
 */

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Comparator function for comparing two values
 * Returns:
 * - Negative number if a < b
 * - Zero if a === b
 * - Positive number if a > b
 */
export type ComparatorFn<T = any> = (a: T, b: T) => number;

/**
 * Sort column definition
 */
export interface SortColumn {
  /** Field name to sort by */
  field: string;

  /** Sort direction */
  direction: SortDirection;

  /** Custom comparator function (optional) */
  comparator?: ComparatorFn;

  /** Sort order priority (0 = highest priority) */
  priority?: number;
}

/**
 * Sort model containing all active sorts
 */
export interface SortModel {
  /** List of columns being sorted */
  columns: SortColumn[];
}

/**
 * Sort change event data
 */
export interface SortChangedEvent {
  /** Updated sort model */
  sortModel: SortModel;

  /** Column that triggered the change (if applicable) */
  changedColumn?: SortColumn;

  /** Sorted row indices */
  sortedIndices: number[];
}

/**
 * Options for the multi-column sorter
 */
export interface MultiColumnSorterOptions {
  /** Maximum number of columns that can be sorted simultaneously */
  maxSortColumns?: number;

  /** Default sort direction when adding a new sort column */
  defaultDirection?: SortDirection;

  /** Whether to use stable sorting (preserves order of equal elements) */
  stableSort?: boolean;
}

/**
 * Default comparator functions for common data types
 */
export const Comparators = {
  /**
   * String comparator (case-sensitive)
   */
  string: (a: any, b: any): number => {
    const aStr = String(a ?? '');
    const bStr = String(b ?? '');
    return aStr.localeCompare(bStr);
  },

  /**
   * String comparator (case-insensitive)
   */
  stringCaseInsensitive: (a: any, b: any): number => {
    const aStr = String(a ?? '').toLowerCase();
    const bStr = String(b ?? '').toLowerCase();
    return aStr.localeCompare(bStr);
  },

  /**
   * Number comparator
   */
  number: (a: any, b: any): number => {
    const aNum = Number(a);
    const bNum = Number(b);

    // Handle NaN
    if (isNaN(aNum) && isNaN(bNum)) return 0;
    if (isNaN(aNum)) return 1; // NaN sorts last
    if (isNaN(bNum)) return -1;

    return aNum - bNum;
  },

  /**
   * Date comparator
   */
  date: (a: any, b: any): number => {
    const aTime = a instanceof Date ? a.getTime() : new Date(a).getTime();
    const bTime = b instanceof Date ? b.getTime() : new Date(b).getTime();

    // Handle invalid dates
    if (isNaN(aTime) && isNaN(bTime)) return 0;
    if (isNaN(aTime)) return 1;
    if (isNaN(bTime)) return -1;

    return aTime - bTime;
  },

  /**
   * Boolean comparator (false < true)
   */
  boolean: (a: any, b: any): number => {
    const aBool = Boolean(a);
    const bBool = Boolean(b);
    return aBool === bBool ? 0 : aBool ? 1 : -1;
  },

  /**
   * Auto-detect type and use appropriate comparator
   */
  auto: (a: any, b: any): number => {
    // Handle null/undefined
    if (a == null && b == null) return 0;
    if (a == null) return 1; // null sorts last
    if (b == null) return -1;

    // Detect type
    if (typeof a === 'number' && typeof b === 'number') {
      return Comparators.number(a, b);
    }
    if (a instanceof Date || b instanceof Date) {
      return Comparators.date(a, b);
    }
    if (typeof a === 'boolean' && typeof b === 'boolean') {
      return Comparators.boolean(a, b);
    }

    // Default to string comparison
    return Comparators.string(a, b);
  },
};
