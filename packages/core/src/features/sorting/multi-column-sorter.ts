/**
 * MultiColumnSorter - High-performance multi-column sorting using timsort
 *
 * Implements stable sorting with multiple sort keys (columns) using the
 * timsort algorithm from @zengrid/shared. Timsort is O(n log n) with
 * excellent performance on partially sorted data.
 *
 * Features:
 * - Stable sorting (preserves order of equal elements)
 * - Multiple sort columns with priority
 * - Custom comparator functions per column
 * - Efficient index-based sorting (doesn't mutate original data)
 * - Type-aware default comparators
 *
 * Performance Target: Sort 100K rows × 3 columns in < 200ms
 */

// NOTE: In production, this would import from @zengrid/shared
// For now, we'll use a simplified timsortIndices implementation
// import { timsortIndices } from '@zengrid/shared';

import {
  SortColumn,
  SortModel,
  ComparatorFn,
  MultiColumnSorterOptions,
  SortDirection,
  Comparators
} from './types';

/**
 * Simplified timsortIndices for demo purposes
 * In production, this comes from @zengrid/shared
 *
 * Returns an array of indices that would sort the input array
 * using the provided comparator function
 */
function timsortIndices<T>(data: T[], comparator: ComparatorFn<T>): number[] {
  // Create array of indices
  const indices = Array.from({ length: data.length }, (_, i) => i);

  // Sort indices using the comparator applied to data elements
  indices.sort((i, j) => comparator(data[i], data[j]));

  return indices;
}

/**
 * Multi-column sorter for ZenGrid
 *
 * Uses timsort algorithm for stable, high-performance sorting
 * with support for multiple sort columns and custom comparators
 */
export class MultiColumnSorter {
  private options: Required<MultiColumnSorterOptions>;

  /**
   * Create a new multi-column sorter
   *
   * @param options - Sorter configuration options
   */
  constructor(options: MultiColumnSorterOptions = {}) {
    this.options = {
      maxSortColumns: options.maxSortColumns ?? 10,
      defaultDirection: options.defaultDirection ?? 'asc',
      stableSort: options.stableSort ?? true
    };
  }

  /**
   * Sort data using multiple columns
   *
   * Returns an array of indices that represent the sorted order.
   * Does not mutate the original data array.
   *
   * @param data - Array of data rows to sort
   * @param sortModel - Sort model with column definitions
   * @returns Array of sorted indices
   *
   * @example
   * const sorter = new MultiColumnSorter();
   * const data = [
   *   { name: 'John', age: 30, dept: 'Sales' },
   *   { name: 'Alice', age: 25, dept: 'Engineering' },
   *   { name: 'Bob', age: 30, dept: 'Engineering' }
   * ];
   * const sortModel = {
   *   columns: [
   *     { field: 'dept', direction: 'asc' },
   *     { field: 'age', direction: 'desc' },
   *     { field: 'name', direction: 'asc' }
   *   ]
   * };
   * const sortedIndices = sorter.sort(data, sortModel);
   * // Returns: [1, 2, 0] (Alice, Bob, John)
   */
  sort(data: any[], sortModel: SortModel): number[] {
    // Handle empty data or no sort columns
    if (data.length === 0 || sortModel.columns.length === 0) {
      return Array.from({ length: data.length }, (_, i) => i);
    }

    // Validate and prepare sort columns
    const sortColumns = this.prepareSortColumns(sortModel.columns);

    // Create the multi-column comparator
    const comparator = this.createMultiColumnComparator(sortColumns);

    // Use timsort to get sorted indices
    return timsortIndices(data, comparator);
  }

  /**
   * Sort data by a single column (convenience method)
   *
   * @param data - Array of data rows to sort
   * @param field - Field name to sort by
   * @param direction - Sort direction ('asc' or 'desc')
   * @param comparator - Optional custom comparator
   * @returns Array of sorted indices
   */
  sortByColumn(
    data: any[],
    field: string,
    direction: SortDirection = 'asc',
    comparator?: ComparatorFn
  ): number[] {
    return this.sort(data, {
      columns: [{ field, direction, comparator }]
    });
  }

  /**
   * Prepare and validate sort columns
   * Limits number of columns and ensures proper priority order
   */
  private prepareSortColumns(columns: SortColumn[]): SortColumn[] {
    // Limit number of sort columns
    const limitedColumns = columns.slice(0, this.options.maxSortColumns);

    // Sort by priority if specified, otherwise use array order
    return limitedColumns
      .map((col, index) => ({
        ...col,
        priority: col.priority ?? index
      }))
      .sort((a, b) => a.priority! - b.priority!);
  }

