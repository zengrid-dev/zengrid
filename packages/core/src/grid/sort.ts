import type { GridOptions, GridState } from '../types';
import type { EventEmitter } from '../events/event-emitter';
import type { GridEvents } from '../events/grid-events';
import { SortManager } from '../features/sorting/sort-manager';
import type { DataAccessor } from '../data/data-accessor/data-accessor.interface';
import type { RendererCache } from '../rendering/cache';

/**
 * GridSort - Handles sorting operations for the grid
 */
export class GridSort {
  private options: GridOptions;
  private state: GridState;
  private events: EventEmitter<GridEvents>;
  private dataAccessor: DataAccessor | null;
  private sortManager: SortManager | null = null;
  private onRefresh: () => void;
  private onClearCache: () => void;

  constructor(
    options: GridOptions,
    state: GridState,
    events: EventEmitter<GridEvents>,
    dataAccessor: DataAccessor | null,
    _cache: RendererCache | null,
    onRefresh: () => void,
    onClearCache: () => void
  ) {
    this.options = options;
    this.state = state;
    this.events = events;
    this.dataAccessor = dataAccessor;
    this.onRefresh = onRefresh;
    this.onClearCache = onClearCache;

    // Listen to sort:change to update state immediately
    this.events.on('sort:change', (payload: any) => {
      if (payload?.sortState) {
        this.state.sortState = payload.sortState;
      }
    });
  }

  /**
   * Initialize sort manager
   */
  initializeSortManager(rowCount: number, dataAccessor?: DataAccessor | null): void {
    // Update dataAccessor reference if provided
    if (dataAccessor !== undefined) {
      this.dataAccessor = dataAccessor;
    }

    if (!this.sortManager) {
      this.sortManager = new SortManager({
        rowCount,
        events: this.events,
        getValue: (row: number, col: number) => {
          return this.dataAccessor?.getValue(row, col);
        },
        initialSort: this.state.sortState,
        sortMode: this.options.sortMode,
        onSortRequest: this.options.onSortRequest,
      });
    } else {
      this.sortManager.updateRowCount(rowCount);
    }
  }

  /**
   * Get sort manager instance
   */
  getSortManager(): SortManager | null {
    return this.sortManager;
  }

  /**
   * Sort grid by column
   */
  sort(column: number, direction: 'asc' | 'desc' | null = 'asc'): void {
    if (!this.sortManager) {
      console.warn('Sort manager not initialized. Call setData() first.');
      return;
    }

    this.sortManager.clearSort();

    if (direction !== null) {
      this.sortManager.setSortState([{ column, direction }]);
    }

    this.state.sortState = this.sortManager.getSortState();
    this.onClearCache();
    this.onRefresh();
  }

  /**
   * Toggle sort on a column (cycles: asc -> desc -> none)
   */
  toggleSort(column: number): void {
    if (!this.sortManager) {
      console.warn('Sort manager not initialized. Call setData() first.');
      return;
    }

    this.sortManager.toggleSort(column, false);
    // Update state immediately after sort (before cache clear/refresh)
    // This ensures HeaderManager gets the updated state when sort:change event fires
    this.state.sortState = this.sortManager.getSortState();

    // Update headers BEFORE clearing cache, so they have the new sort state
    this.onClearCache();
    this.onRefresh();
  }

  /**
   * Clear all sorting
   */
  clearSort(): void {
    if (!this.sortManager) return;

    this.sortManager.clearSort();
    this.state.sortState = [];
    this.onClearCache();
    this.onRefresh();
  }

  /**
   * Get current sort state
   */
  getSortState() {
    return this.sortManager?.getSortState() ?? [];
  }

  /**
   * Get sort direction for a specific column
   */
  getColumnSort(column: number) {
    return this.sortManager?.getColumnSort(column) ?? null;
  }

  /**
   * Get sort icons with defaults
   */
  getSortIcons(): { asc: string; desc: string } {
    return {
      asc: this.options.sortIcons?.asc ?? '▲',
      desc: this.options.sortIcons?.desc ?? '▼',
    };
  }

  /**
   * Get current sort mode
   */
  getSortMode(): 'frontend' | 'backend' {
    return this.sortManager?.getSortMode() ?? 'frontend';
  }
}
