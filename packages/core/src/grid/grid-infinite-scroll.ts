import type { GridOptions, GridState } from '../types';
import type { ViewportModel } from '../features/viewport/viewport-model';
import type { ViewportEvent } from '../features/viewport/types';
import type { VirtualScroller } from '../rendering/virtual-scroller';
import type { GridDOM } from './dom';

export interface InfiniteScrollCallbacks {
  setData: (data: any[][]) => void;
  refresh: () => void;
  getScroller: () => VirtualScroller | null;
  getDOM: () => GridDOM;
}

/**
 * Manages infinite scrolling functionality for the grid
 */
export class GridInfiniteScroll {
  private options: GridOptions;
  private state: GridState;
  private viewportModel: ViewportModel;
  private callbacks: InfiniteScrollCallbacks;

  private viewportSubscription: (() => void) | null = null;
  private isLoadingMoreRows = false;
  private hasMoreRows = true;
  private virtualRowOffset = 0;
  private actualRowCount = 0;

  constructor(
    options: GridOptions,
    state: GridState,
    viewportModel: ViewportModel,
    callbacks: InfiniteScrollCallbacks
  ) {
    this.options = options;
    this.state = state;
    this.viewportModel = viewportModel;
    this.callbacks = callbacks;
  }

  /**
   * Initialize actualRowCount for first data load
   */
  initializeRowCount(dataLength: number): void {
    if (this.options.infiniteScrolling?.enabled && this.actualRowCount === 0) {
      this.actualRowCount = dataLength;
    }
  }

  /**
   * Setup infinite scrolling subscription
   */
  setup(): void {
    const infiniteScrollConfig = this.options.infiniteScrolling;
    if (!infiniteScrollConfig?.enabled || !this.options.onLoadMoreRows) {
      return;
    }

    const threshold = infiniteScrollConfig.threshold ?? 20;

    this.viewportSubscription = this.viewportModel.subscribe({
      onChange: (event: ViewportEvent) => {
        this.handleViewportChange(event, threshold);
      },
    });
  }

  /**
   * Handle viewport change for infinite scrolling
   */
  private handleViewportChange(event: ViewportEvent, threshold: number): void {
    if (event.type !== 'rows' && event.type !== 'range') {
      return;
    }

    const { newRange } = event;
    const totalRows = this.options.rowCount;
    const isNearBottom = newRange.endRow >= totalRows - threshold;

    if (isNearBottom && !this.isLoadingMoreRows && this.hasMoreRows && this.options.onLoadMoreRows) {
      this.loadMoreRows();
    }
  }

  /**
   * Load more rows for infinite scrolling
   */
  private async loadMoreRows(): Promise<void> {
    if (!this.options.onLoadMoreRows || this.isLoadingMoreRows) {
      return;
    }

    this.isLoadingMoreRows = true;

    try {
      const currentRowCount = this.options.rowCount;
      const newRows = await this.options.onLoadMoreRows(currentRowCount);

      if (!newRows || newRows.length === 0) {
        this.hasMoreRows = false;
        return;
      }

      const currentData = this.state.data;
      let updatedData = [...currentData, ...newRows];

      this.actualRowCount += newRows.length;

      // Sliding Window: Prune old rows if enabled
      const slidingWindowConfig = this.options.infiniteScrolling;
      if (slidingWindowConfig?.enableSlidingWindow) {
        const windowSize = slidingWindowConfig.windowSize ?? 1000;
        const pruneThreshold = slidingWindowConfig.pruneThreshold ?? (windowSize + 200);

        if (updatedData.length > pruneThreshold) {
          const rowsToRemove = updatedData.length - windowSize;
          const prunedData = updatedData.slice(rowsToRemove);
          this.virtualRowOffset += rowsToRemove;

          console.log(`🗑️  Sliding Window: Pruned ${rowsToRemove} old rows from memory`);
          console.log(`   Virtual offset: ${this.virtualRowOffset}`);
          console.log(`   Memory rows: ${prunedData.length} (was ${updatedData.length})`);
          console.log(`   Actual total: ${this.actualRowCount} rows loaded so far`);

          if (slidingWindowConfig.onDataPruned) {
            slidingWindowConfig.onDataPruned(rowsToRemove, this.virtualRowOffset);
          }

          updatedData = prunedData;
        }
      }

      this.options.rowCount = updatedData.length;
      this.callbacks.setData(updatedData);

      const scroller = this.callbacks.getScroller();
      if (scroller) {
        scroller.setRowCount(updatedData.length);
        console.log(`📊 Updated scroller row count to ${updatedData.length}`);
      }

      if (scroller) {
        const dom = this.callbacks.getDOM();
        dom.updateCanvasSize(scroller.getTotalWidth(), scroller.getTotalHeight());
      }

      this.callbacks.refresh();

      if (slidingWindowConfig?.enableSlidingWindow) {
        console.log(`✅ Infinite scroll: appended ${newRows.length} rows, memory: ${updatedData.length}, total loaded: ${this.actualRowCount}`);
      } else {
        console.log(`✅ Infinite scroll: appended ${newRows.length} rows, total now: ${updatedData.length}`);
      }
    } catch (error) {
      console.error('Error loading more rows:', error);
      this.hasMoreRows = false;
    } finally {
      this.isLoadingMoreRows = false;
    }
  }

  /**
   * Reset infinite scrolling state
   */
  reset(): void {
    this.isLoadingMoreRows = false;
    this.hasMoreRows = true;
    this.virtualRowOffset = 0;
    this.actualRowCount = 0;
  }

  /**
   * Get sliding window statistics
   */
  getStats(): {
    virtualOffset: number;
    rowsInMemory: number;
    totalRowsLoaded: number;
    prunedRows: number;
  } {
    return {
      virtualOffset: this.virtualRowOffset,
      rowsInMemory: this.state.data.length,
      totalRowsLoaded: this.actualRowCount,
      prunedRows: this.virtualRowOffset,
    };
  }

  /**
   * Cleanup subscriptions
   */
  cleanup(): void {
    if (this.viewportSubscription) {
      this.viewportSubscription();
      this.viewportSubscription = null;
    }
  }
}
