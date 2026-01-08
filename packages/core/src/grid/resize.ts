import type { GridOptions } from '../types';
import type { EventEmitter } from '../events/event-emitter';
import type { GridEvents } from '../events/grid-events';
import { ColumnResizeManager } from '../features/column-resize';
import type { ColumnConstraints } from '../features/column-resize';
import type { VirtualScroller } from '../rendering/virtual-scroller/virtual-scroller';
import type { DataAccessor } from '../data/data-accessor/data-accessor.interface';
import type { ColumnModel } from '../features/columns/column-model';

/**
 * GridResize - Handles column resize operations
 */
export class GridResize {
  private options: GridOptions;
  private events: EventEmitter<GridEvents>;
  private scroller: VirtualScroller | null;
  private dataAccessor: DataAccessor | null;
  private resizeManager: ColumnResizeManager | null = null;
  private columnModel: ColumnModel | null = null;

  // Callbacks
  private scrollContainer: HTMLElement | null;
  private updateCanvasSize: () => void;
  private onRefresh: () => void;

  constructor(
    options: GridOptions,
    events: EventEmitter<GridEvents>,
    scroller: VirtualScroller | null,
    dataAccessor: DataAccessor | null,
    scrollContainer: HTMLElement | null,
    callbacks: {
      updateCanvasSize: () => void;
      onRefresh: () => void;
    }
  ) {
    this.options = options;
    this.events = events;
    this.scroller = scroller;
    this.dataAccessor = dataAccessor;
    this.scrollContainer = scrollContainer;
    this.updateCanvasSize = callbacks.updateCanvasSize;
    this.onRefresh = callbacks.onRefresh;
  }

  /**
   * Set column model for reactive updates
   */
  setColumnModel(columnModel: ColumnModel | null): void {
    this.columnModel = columnModel;
  }

  /**
   * Initialize column resize manager
   */
  initializeColumnResize(): void {
    if (!this.scroller) return;

    const columnConstraints = new Map<number, ColumnConstraints>();
    if (this.options.columns) {
      this.options.columns.forEach((col, index) => {
        if (col.minWidth !== undefined || col.maxWidth !== undefined) {
          columnConstraints.set(index, {
            minWidth: col.minWidth,
            maxWidth: col.maxWidth,
          });
        }
      });
    }

    this.resizeManager = new ColumnResizeManager({
      events: this.events,
      widthProvider: this.scroller.getWidthProvider(),
      colCount: this.options.colCount,
      getColOffset: (col) => this.scroller!.getColOffset(col),
      getColWidth: (col) => this.scroller!.getColWidth(col),
      onWidthChange: (col, width) => {
        // Update scroller width (for rendering)
        this.scroller!.updateColWidth(col, width);
        this.updateCanvasSize();
        this.onRefresh();

        // Update column model (for reactive header updates)
        if (this.columnModel) {
          const columnId = `col-${col}`;
          this.columnModel.setWidth(columnId, width);
        }
      },
      getValue: (row, col) => this.dataAccessor?.getValue(row, col),
      rowCount: this.options.rowCount,
      resizeZoneWidth: this.options.columnResize?.resizeZoneWidth,
      defaultConstraints: {
        minWidth: this.options.columnResize?.defaultMinWidth,
        maxWidth: this.options.columnResize?.defaultMaxWidth,
      },
      columnConstraints,
      autoFitSampleSize: this.options.columnResize?.autoFitSampleSize,
      autoFitPadding: this.options.columnResize?.autoFitPadding,
      showHandles: this.options.columnResize?.showHandles,
      showPreview: this.options.columnResize?.showPreview,
      onColumnWidthsChange: this.options.onColumnWidthsChange,
      getScrollLeft: () => this.scrollContainer?.scrollLeft ?? 0,
      getViewportHeight: () => this.scrollContainer?.clientHeight ?? 0,
    });
  }

  /**
   * Attach column resize to a header element
   */
  attachColumnResize(headerElement: HTMLElement): void {
    if (!this.resizeManager) {
      console.warn('Column resize is not enabled. Set enableColumnResize: true in GridOptions');
      return;
    }
    this.resizeManager.attach(headerElement);
  }

  /**
   * Detach column resize from header
   */
  detachColumnResize(): void {
    this.resizeManager?.detach();
  }

  /**
   * Update column resize handle positions
   */
  updateColumnResizeHandles(): void {
    this.resizeManager?.updateHandles();
  }

  /**
   * Resize a column programmatically
   */
  resizeColumn(col: number, width: number): void {
    if (!this.scroller) return;

    const oldWidth = this.scroller.getColWidth(col);
    this.scroller.updateColWidth(col, width);
    this.updateCanvasSize();
    this.onRefresh();

    // Update column model (reactive)
    if (this.columnModel) {
      const columnId = `col-${col}`;
      this.columnModel.setWidth(columnId, width);
    }

    if (oldWidth !== width) {
      this.events.emit('column:resize', {
        column: col,
        oldWidth,
        newWidth: width,
      });
    }

    if (this.options.onColumnWidthsChange) {
      const widths: number[] = [];
      for (let c = 0; c < this.options.colCount; c++) {
        widths.push(this.scroller.getColWidth(c));
      }
      this.options.onColumnWidthsChange(widths);
    }
  }

  /**
   * Auto-fit a column to its content
   */
  autoFitColumn(col: number): void {
    this.resizeManager?.autoFitColumn(col);
  }

  /**
   * Auto-fit all columns to their content
   */
  autoFitAllColumns(): void {
    this.resizeManager?.autoFitAllColumns();
  }

  /**
   * Set column constraints
   */
  setColumnConstraints(col: number, constraints: ColumnConstraints): void {
    this.resizeManager?.setColumnConstraints(col, constraints);
  }

  /**
   * Update scroller reference
   */
  updateScroller(scroller: VirtualScroller | null): void {
    this.scroller = scroller;
  }
}
