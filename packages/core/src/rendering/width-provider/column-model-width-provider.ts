import { PrefixSumArray } from '@zengrid/shared';
import type { WidthProvider } from './width-provider.interface';
import type { ColumnModel } from '../../features/columns/column-model';
import type { ColumnState } from '../../features/columns/types';

/**
 * ColumnModelWidthProvider - Adapter that bridges ColumnModel to WidthProvider interface
 *
 * Implements the WidthProvider interface by delegating to ColumnModel as the single
 * source of truth for column widths. Uses a lazy PrefixSumArray cache for efficient
 * offset lookups during scroll (O(1) getOffset, O(log n) findIndexAtOffset).
 *
 * The cache is marked dirty when ColumnModel emits width or reorder changes,
 * and rebuilt lazily on the next read that requires cumulative offsets.
 *
 * This pattern matches how AG Grid and RevoGrid handle column widths:
 * a single authoritative column model with the rendering layer reading through it.
 *
 * @example
 * ```typescript
 * const columnModel = new ColumnModel(columns);
 * const widthProvider = new ColumnModelWidthProvider(columnModel);
 *
 * // Pass to VirtualScroller
 * const scroller = new VirtualScroller({
 *   widthProvider,
 *   // ...
 * });
 *
 * // Width changes go through ColumnModel
 * columnModel.setWidth('col-0', 200);
 * // widthProvider automatically sees the new width
 * ```
 */
export class ColumnModelWidthProvider implements WidthProvider {
  private columnModel: ColumnModel;
  private cache: PrefixSumArray | null = null;
  private cachedColumns: ColumnState[] | null = null;
  private dirty = true;
  private unsubscribe: (() => void) | null = null;

  constructor(columnModel: ColumnModel) {
    this.columnModel = columnModel;

    // Subscribe to ColumnModel changes to invalidate cache
    this.unsubscribe = this.columnModel.subscribeAll({
      onChange: (event) => {
        if (event.type === 'width' || event.type === 'reorder' || event.type === 'visibility') {
          this.dirty = true;
          this.cachedColumns = null;
        }
      },
    });
  }

  /**
   * Ensure PrefixSumArray cache is up-to-date.
   * Rebuilds from ColumnModel only when dirty.
   */
  private ensureCache(): void {
    if (!this.dirty && this.cache) return;

    const columns = this.getOrderedColumns();
    const widths = columns.map((col) => col.actualWidth);

    if (widths.length === 0) {
      this.cache = new PrefixSumArray({ values: [] });
    } else {
      this.cache = new PrefixSumArray({ values: widths });
    }

    this.dirty = false;
  }

  /**
   * Get columns in visual order (cached between invalidations)
   */
  private getOrderedColumns(): ColumnState[] {
    if (!this.cachedColumns) {
      this.cachedColumns = this.columnModel.getVisibleColumnsInOrder();
    }
    return this.cachedColumns;
  }

  getWidth(index: number): number {
    const columns = this.getOrderedColumns();
    if (index < 0 || index >= columns.length) {
      throw new RangeError(`Column index ${index} out of bounds [0, ${columns.length})`);
    }
    return columns[index].actualWidth;
  }

  getOffset(index: number): number {
    this.ensureCache();
    return this.cache!.getOffset(index);
  }

  getTotalWidth(): number {
    this.ensureCache();
    return this.cache!.total;
  }

  findIndexAtOffset(offset: number): number {
    this.ensureCache();
    return this.cache!.findIndexAtOffset(offset);
  }

  /**
   * Set width through ColumnModel (constraint-enforced).
   * Maps visual index to column ID and delegates to ColumnModel.setWidth().
   */
  setWidth(index: number, width: number): void {
    const columns = this.getOrderedColumns();
    if (index < 0 || index >= columns.length) {
      throw new RangeError(`Column index ${index} out of bounds [0, ${columns.length})`);
    }
    // Delegate to ColumnModel — constraints are enforced there
    this.columnModel.setWidth(columns[index].id, width);
    // Note: the subscription will mark dirty automatically
  }

  get length(): number {
    return this.columnModel.getVisibleCount();
  }

  /**
   * Clean up subscription when provider is no longer needed
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.cache = null;
    this.cachedColumns = null;
  }
}
