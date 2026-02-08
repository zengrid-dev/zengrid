import type { GridOptions } from '../types';
import type { EventEmitter } from '../events/event-emitter';
import type { GridEvents } from '../events/grid-events';
import { ColumnResizeManager } from '../features/column-resize';
import type { ColumnConstraints } from '../features/column-resize';
import type { VirtualScroller } from '../rendering/virtual-scroller/virtual-scroller';
import type { DataAccessor } from '../data/data-accessor/data-accessor.interface';
import type { ColumnModel } from '../features/columns/column-model';
import type { HeaderManager } from './header-manager';

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
  private headerManager: HeaderManager | null = null;

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
   * Set header manager for getting header height
   */
  setHeaderManager(headerManager: HeaderManager | null): void {
    this.headerManager = headerManager;
  }

  /**
   * Initialize column resize manager
   */
  initializeColumnResize(): void {
    if (!this.scroller) return;

    // Legacy mode: extract constraints from ColumnDef (only when no ColumnModel)
    // When ColumnModel exists, constraints are provided via constraintProvider callback
    let columnConstraints: Map<number, ColumnConstraints> | undefined;
    if (!this.columnModel && this.options.columns) {
      columnConstraints = new Map<number, ColumnConstraints>();
      this.options.columns.forEach((col, index) => {
        if (col.minWidth !== undefined || col.maxWidth !== undefined) {
          columnConstraints!.set(index, {
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
        if (this.columnModel) {
          // Write to ColumnModel only — ColumnModelWidthProvider adapter and
          // the subscription in Grid handle scroller sync, canvas size, and refresh
          const columnId = `col-${col}`;
          this.columnModel.setWidth(columnId, width);
        } else {
          // Legacy mode (no ColumnModel): update scroller directly
          this.scroller!.updateColWidth(col, width);
          this.updateCanvasSize();
          this.onRefresh();
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
      // When ColumnModel exists, read constraints from it (single source of truth)
      constraintProvider: this.columnModel
        ? (col: number) => {
            const columnId = `col-${col}`;
            return this.columnModel!.getConstraints(columnId) ?? {
              minWidth: 50,
              maxWidth: 1000,
            };
          }
        : undefined,
      // Check if column is resizable via ColumnModel
      isColumnResizable: this.columnModel
        ? (col: number) => {
            const columnId = `col-${col}`;
            return this.columnModel!.isResizable(columnId);
          }
        : undefined,
      autoFitSampleSize: this.options.columnResize?.autoFitSampleSize,
      autoFitPadding: this.options.columnResize?.autoFitPadding,
      showHandles: this.options.columnResize?.showHandles,
      showPreview: this.options.columnResize?.showPreview,
      onColumnWidthsChange: this.options.onColumnWidthsChange,
      getScrollLeft: () => this.scrollContainer?.scrollLeft ?? 0,
      getHeaderHeight: () => this.headerManager?.getHeaderHeight() ?? 40,
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

    if (this.columnModel) {
      // Write to ColumnModel only — adapter and subscription handle the rest
      const columnId = `col-${col}`;
      this.columnModel.setWidth(columnId, width);
    } else {
      // Legacy mode: update scroller directly
      this.scroller.updateColWidth(col, width);
      this.updateCanvasSize();
      this.onRefresh();
    }

    // Read the actual applied width (may differ due to constraints)
    const newWidth = this.scroller.getColWidth(col);

    if (oldWidth !== newWidth) {
      this.events.emit('column:resize', {
        column: col,
        oldWidth,
        newWidth,
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
   * When ColumnModel exists, writes to it (single source of truth)
   * Otherwise falls back to ResizeConstraintManager for legacy mode
   */
  setColumnConstraints(col: number, constraints: ColumnConstraints): void {
    if (this.columnModel) {
      // Write to ColumnModel (single source of truth)
      const columnId = `col-${col}`;
      this.columnModel.setConstraints(columnId, constraints);
    } else {
      // Legacy mode: update ResizeConstraintManager directly
      this.resizeManager?.setColumnConstraints(col, constraints);
    }
  }

  /**
   * Update scroller reference
   */
  updateScroller(scroller: VirtualScroller | null): void {
    this.scroller = scroller;
  }
}
