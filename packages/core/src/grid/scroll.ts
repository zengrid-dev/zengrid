import type { GridOptions, GridState } from '../types';
import { VirtualScroller } from '../rendering/virtual-scroller/virtual-scroller';
import { CellPositioner } from '../rendering/cell-positioner/cell-positioner';
import type { CellPool } from '../rendering/cell-pool/cell-pool';
import type { RendererRegistry } from '../rendering/renderers/renderer-registry';
import type { RendererCache } from '../rendering/cache';
import type { DataAccessor } from '../data/data-accessor/data-accessor.interface';

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

  // Callbacks
  private getSortManager: () => any;
  private getCachedVisibleRows: () => number[] | null;
  private emitEvent: (event: string, payload: any) => void;

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
    this.emitEvent = callbacks.emitEvent;
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
   * Handle scroll events
   */
  handleScroll = (event: Event): void => {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;
    const scrollLeft = target.scrollLeft;

    this.state.scrollPosition = { top: scrollTop, left: scrollLeft };

    // Emit scroll event (HeaderManager listens to this for scroll sync)
    this.emitEvent('scroll', { scrollTop, scrollLeft });

    // Throttle render using requestAnimationFrame
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
  };

  /**
   * Update scroller with new dimensions or data
   */
  updateScroller(): void {
    if (!this.scroller || !this.scrollContainer || !this.canvas) return;

    const viewportWidth = this.scrollContainer.clientWidth;
    const viewportHeight = this.scrollContainer.clientHeight;

    this.scroller = new VirtualScroller({
      rowCount: this.options.rowCount,
      colCount: this.options.colCount,
      rowHeight: this.options.rowHeight,
      colWidth: this.options.colWidth,
      viewportWidth,
      viewportHeight,
      overscanRows: this.options.overscanRows ?? 3,
      overscanCols: this.options.overscanCols ?? 2,
    });

    // Update canvas size
    this.canvas.style.width = `${this.scroller.getTotalWidth()}px`;
    this.canvas.style.height = `${this.scroller.getTotalHeight()}px`;

    // Recreate positioner with new scroller
    if (this.positioner && this.pool) {
      const cachedVisibleRows = this.getCachedVisibleRows();

      this.positioner = new CellPositioner({
        scroller: this.scroller,
        pool: this.pool,
        registry: this.registry,
        cache: this.cache ?? undefined,
        getData: (row: number, col: number) => {
          let dataRow = row;

          if (cachedVisibleRows && cachedVisibleRows.length > 0) {
            if (row >= cachedVisibleRows.length) return undefined;

            const indexMap = this.getSortManager()?.getIndexMap();
            const filteredRow = indexMap ? indexMap.toDataIndex(row) : row;
            dataRow = cachedVisibleRows[filteredRow];
          } else {
            const indexMap = this.getSortManager()?.getIndexMap();
            dataRow = indexMap ? indexMap.toDataIndex(row) : row;
          }

          return this.dataAccessor?.getValue(dataRow, col);
        },
        getColumn: (col: number) => this.options.columns?.[col],
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
   * Cleanup
   */
  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