  /**
   * Create a multi-column comparator function
   *
   * The comparator iterates through sort columns in priority order.
   * For each column, it compares values and returns immediately if they differ.
   * If all columns have equal values, returns 0 (maintains stable sort).
   *
   * @param columns - Array of sort column definitions
   * @returns Comparator function for use with timsort
   */
  private createMultiColumnComparator(columns: SortColumn[]): ComparatorFn {
    return (a: any, b: any): number => {
      // Iterate through sort columns in priority order
      for (const col of columns) {
        // Get values for this column
        const aValue = this.getFieldValue(a, col.field);
        const bValue = this.getFieldValue(b, col.field);

        // Get comparator (custom or auto-detect)
        const comparator = col.comparator ?? Comparators.auto;

        // Compare values
        const result = comparator(aValue, bValue);

        // If values differ, return result (accounting for direction)
        if (result !== 0) {
          return col.direction === 'asc' ? result : -result;
        }

        // Values are equal, continue to next column
      }

      // All columns have equal values
      return 0;
    };
  }

  /**
   * Get field value from an object, supporting nested field paths
   *
   * @param obj - Object to get value from
   * @param field - Field name (supports dot notation for nested fields)
   * @returns Field value or undefined if not found
   *
   * @example
   * getFieldValue({ user: { name: 'John' } }, 'user.name') // Returns: 'John'
   */
  private getFieldValue(obj: any, field: string): any {
    if (obj == null) {
      return undefined;
    }

    // Handle simple field access
    if (!field.includes('.')) {
      return obj[field];
    }

    // Handle nested field access (e.g., 'user.name')
    return field.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }

  /**
   * Apply sorted indices to reorder an array
   *
   * Utility method to create a new sorted array from indices
   *
   * @param data - Original data array
   * @param sortedIndices - Array of sorted indices
   * @returns New array with data reordered according to indices
   */
  applySortedIndices<T>(data: T[], sortedIndices: number[]): T[] {
    return sortedIndices.map(index => data[index]);
  }

  /**
   * Get the inverse of sorted indices (for unsort operations)
   *
   * @param sortedIndices - Array of sorted indices
   * @returns Array of indices to restore original order
   */
  getInverseIndices(sortedIndices: number[]): number[] {
    const inverse = new Array(sortedIndices.length);
    for (let i = 0; i < sortedIndices.length; i++) {
      inverse[sortedIndices[i]] = i;
    }
    return inverse;
  }

  /**
   * Check if a sort model is empty (no active sorts)
   */
  isSortModelEmpty(sortModel: SortModel): boolean {
    return sortModel.columns.length === 0;
  }

  /**
   * Add a sort column to an existing sort model
   *
   * @param sortModel - Current sort model
   * @param column - Column to add
   * @returns New sort model with added column
   */
  addSortColumn(sortModel: SortModel, column: SortColumn): SortModel {
    // Remove existing sort for this field
    const filteredColumns = sortModel.columns.filter(
      col => col.field !== column.field
    );

    // Add new sort column at highest priority (beginning)
    return {
      columns: [column, ...filteredColumns].slice(0, this.options.maxSortColumns)
    };
  }

  /**
   * Remove a sort column from an existing sort model
   *
   * @param sortModel - Current sort model
   * @param field - Field name to remove
   * @returns New sort model without the specified field
   */
  removeSortColumn(sortModel: SortModel, field: string): SortModel {
    return {
      columns: sortModel.columns.filter(col => col.field !== field)
    };
  }

  /**
   * Toggle sort direction for a field
   *
   * If field is not currently sorted, adds it with default direction.
   * If field is sorted ascending, changes to descending.
   * If field is sorted descending, removes the sort.
   *
   * @param sortModel - Current sort model
   * @param field - Field name to toggle
   * @param comparator - Optional custom comparator
   * @returns New sort model with toggled direction
   */
  toggleSortColumn(
    sortModel: SortModel,
    field: string,
    comparator?: ComparatorFn
  ): SortModel {
    const existingSort = sortModel.columns.find(col => col.field === field);

    if (!existingSort) {
      // Not currently sorted - add with default direction
      return this.addSortColumn(sortModel, {
        field,
        direction: this.options.defaultDirection,
        comparator
      });
    } else if (existingSort.direction === 'asc') {
      // Currently ascending - change to descending
      return {
        columns: sortModel.columns.map(col =>
          col.field === field ? { ...col, direction: 'desc' as SortDirection } : col
        )
      };
    } else {
      // Currently descending - remove sort
      return this.removeSortColumn(sortModel, field);
    }
  }

  /**
   * Clear all sorts
   *
   * @returns Empty sort model
   */
  clearSort(): SortModel {
    return { columns: [] };
  }

  /**
   * Get sort direction for a specific field
   *
   * @param sortModel - Current sort model
   * @param field - Field name
   * @returns Sort direction or null if not sorted
   */
  getSortDirection(sortModel: SortModel, field: string): SortDirection | null {
    const column = sortModel.columns.find(col => col.field === field);
    return column?.direction ?? null;
  }

  /**
   * Get sort priority for a specific field
   *
   * @param sortModel - Current sort model
   * @param field - Field name
   * @returns Sort priority (0-based) or null if not sorted
   */
  getSortPriority(sortModel: SortModel, field: string): number | null {
    const index = sortModel.columns.findIndex(col => col.field === field);
    return index >= 0 ? index : null;
  }
}
