import type { GridOptions, GridState } from '../types';
import { VirtualScroller } from '../rendering/virtual-scroller/virtual-scroller';
import { ColumnModelWidthProvider } from '../rendering/width-provider/column-model-width-provider';
import { CellPositioner } from '../rendering/cell-positioner/cell-positioner';
import type { CellPool } from '../rendering/cell-pool/cell-pool';
import type { RendererRegistry } from '../rendering/renderers/renderer-registry';
import type { RendererCache } from '../rendering/cache';
import type { DataAccessor } from '../data/data-accessor/data-accessor.interface';
import type { IndexMap } from '../data/index-map';

/**
 * Threshold for detecting fast scroll (pixels per millisecond)
 * At 2 px/ms, user is scrolling at ~2000 pixels per second
 * Fast scroll bypasses RAF throttling to prevent blank areas
 */
const FAST_SCROLL_VELOCITY_THRESHOLD = 2;

/**
 * GridScroll - Handles scroll events and scroller updates
 */
export class GridScroll {
  private options: GridOptions;
  private state: GridState;
  private scrollContainer: HTMLElement | null;
  private canvas: HTMLElement | null;
  private scroller: VirtualScroller | null;
  private positioner: CellPositioner | null;
  private pool: CellPool | null;
  private registry: RendererRegistry;
  private cache: RendererCache | null;
  private dataAccessor: DataAccessor | null;
  private rafId: number | null = null;

  // Scroll velocity tracking for adaptive overscan
  private lastScrollTop: number = 0;
  private lastScrollLeft: number = 0;
  private lastScrollTime: number = 0;
  private scrollVelocity: { vertical: number; horizontal: number } = { vertical: 0, horizontal: 0 };

  // Callbacks
  private getSortManager: () => any;
  private getCachedVisibleRows: () => number[] | null;
  private getColumnModel: () => any;
  private emitEvent: (event: string, payload: any) => void;
  private mapRowToDataIndex: (row: number) => number | undefined;

  constructor(
    options: GridOptions,
    state: GridState,
    scrollContainer: HTMLElement | null,
    canvas: HTMLElement | null,
    scroller: VirtualScroller | null,
    positioner: CellPositioner | null,
    pool: CellPool | null,
    registry: RendererRegistry,
    cache: RendererCache | null,
    dataAccessor: DataAccessor | null,
    callbacks: {
      getSortManager: () => any;
      getCachedVisibleRows: () => number[] | null;
      getColumnModel: () => any;
      emitEvent: (event: string, payload: any) => void;
    }
  ) {
    this.options = options;
    this.state = state;
    this.scrollContainer = scrollContainer;
    this.canvas = canvas;
    this.scroller = scroller;
    this.positioner = positioner;
    this.pool = pool;
    this.registry = registry;
    this.cache = cache;
    this.dataAccessor = dataAccessor;
    this.getSortManager = callbacks.getSortManager;
    this.getCachedVisibleRows = callbacks.getCachedVisibleRows;
    this.getColumnModel = callbacks.getColumnModel;
    this.emitEvent = callbacks.emitEvent;
    this.mapRowToDataIndex = this.createRowMapper();
  }

  /**
   * Update references (called when components are recreated)
   */
  updateReferences(
    scroller: VirtualScroller | null,
    positioner: CellPositioner | null,
    dataAccessor: DataAccessor | null
  ): void {
    this.scroller = scroller;
    this.positioner = positioner;
    this.dataAccessor = dataAccessor;
  }

