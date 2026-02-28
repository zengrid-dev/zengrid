import type {
  VirtualScroller as IVirtualScroller,
  VirtualScrollerOptions,
  CellPosition,
} from './virtual-scroller.interface';
import type { HeightProvider } from '../height-provider';
import type { WidthProvider } from '../width-provider';
import { UniformHeightProvider } from '../height-provider/uniform-height-provider';
import { VariableHeightProvider } from '../height-provider/variable-height-provider';
import { UniformWidthProvider } from '../width-provider/uniform-width-provider';
import { VariableWidthProvider } from '../width-provider/variable-width-provider';
import type { VisibleRange } from '../../types';
import type { ScrollModel } from '../../features/viewport/scroll-model';
import type { ViewportModel } from '../../features/viewport/viewport-model';

/**
 * VirtualScroller implementation
 *
 * Calculates visible ranges for virtual scrolling with configurable height/width strategies.
 * Uses PrefixSumArray (via providers) for efficient offset-to-index lookups.
 *
 * @example
 * ```typescript
 * const scroller = new VirtualScroller({
 *   rowCount: 10000,
 *   colCount: 20,
 *   rowHeight: 30,
 *   colWidth: 100,
 *   viewportWidth: 800,
 *   viewportHeight: 600,
 * });
 *
 * const visible = scroller.calculateVisibleRange(1000, 0);
 * // { startRow: 30, endRow: 53, startCol: 0, endCol: 10 }
 * ```
 */
export class VirtualScroller implements IVirtualScroller {
  private heightProvider: HeightProvider;
  private widthProvider: WidthProvider;
  private rows: number;
  private cols: number;
  private vpWidth: number;
  private vpHeight: number;
  private overscanRows: number;
  private overscanCols: number;

  // Reactive models (optional - for reactive mode)
  private scrollModel: ScrollModel | null = null;
  private viewportModel: ViewportModel | null = null;

  constructor(options: VirtualScrollerOptions) {
    this.rows = options.rowCount;
    this.cols = options.colCount;
    this.vpWidth = options.viewportWidth;
    this.vpHeight = options.viewportHeight;
    // Increased default overscan to prevent blank areas during fast scrolling
    this.overscanRows = options.overscanRows ?? 10;
    this.overscanCols = options.overscanCols ?? 5;

    // Auto-select height provider
    if (options.heightProvider) {
      this.heightProvider = options.heightProvider;
    } else if (Array.isArray(options.rowHeight)) {
      this.heightProvider = new VariableHeightProvider(options.rowHeight);
    } else {
      this.heightProvider = new UniformHeightProvider(options.rowHeight ?? 30, options.rowCount);
    }

    // Auto-select width provider
    if (options.widthProvider) {
      this.widthProvider = options.widthProvider;
    } else if (Array.isArray(options.colWidth)) {
      this.widthProvider = new VariableWidthProvider(options.colWidth);
    } else {
      this.widthProvider = new UniformWidthProvider(options.colWidth ?? 100, options.colCount);
    }
  }

  /**
   * Set reactive models (enables reactive mode)
   */
  setReactiveModels(scrollModel: ScrollModel | null, viewportModel: ViewportModel | null): void {
    this.scrollModel = scrollModel;
    this.viewportModel = viewportModel;
  }

  calculateVisibleRange(scrollTop: number, scrollLeft: number): VisibleRange {
    // Clamp scroll positions
    scrollTop = Math.max(0, scrollTop);
    scrollLeft = Math.max(0, scrollLeft);

    // Update scroll model (reactive)
    if (this.scrollModel) {
      this.scrollModel.setScroll(scrollTop, scrollLeft);
    }

    // Find first visible row (with overscan)
    const firstVisibleRow = this.heightProvider.findIndexAtOffset(scrollTop);
    const startRow = Math.max(0, firstVisibleRow - this.overscanRows);

    // Find last visible row (with overscan)
    const endOffset = scrollTop + this.vpHeight;
    const lastVisibleRow = this.heightProvider.findIndexAtOffset(endOffset);
    const endRow = Math.min(this.rows, lastVisibleRow + this.overscanRows + 1);

    // Find first visible column (with overscan)
    const firstVisibleCol = this.widthProvider.findIndexAtOffset(scrollLeft);
    const startCol = Math.max(0, firstVisibleCol - this.overscanCols);

    // Find last visible column (with overscan)
    const endColOffset = scrollLeft + this.vpWidth;
    const lastVisibleCol = this.widthProvider.findIndexAtOffset(endColOffset);
    const endCol = Math.min(this.cols, lastVisibleCol + this.overscanCols + 1);

    const range = {
      startRow,
      endRow,
      startCol,
      endCol,
    };

    // Update viewport model (reactive)
    if (this.viewportModel) {
      this.viewportModel.setRange(range, { top: scrollTop, left: scrollLeft });
    }

    return range;
  }

