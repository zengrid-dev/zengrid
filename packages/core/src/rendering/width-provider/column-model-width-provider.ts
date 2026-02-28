import { PrefixSumArray } from '@zengrid/shared';
import type { WidthProvider } from './width-provider.interface';
import type { ColumnModel } from '../../features/columns/column-model';

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
  private cachedWidths: number[] = [];

  constructor(columnModel: ColumnModel) {
    this.columnModel = columnModel;
  }

  /**
   * Ensure PrefixSumArray cache is up-to-date.
   * Always validates against the column model's current state to avoid
   * stale data from batch notification ordering issues.
   */
  private ensureCache(): void {
    const columns = this.columnModel.getVisibleColumnsInOrder();
    const widths = columns.map((col) => col.actualWidth);

    // Fast-path: check if widths match cached values
    if (this.cache && this.widthsMatch(widths)) return;

    this.cache = new PrefixSumArray({ values: widths });
    this.cachedWidths = widths;
  }

  /**
   * Compare current widths against cached widths
   */
  private widthsMatch(widths: number[]): boolean {
    if (widths.length !== this.cachedWidths.length) return false;
    for (let i = 0; i < widths.length; i++) {
      if (widths[i] !== this.cachedWidths[i]) return false;
    }
    return true;
  }

  getWidth(index: number): number {
    const columns = this.columnModel.getVisibleColumnsInOrder();
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
    const columns = this.columnModel.getVisibleColumnsInOrder();
    if (index < 0 || index >= columns.length) {
      throw new RangeError(`Column index ${index} out of bounds [0, ${columns.length})`);
    }
    this.columnModel.setWidth(columns[index].id, width);
  }

  get length(): number {
    return this.columnModel.getVisibleCount();
  }

  /**
   * Clean up when provider is no longer needed
   */
  destroy(): void {
    this.cache = null;
    this.cachedWidths = [];
  }
}