  /**
   * Handle scroll events with velocity detection for adaptive rendering
   */
  handleScroll = (event: Event): void => {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;
    const scrollLeft = target.scrollLeft;

    // Calculate scroll velocity
    const now = performance.now();
    const deltaTime = now - this.lastScrollTime;

    if (deltaTime > 0) {
      const deltaY = Math.abs(scrollTop - this.lastScrollTop);
      const deltaX = Math.abs(scrollLeft - this.lastScrollLeft);

      // Velocity in pixels per millisecond
      this.scrollVelocity.vertical = deltaY / deltaTime;
      this.scrollVelocity.horizontal = deltaX / deltaTime;
    }

    this.lastScrollTop = scrollTop;
    this.lastScrollLeft = scrollLeft;
    this.lastScrollTime = now;

    this.state.scrollPosition = { top: scrollTop, left: scrollLeft };

    const visibleRange = this.scroller?.calculateVisibleRange(scrollTop, scrollLeft) ?? {
      startRow: 0,
      endRow: 0,
      startCol: 0,
      endCol: 0,
    };

    // Emit scroll event (HeaderManager listens to this for scroll sync)
    this.emitEvent('scroll', { scrollTop, scrollLeft, visibleRange });

    // Detect fast scroll based on velocity threshold
    const isFastScroll =
      this.scrollVelocity.vertical > FAST_SCROLL_VELOCITY_THRESHOLD ||
      this.scrollVelocity.horizontal > FAST_SCROLL_VELOCITY_THRESHOLD;

    // For fast scrolls, render immediately without waiting for rAF
    // This prevents blank areas during extreme scrolling
    if (isFastScroll) {
      // Cancel any pending rAF
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }

      // Render immediately
      if (this.positioner) {
        this.positioner.renderVisibleCells(scrollTop, scrollLeft);
      }

      if (this.options.onScroll) {
        this.options.onScroll(scrollTop, scrollLeft);
      }
    } else {
      // Normal scroll - use rAF throttling for smooth performance
      if (this.rafId !== null) {
        return;
      }

      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;

        if (!this.positioner) return;
        this.positioner.renderVisibleCells(scrollTop, scrollLeft);

        if (this.options.onScroll) {
          this.options.onScroll(scrollTop, scrollLeft);
        }
      });
    }
  };

  /**
   * Update scroller with new dimensions or data
   */
  updateScroller(): void {
    if (!this.scroller || !this.scrollContainer || !this.canvas) return;

    const viewportWidth = this.scrollContainer.clientWidth;
    const viewportHeight = this.scrollContainer.clientHeight;

    const columnModel = this.getColumnModel();
    const visibleColCount = columnModel
      ? columnModel.getVisibleCount()
      : this.options.colCount;

    const widthProvider = columnModel
      ? new ColumnModelWidthProvider(columnModel)
      : undefined;

    this.scroller = new VirtualScroller({
      rowCount: this.options.rowCount,
      colCount: visibleColCount,
      rowHeight: this.options.rowHeight,
      colWidth: this.options.colWidth,
      widthProvider,
      viewportWidth,
      viewportHeight,
      // Increased defaults to prevent blank areas during fast scrolling
      overscanRows: this.options.overscanRows ?? 10,
      overscanCols: this.options.overscanCols ?? 5,
    });

    // Update canvas size
    this.canvas.style.width = `${this.scroller.getTotalWidth()}px`;
    this.canvas.style.height = `${this.scroller.getTotalHeight()}px`;

    // Recreate positioner with new scroller
    if (this.positioner && this.pool) {
      this.positioner = new CellPositioner({
        scroller: this.scroller,
        pool: this.pool,
        registry: this.registry,
        cache: this.cache ?? undefined,
        getData: (row: number, col: number) => {
          const dataRow = this.mapRowToDataIndex(row);
          if (dataRow === undefined || dataRow < 0) return undefined;

          // Map visual column index to data column index
          // When columns are reordered, col is the visual position, not the data position
          const columnModel = this.getColumnModel();
          let dataCol = col;
          if (columnModel) {
            const orderedColumns = columnModel.getVisibleColumnsInOrder();
            if (orderedColumns && orderedColumns[col]) {
              // Use stable dataIndex instead of parsing column ID
              dataCol = orderedColumns[col].dataIndex;
            }
          }

          return this.dataAccessor?.getValue(dataRow, dataCol);
        },
        getColumn: (col: number) => {
          // Map visual column index to column definition
          // When columns are reordered, col is the visual position
        const columnModel = this.getColumnModel();
        if (columnModel) {
          const orderedColumns = columnModel.getVisibleColumnsInOrder();
          if (orderedColumns && orderedColumns[col]) {
            return orderedColumns[col].definition;
          }
        }
          // Fallback to original index if no column model
          return this.options.columns?.[col];
        },
        isSelected: (row: number, col: number) =>
          this.state.selection.some(range =>
            row >= range.startRow && row <= range.endRow &&
            col >= range.startCol && col <= range.endCol
          ),
        isActive: (row: number, col: number) =>
          this.state.activeCell?.row === row && this.state.activeCell?.col === col,
        isEditing: (row: number, col: number) =>
          this.state.editingCell?.row === row && this.state.editingCell?.col === col,
      });
    }
  }

  /**
   * Update visible column count (for column visibility changes)
   */
  updateVisibleColumnCount(colCount: number): void {
    if (!this.scroller) return;
    this.scroller.setColCount(colCount);
  }

  private createRowMapper(): (row: number) => number | undefined {
    let cachedIndexMap: IndexMap | null = null;
    let cachedVisibleRows: number[] | null = null;
    let cachedCombined: number[] | null = null;

    const getCombinedRows = (indexMap: IndexMap, visibleRows: number[]): number[] => {
      if (indexMap === cachedIndexMap && visibleRows === cachedVisibleRows && cachedCombined) {
        return cachedCombined;
      }

      const visibleSet = new Set<number>(visibleRows);
      const combined = indexMap.indices.filter(index => visibleSet.has(index));

      cachedIndexMap = indexMap;
      cachedVisibleRows = visibleRows;
      cachedCombined = combined;

      return combined;
    };

    return (row: number) => {
      const indexMap = this.getSortManager()?.getIndexMap() ?? null;
      const visibleRows = this.getCachedVisibleRows();

      if (indexMap && visibleRows) {
        const combined = getCombinedRows(indexMap, visibleRows);
        return combined[row];
      }

      if (visibleRows) {
        return visibleRows[row];
      }

      if (indexMap) {
        const mapped = indexMap.toDataIndex(row);
        return mapped >= 0 ? mapped : undefined;
      }

      return row;
    };
  }

  /**
   * Get current scroller instance
   */
  getScroller(): VirtualScroller | null {
    return this.scroller;
  }

  /**
   * Get current positioner instance
   */
  getPositioner(): CellPositioner | null {
    return this.positioner;
  }

  /**
   * Scroll through multiple cells sequentially with configurable timing
   * @param cells - Array of {row, col} objects to scroll through
   * @param options - Configuration options
   * @returns Promise that resolves when all scrolls are complete, with abort function
   */
  scrollThroughCells(
    cells: Array<{ row: number; col: number }>,
    options: {
      delayMs?: number;
      smooth?: boolean;
      onCellReached?: (cell: { row: number; col: number }, index: number) => void;
    } = {}
  ): { promise: Promise<void>; abort: () => void } {
    const { delayMs = 1000, smooth = true, onCellReached } = options;

    let currentIndex = 0;
    let timeoutId: number | null = null;
    let aborted = false;

    const abort = () => {
      aborted = true;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const promise = new Promise<void>((resolve) => {
      const scrollToNext = () => {
        if (aborted || currentIndex >= cells.length) {
          resolve();
          return;
        }

        const cell = cells[currentIndex];

        // Scroll to the cell
        if (this.scrollContainer && this.scroller) {
          const position = this.scroller.getCellPosition(cell.row, cell.col);

          if (smooth) {
            this.scrollContainer.scrollTo({
              top: position.y,
              left: position.x,
              behavior: 'smooth'
            });
          } else {
            this.scrollContainer.scrollTop = position.y;
            this.scrollContainer.scrollLeft = position.x;
          }
        }

        // Call callback if provided
        if (onCellReached) {
          onCellReached(cell, currentIndex);
        }

        currentIndex++;

        // Schedule next scroll
        if (currentIndex < cells.length) {
          timeoutId = window.setTimeout(scrollToNext, delayMs);
        } else {
          resolve();
        }
      };

      // Start the sequence
      scrollToNext();
    });

    return { promise, abort };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
