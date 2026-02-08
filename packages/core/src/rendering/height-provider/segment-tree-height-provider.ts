/**
 * SegmentTreeHeightProvider - O(log n) height updates using Segment Tree
 *
 * Uses SegmentTree from @zengrid/shared for efficient height management:
 * - O(log n) single height updates (vs O(n) with PrefixSumArray)
 * - O(log n) batch updates for k rows
 * - O(log n) offset-to-index lookups
 * - O(1) total height queries
 *
 * Performance comparison (100,000 rows):
 * - Single update: PrefixSumArray O(n) = ~100k operations, SegmentTree O(log n) = ~17 operations
 * - Batch 100 updates: PrefixSumArray O(k*n) = ~10M operations, SegmentTree O(k log n) = ~1700 operations
 *
 * Ideal for auto row height mode where frequent height updates occur during scrolling.
 */

import { SegmentTree, AggregationType } from '@zengrid/shared';
import type { HeightProvider, HeightChangeCallback } from './height-provider.interface';

export class SegmentTreeHeightProvider implements HeightProvider {
  private tree: SegmentTree<number>;
  private heights: number[];
  private subscribers: Set<HeightChangeCallback>;
  private rowCount: number;

  /**
   * Creates a new SegmentTreeHeightProvider
   * @param rowCount - Total number of rows
   * @param defaultHeight - Initial height for all rows
   */
  constructor(rowCount: number, defaultHeight: number) {
    if (rowCount <= 0) {
      throw new RangeError('Row count must be positive');
    }
    if (defaultHeight <= 0) {
      throw new RangeError('Default height must be positive');
    }

    this.rowCount = rowCount;
    this.heights = new Array(rowCount).fill(defaultHeight);
    this.subscribers = new Set();

    // Create segment tree with sum aggregation for prefix sums
    this.tree = new SegmentTree({
      values: this.heights,
      type: AggregationType.SUM,
    });
  }

  /**
   * Get the height of a specific row
   * @param index - Row index
   * @returns Height in pixels
   * @complexity O(1)
   */
  getHeight(index: number): number {
    if (index < 0 || index >= this.rowCount) {
      throw new RangeError(`Row index ${index} out of bounds [0, ${this.rowCount})`);
    }
    return this.heights[index];
  }

  /**
   * Get the Y offset where a row starts
   * Uses segment tree range query for prefix sum
   * @param index - Row index
   * @returns Offset in pixels from top
   * @complexity O(log n)
   */
  getOffset(index: number): number {
    if (index < 0 || index >= this.rowCount) {
      throw new RangeError(`Row index ${index} out of bounds [0, ${this.rowCount})`);
    }
    if (index === 0) {
      return 0;
    }
    // Sum of heights from 0 to index-1
    return this.tree.query(0, index - 1);
  }

  /**
   * Get the total height of all rows
   * @returns Total height in pixels
   * @complexity O(log n)
   */
  getTotalHeight(): number {
    if (this.rowCount === 0) {
      return 0;
    }
    return this.tree.query(0, this.rowCount - 1);
  }

  /**
   * Find which row contains a given Y offset
   * Uses binary search on cumulative offsets
   * @param offset - Y position in pixels
   * @returns Row index at that offset
   * @complexity O(log n) - binary search with O(log n) getOffset queries
   */
  findIndexAtOffset(offset: number): number {
    if (offset <= 0) {
      return 0;
    }

    const totalHeight = this.getTotalHeight();
    if (offset >= totalHeight) {
      return this.rowCount - 1;
    }

    // Binary search: find the largest row index where getOffset(row) <= offset
    // Row N contains offset if: getOffset(N) <= offset < getOffset(N) + height(N)
    // Equivalent to: getOffset(N) <= offset < getOffset(N+1)
    let low = 0;
    let high = this.rowCount - 1;

    while (low < high) {
      const mid = Math.floor((low + high + 1) / 2); // Round up to avoid infinite loop
      if (this.getOffset(mid) <= offset) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }

    return low;
  }

  /**
   * Update the height of a specific row
   * @param index - Row index
   * @param height - New height in pixels
   * @complexity O(log n)
   */
  setHeight(index: number, height: number): void {
    if (index < 0 || index >= this.rowCount) {
      throw new RangeError(`Row index ${index} out of bounds [0, ${this.rowCount})`);
    }
    if (height < 0) {
      throw new RangeError('Height must be non-negative');
    }

    const oldHeight = this.heights[index];
    if (oldHeight === height) {
      return; // No change
    }

    this.heights[index] = height;
    this.tree.update(index, height);

    // Notify subscribers
    this.notifySubscribers(index, height);
  }

  /**
   * Batch update multiple row heights efficiently
   * @param updates - Map of row index to new height
   * @complexity O(k log n) for k updates
   */
  batchSetHeight(updates: Map<number, number>): void {
    if (updates.size === 0) {
      return;
    }

    const changedRows: Array<{ row: number; height: number }> = [];

    // Update all heights and track changes
    for (const [index, height] of updates) {
      if (index < 0 || index >= this.rowCount) {
        throw new RangeError(`Row index ${index} out of bounds [0, ${this.rowCount})`);
      }
      if (height < 0) {
        throw new RangeError('Height must be non-negative');
      }

      const oldHeight = this.heights[index];
      if (oldHeight !== height) {
        this.heights[index] = height;
        this.tree.update(index, height);
        changedRows.push({ row: index, height });
      }
    }

    // Notify subscribers for all changes
    for (const { row, height } of changedRows) {
      this.notifySubscribers(row, height);
    }
  }

  /**
   * Subscribe to height changes
   * @param callback - Function called when any height changes
   * @returns Unsubscribe function
   */
  subscribe(callback: HeightChangeCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers of a height change
   * @param row - Row that changed
   * @param height - New height
   */
  private notifySubscribers(row: number, height: number): void {
    for (const callback of this.subscribers) {
      try {
        callback(row, height);
      } catch (error) {
        console.error('SegmentTreeHeightProvider: Error in subscriber callback:', error);
      }
    }
  }

  /**
   * Total number of rows
   */
  get length(): number {
    return this.rowCount;
  }
}
