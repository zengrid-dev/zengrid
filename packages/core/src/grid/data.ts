import type { GridOptions, GridState, VisibleRange } from '../types';
import type { VirtualScroller } from '../rendering/virtual-scroller/virtual-scroller';
import type { CellPool } from '../rendering/cell-pool/cell-pool';
import type { RendererCache } from '../rendering/cache';
import type { DataAccessor } from '../data/data-accessor/data-accessor.interface';
import { ArrayAccessor } from '../data/data-accessor/array-accessor';
import { DataManager } from '../data/data-manager';
import type { EventEmitter } from '../events/event-emitter';
import type { GridEvents } from '../events/grid-events';

/**
 * GridData - Handles data operations and accessors for the grid
 */
export class GridData {
  private options: GridOptions;
  private state: GridState;
  private events: EventEmitter<GridEvents>;
  private scroller: VirtualScroller | null;
  private pool: CellPool | null;
  private cache: RendererCache | null;

  public dataAccessor: DataAccessor | null = null;
  public dataManager: DataManager | null = null;

  constructor(
    options: GridOptions,
    state: GridState,
    events: EventEmitter<GridEvents>,
    scroller: VirtualScroller | null,
    pool: CellPool | null,
    cache: RendererCache | null
  ) {
    this.options = options;
    this.state = state;
    this.events = events;
    this.scroller = scroller;
    this.pool = pool;
    this.cache = cache;
  }

  /**
   * Set grid data
   */
  setData(data: any[][]): void {
    if (!Array.isArray(data)) {
      throw new Error('Data must be a 2D array');
    }

    this.state.data = data;
    this.dataAccessor = new ArrayAccessor(data);

    const actualRows = data.length;
    const actualCols = data[0]?.length ?? 0;

    if (actualRows !== this.options.rowCount || actualCols !== this.options.colCount) {
      this.options.rowCount = actualRows;
      this.options.colCount = actualCols;
    }

    // Initialize or update data manager
    if (!this.dataManager) {
      this.dataManager = new DataManager({
        rowCount: actualRows,
        events: this.events,
        modeConfig: {
          mode: this.options.dataMode,
          callback: this.options.onDataRequest,
        },
      });
    } else {
      this.dataManager.updateRowCount(actualRows);
    }

    this.dataManager.setData(data);
  }

  /**
   * Get data value at cell
   */
  getData(row: number, col: number): any {
    return this.dataAccessor?.getValue(row, col);
  }

  /**
   * Get entire row data
   */
  getRowData(row: number): any[] | null {
    if (!this.dataAccessor) return null;
    const cols = this.options.colCount;
    const rowData: any[] = [];
    for (let col = 0; col < cols; col++) {
      rowData.push(this.dataAccessor.getValue(row, col));
    }
    return rowData;
  }

  /**
   * Get scroll position
   */
  getScrollPosition(): { top: number; left: number } {
    return { ...this.state.scrollPosition };
  }

  /**
   * Get visible range
   */
  getVisibleRange(): VisibleRange | null {
    if (!this.scroller) return null;
    return this.scroller.calculateVisibleRange(
      this.state.scrollPosition.top,
      this.state.scrollPosition.left
    );
  }

  /**
   * Get grid statistics
   */
  getStats(): {
    rowCount: number;
    colCount: number;
    visibleCells: number;
    poolStats: any;
    cacheStats?: any;
  } {
    const visibleRange = this.getVisibleRange();
    const visibleCells = visibleRange
      ? (visibleRange.endRow - visibleRange.startRow) * (visibleRange.endCol - visibleRange.startCol)
      : 0;

    return {
      rowCount: this.options.rowCount,
      colCount: this.options.colCount,
      visibleCells,
      poolStats: this.pool?.stats ?? { active: 0, pooled: 0, total: 0 },
      cacheStats: this.cache?.getStats(),
    };
  }

  /**
   * Get total grid dimensions
   */
  getDimensions(): { width: number; height: number } {
    if (!this.scroller) {
      return { width: 0, height: 0 };
    }
    return {
      width: this.scroller.getTotalWidth(),
      height: this.scroller.getTotalHeight(),
    };
  }

  /**
   * Get column position
   */
  getColumnPosition(col: number): { x: number; width: number } {
    if (!this.scroller) {
      return { x: 0, width: 0 };
    }
    const position = this.scroller.getCellPosition(0, col);
    return {
      x: position.x,
      width: position.width,
    };
  }

  /**
   * Get data mode
   */
  getDataMode(): 'frontend' | 'backend' {
    return this.dataManager?.getMode() ?? 'frontend';
  }
}
