import type { GridOptions } from '../types';
import type { EventEmitter } from '../events/event-emitter';
import type { GridEvents } from '../events/grid-events';
import { ColumnDragManager } from '../features/column-drag';
import type { ColumnDragOptions } from '../features/column-drag/column-drag-manager.interface';
import type { ColumnModel } from '../features/columns/column-model';
import { ColumnReorderPlugin } from '../features/columns/plugins/column-reorder';

/**
 * GridDrag - Handles column drag-and-drop operations
 */
export class GridDrag {
  private options: GridOptions;
  private events: EventEmitter<GridEvents>;
  private dragManager: ColumnDragManager | null = null;
  private columnModel: ColumnModel | null = null;
  private reorderPlugin: ColumnReorderPlugin | null = null;

  // Callbacks
  private scrollContainer: HTMLElement | null;

  constructor(
    options: GridOptions,
    events: EventEmitter<GridEvents>,
    scrollContainer: HTMLElement | null
  ) {
    this.options = options;
    this.events = events;
    this.scrollContainer = scrollContainer;
  }

  /**
   * Set column model and create reorder plugin
   */
  setColumnModel(columnModel: ColumnModel | null): void {
    this.columnModel = columnModel;
    if (columnModel) {
      this.reorderPlugin = new ColumnReorderPlugin(columnModel);
    } else {
      this.reorderPlugin = null;
    }
  }

  /**
   * Initialize column drag manager
   */
  initializeColumnDrag(): void {
    if (!this.columnModel || !this.reorderPlugin) {
      console.warn('Column drag requires ColumnModel to be initialized');
      return;
    }

    // Build locked columns set from column definitions
    const lockedColumns = new Set<string>();
    if (this.options.columns) {
      this.options.columns.forEach((col) => {
        if (col.reorderable === false && col.id) {
          lockedColumns.add(col.id);
        }
      });
    }

    // Merge user options with defaults
    const dragOptions: Partial<ColumnDragOptions> = {
      columnModel: this.columnModel,
      events: this.events,
      getScrollLeft: () => this.scrollContainer?.scrollLeft ?? 0,
      getHeaderCell: (id: string) => {
        const headerCell = document.querySelector(`[data-column-id="${id}"]`) as HTMLElement;
        return headerCell || null;
      },
      lockedColumns,
      ...this.options.columnDrag,
    };

    this.dragManager = new ColumnDragManager(
      dragOptions as ColumnDragOptions,
      this.reorderPlugin
    );
  }

  /**
   * Attach column drag to a header element
   */
  attachColumnDrag(headerElement: HTMLElement): void {
    if (!this.dragManager) {
      console.warn('Column drag is not enabled. Set enableColumnDrag: true in GridOptions');
      return;
    }
    this.dragManager.attach(headerElement);
  }

  /**
   * Detach column drag from header
   */
  detachColumnDrag(): void {
    this.dragManager?.detach();
  }

  /**
   * Check if drag is in progress
   */
  isDragging(): boolean {
    return this.dragManager?.isDragging() ?? false;
  }

  /**
   * Get the drag manager instance
   */
  getDragManager(): ColumnDragManager | null {
    return this.dragManager;
  }

  /**
   * Update scroller reference
   */
  updateScrollContainer(scrollContainer: HTMLElement | null): void {
    this.scrollContainer = scrollContainer;
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    this.dragManager?.destroy();
    this.dragManager = null;
    this.reorderPlugin = null;
  }
}