  getCellPosition(row: number, col: number): CellPosition {
    return {
      x: this.widthProvider.getOffset(col),
      y: this.heightProvider.getOffset(row),
      width: this.widthProvider.getWidth(col),
      height: this.heightProvider.getHeight(row),
    };
  }

  getRowAtOffset(offset: number): number {
    return this.heightProvider.findIndexAtOffset(offset);
  }

  getColAtOffset(offset: number): number {
    return this.widthProvider.findIndexAtOffset(offset);
  }

  getRowOffset(row: number): number {
    return this.heightProvider.getOffset(row);
  }

  getColOffset(col: number): number {
    return this.widthProvider.getOffset(col);
  }

  getRowHeight(row: number): number {
    return this.heightProvider.getHeight(row);
  }

  getColWidth(col: number): number {
    return this.widthProvider.getWidth(col);
  }

  getTotalHeight(): number {
    return this.heightProvider.getTotalHeight();
  }

  getTotalWidth(): number {
    return this.widthProvider.getTotalWidth();
  }

  updateRowHeight(row: number, height: number): void {
    if (!this.heightProvider.setHeight) {
      throw new Error('Height provider does not support setHeight (use VariableHeightProvider)');
    }
    this.heightProvider.setHeight(row, height);
  }

  updateColWidth(col: number, width: number): void {
    if (!this.widthProvider.setWidth) {
      throw new Error('Width provider does not support setWidth (use VariableWidthProvider)');
    }
    this.widthProvider.setWidth(col, width);
  }

  setViewport(width: number, height: number): void {
    if (width <= 0 || height <= 0) {
      throw new RangeError('Viewport dimensions must be positive');
    }
    this.vpWidth = width;
    this.vpHeight = height;
  }

  /**
   * Update the row count (for infinite scrolling)
   * @param rowCount - New total number of rows
   */
  setRowCount(rowCount: number): void {
    if (rowCount < 0) {
      throw new RangeError('Row count must be non-negative');
    }
    this.rows = rowCount;

    // If using UniformHeightProvider, we need to update its row count too
    if (this.heightProvider instanceof UniformHeightProvider) {
      // UniformHeightProvider calculates total based on count, so we need to recreate it
      const rowHeight = this.heightProvider.getHeight(0);
      this.heightProvider = new UniformHeightProvider(rowHeight, rowCount);
    }
  }

  /**
   * Update the column count
   * @param colCount - New total number of columns
   */
  setColCount(colCount: number): void {
    if (colCount < 0) {
      throw new RangeError('Column count must be non-negative');
    }
    this.cols = colCount;

    // If using UniformWidthProvider, we need to update its column count too
    if (this.widthProvider instanceof UniformWidthProvider) {
      const colWidth = this.widthProvider.getWidth(0);
      this.widthProvider = new UniformWidthProvider(colWidth, colCount);
    }
  }

  get rowCount(): number {
    return this.rows;
  }

  get colCount(): number {
    return this.cols;
  }

  /**
   * Get the height provider (for external updates/subscriptions)
   */
  getHeightProvider(): HeightProvider {
    return this.heightProvider;
  }

  /**
   * Get the width provider (for external updates/subscriptions)
   */
  getWidthProvider(): WidthProvider {
    return this.widthProvider;
  }

  /**
   * Replace the width provider (for in-place updates when columns change)
   */
  setWidthProvider(wp: WidthProvider): void {
    this.widthProvider = wp;
  }

  get viewportWidth(): number {
    return this.vpWidth;
  }

  get viewportHeight(): number {
    return this.vpHeight;
  }
}
