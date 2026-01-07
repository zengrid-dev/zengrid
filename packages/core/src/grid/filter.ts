import type { GridOptions, GridState } from '../types';
import type { EventEmitter } from '../events/event-emitter';
import type { GridEvents } from '../events/grid-events';
import { FilterManager } from '../features/filtering/filter-manager';
import type { DataAccessor } from '../data/data-accessor/data-accessor.interface';

/**
 * GridFilter - Handles filtering operations for the grid
 *
 * NOTE: This module contains complex logic for:
 * - Filtering data
 * - Coordinating filter+sort combinations
 * - Updating scroller with filtered row counts
 * - Managing cached visible rows
 */
export class GridFilter {
  private options: GridOptions;
  private state: GridState;
  private events: EventEmitter<GridEvents>;
  private dataAccessor: DataAccessor | null;
  private filterManager: FilterManager | null = null;

  public cachedVisibleRows: number[] | null = null;

  // Callbacks to parent
  private onRefresh: () => void;
  private onClearCache: () => void;
  private updateScrollerAndPositioner: (rowCount: number) => void;

  constructor(
    options: GridOptions,
    state: GridState,
    events: EventEmitter<GridEvents>,
    dataAccessor: DataAccessor | null,
    callbacks: {
      onRefresh: () => void;
      onClearCache: () => void;
      updateScrollerAndPositioner: (rowCount: number) => void;
    }
  ) {
    this.options = options;
    this.state = state;
    this.events = events;
    this.dataAccessor = dataAccessor;
    this.onRefresh = callbacks.onRefresh;
    this.onClearCache = callbacks.onClearCache;
    this.updateScrollerAndPositioner = callbacks.updateScrollerAndPositioner;
  }

  /**
   * Initialize filter manager
   */
  initializeFilterManager(colCount: number): void {
    if (!this.filterManager) {
      this.filterManager = new FilterManager({
        colCount,
        events: this.events,
        getValue: (row: number, col: number) => {
          return this.dataAccessor?.getValue(row, col);
        },
        mode: this.options.filterMode,
        onFilterRequest: this.options.onFilterRequest,
        columns: this.options.columns,
        enableExport: true,
      });
    }
  }

  /**
   * Get filter manager instance
   */
  getFilterManager(): FilterManager | null {
    return this.filterManager;
  }

  /**
   * Set filter for a column (single condition)
   */
  setFilter(column: number, operator: string, value: any): void {
    if (!this.filterManager) {
      console.warn('Filter manager not initialized. Call setData() first.');
      return;
    }

    const conditions = [{ operator: operator as any, value }];
    this.filterManager.setColumnFilter(column, conditions);
    this.state.filterState = this.filterManager.getFilterState();

    this.cachedVisibleRows = this.filterManager.getVisibleRows(this.options.rowCount);
    console.log(`🔍 Filter applied: ${this.cachedVisibleRows.length} of ${this.options.rowCount} rows visible`);

    // Update scroller and positioner with filtered row count
    this.updateScrollerAndPositioner(this.cachedVisibleRows.length);

    // Emit filter export event
    this.emitFilterExport();

    this.onClearCache();
    this.onRefresh();
  }

  /**
   * Set multiple filter conditions for a column with AND/OR logic
   */
  setColumnFilter(
    column: number,
    conditions: Array<{ operator: string; value: any }>,
    logic: 'AND' | 'OR' = 'AND'
  ): void {
    if (!this.filterManager) {
      console.warn('Filter manager not initialized. Call setData() first.');
      return;
    }

    this.filterManager.setColumnFilter(column, conditions as any, logic);
    this.state.filterState = this.filterManager.getFilterState();

    this.cachedVisibleRows = this.filterManager.getVisibleRows(this.options.rowCount);
    console.log(`🔍 Filter applied: ${this.cachedVisibleRows.length} of ${this.options.rowCount} rows visible`);

    // Update scroller and positioner with filtered row count
    this.updateScrollerAndPositioner(this.cachedVisibleRows.length);

    // Emit filter export event
    this.emitFilterExport();

    this.onClearCache();
    this.onRefresh();
  }

  /**
   * Clear all filters
   */
  clearFilter(): void {
    if (!this.filterManager) return;

    this.filterManager.clearAll();
    this.state.filterState = [];
    this.cachedVisibleRows = null;

    console.log('🔍 All filters cleared');

    // Reset scroller to full row count
    this.updateScrollerAndPositioner(this.options.rowCount);

    this.onClearCache();
    this.onRefresh();
  }

  /**
   * Get current filter state (column-based)
   */
  getFilterState() {
    return this.filterManager?.getFilterState() ?? [];
  }

  /**
   * Get field-based filter state (for backends)
   */
  getFieldFilterState() {
    return this.filterManager?.getFieldFilterState() ?? null;
  }

  /**
   * Get filter exports in all formats (REST, GraphQL, SQL)
   */
  getFilterExports() {
    return this.filterManager?.getFilterExport() ?? null;
  }

  /**
   * Get current filter mode
   */
  getFilterMode(): 'frontend' | 'backend' {
    return 'frontend';
  }

  /**
   * Emit filter export event
   */
  private emitFilterExport(): void {
    const fieldState = this.filterManager?.getFieldFilterState();
    if (fieldState) {
      const exports = this.filterManager?.getFilterExport();
      if (exports) {
        this.events.emit('filter:export', {
          state: fieldState,
          rest: exports.rest,
          graphql: exports.graphql,
          sql: exports.sql,
          previousState: { root: null, activeFields: [], timestamp: Date.now() },
        });
      }
    }
  }
}
