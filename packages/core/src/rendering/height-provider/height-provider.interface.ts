/**
 * HeightProvider interface for configurable row height calculation
 *
 * Provides a strategy pattern for calculating row heights and positions.
 * Implementations can provide uniform heights, variable heights, or custom logic.
 */
export interface HeightProvider {
  /**
   * Get the height of a specific row
   * @param index - Row index
   * @returns Height in pixels
   * @complexity O(1)
   */
  getHeight(index: number): number;

  /**
   * Get the Y offset where a row starts
   * @param index - Row index
   * @returns Offset in pixels from top
   * @complexity O(1) for uniform, O(1) for variable (cached)
   */
  getOffset(index: number): number;

  /**
   * Get the total height of all rows
   * @returns Total height in pixels
   * @complexity O(1)
   */
  getTotalHeight(): number;

  /**
   * Find which row contains a given Y offset
   * @param offset - Y position in pixels
   * @returns Row index at that offset
   * @complexity O(1) for uniform, O(log n) for variable
   */
  findIndexAtOffset(offset: number): number;

  /**
   * Update the height of a specific row (optional)
   * @param index - Row index
   * @param height - New height in pixels
   * @complexity Varies by implementation
   */
  setHeight?(index: number, height: number): void;

  /**
   * Batch update multiple row heights efficiently (optional)
   * More efficient than calling setHeight multiple times
   * @param updates - Map of row index to new height
   * @complexity Varies by implementation
   */
  batchSetHeight?(updates: Map<number, number>): void;

  /**
   * Subscribe to height changes (optional)
   * @param callback - Function called when any height changes
   * @returns Unsubscribe function
   */
  subscribe?(callback: (row: number, height: number) => void): () => void;

  /**
   * Total number of rows
   */
  readonly length: number;
}

/**
 * Callback for height changes
 */
export type HeightChangeCallback = (row: number, height: number) => void;

/**
 * Extended interface for dynamic height providers
 * Supports invalidation and measurement status
 */
export interface DynamicHeightProvider extends HeightProvider {
  /**
   * Mark a row for re-measurement
   * @param row - Row index to invalidate
   */
  invalidate(row: number): void;

  /**
   * Mark all rows for re-measurement
   */
  invalidateAll(): void;

  /**
   * Get current measurement status
   * @returns Object with measured, pending, and total counts
   */
  getMeasurementStatus(): {
    measured: number;
    pending: number;
    total: number;
  };
}

/**
 * Options for creating a height provider
 */
export interface HeightProviderOptions {
  /**
   * Total number of rows
   */
  rowCount: number;

  /**
   * Height value(s):
   * - number: uniform height for all rows
   * - number[]: individual heights per row
   */
  height: number | number[];
}
