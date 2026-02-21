import type { GridOptions, GridState, FilterModel } from '../types';
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

  // Quick filter state
  private quickFilterQuery: string = '';
  private quickFilterColumns: number[] | null = null;
  private quickFilterCache: string[] | null = null;
  private quickFilterCacheKey: string | null = null;
  private lastAppliedFilterState: FilterModel[] = [];
  private lastAppliedFilterKey: string = '[]';

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
   * Update data accessor reference (after setData)
   */
  updateDataAccessor(dataAccessor: DataAccessor | null): void {
    this.dataAccessor = dataAccessor;
    this.clearQuickFilterCache();
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
    this.applyFilters();
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
    this.applyFilters();
  }

  /**
   * Clear all filters
   */
  clearFilter(): void {
    if (!this.filterManager) return;

    this.filterManager.clearAll();
    this.state.filterState = [];
    this.applyFilters();
  }

  /**
   * Clear filter for a specific column
   */
  clearColumnFilter(column: number): void {
    if (!this.filterManager) return;
    this.filterManager.clearColumnFilter(column);
    this.state.filterState = this.filterManager.getFilterState();
    this.applyFilters();
  }

  /**
   * Get current filter state (column-based)
   */
  getFilterState() {
    return this.filterManager?.getFilterState() ?? [];
  }

  /**
   * Set filter state directly (column-based)
   */
  setFilterState(models: FilterModel[]): void {
    if (!this.filterManager) {
      console.warn('Filter manager not initialized. Call setData() first.');
      return;
    }

    this.filterManager.clearAll();
    for (const model of models) {
      this.filterManager.setColumnFilter(
        model.column,
        model.conditions as any,
        model.logic ?? 'AND'
      );
    }
    this.state.filterState = this.filterManager.getFilterState();
    this.applyFilters();
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
    return this.options.filterMode ?? 'frontend';
  }

  /**
   * Set quick filter (global search across columns)
   */
  setQuickFilter(query: string, columns?: number[]): void {
    this.quickFilterQuery = query ?? '';
    this.quickFilterColumns = columns ?? null;
    this.applyFilters();
  }

  /**
   * Clear quick filter
   */
  clearQuickFilter(): void {
    this.quickFilterQuery = '';
    this.applyFilters();
  }

  /**
   * Get current quick filter
   */
  getQuickFilter(): { query: string; columns: number[] | null } {
    return { query: this.quickFilterQuery, columns: this.quickFilterColumns };
  }

  /**
   * Reapply current filters (use after data changes)
   */
  reapplyFilters(): void {
    this.applyFilters();
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

  /**
   * Apply column filters + quick filter and refresh
   */
  private applyFilters(): void {
    const currentFilterState = this.filterManager?.getFilterState() ?? this.state.filterState ?? [];
    this.state.filterState = currentFilterState;

    const previousFilterState = this.cloneFilterState(this.lastAppliedFilterState);
    const currentFilterKey = JSON.stringify(currentFilterState);

    let cancelled = false;
    this.events.emit('filter:beforeFilter', {
      filterState: currentFilterState,
      cancel: () => {
        cancelled = true;
      },
    });
    if (cancelled) {
      this.restoreFilterState(previousFilterState);
      return;
    }

    const hasColumnFilters = this.filterManager?.hasActiveFilters() ?? false;
    const hasQuickFilter = this.quickFilterQuery.trim().length > 0;

    let baseRows: number[] | null = null;
    if (hasColumnFilters && this.filterManager) {
      baseRows = this.filterManager.getVisibleRows(this.options.rowCount);
    }

    if (hasQuickFilter) {
      const rowsToScan = baseRows ?? this.getAllRowIndexes();
      const quickFiltered = this.applyQuickFilter(rowsToScan);
      this.cachedVisibleRows = quickFiltered;
    } else {
      this.cachedVisibleRows = baseRows;
    }

    const visibleCount = this.cachedVisibleRows
      ? this.cachedVisibleRows.length
      : this.options.rowCount;

    if (hasColumnFilters) {
      console.log(`🔍 Filter applied: ${visibleCount} of ${this.options.rowCount} rows visible`);
      this.emitFilterExport();
    } else if (hasQuickFilter) {
      console.log(`🔍 Quick filter applied: ${visibleCount} of ${this.options.rowCount} rows visible`);
    } else {
      console.log('🔍 All filters cleared');
    }

    // Update scroller and positioner with filtered row count
    this.updateScrollerAndPositioner(visibleCount);

    if (this.lastAppliedFilterKey !== currentFilterKey) {
      this.events.emit('filter:change', {
        filterState: currentFilterState,
        previousFilterState,
      });
    }

    this.events.emit('filter:afterFilter', {
      filterState: currentFilterState,
      rowsVisible: visibleCount,
      rowsHidden: this.options.rowCount - visibleCount,
    });

    this.lastAppliedFilterState = this.cloneFilterState(currentFilterState);
    this.lastAppliedFilterKey = currentFilterKey;

    this.onClearCache();
    this.onRefresh();
  }

  private restoreFilterState(models: FilterModel[]): void {
    if (!this.filterManager) {
      this.state.filterState = this.cloneFilterState(models);
      return;
    }

    this.filterManager.clearAll();
    for (const model of models) {
      this.filterManager.setColumnFilter(
        model.column,
        model.conditions as any,
        model.logic ?? 'AND'
      );
    }
    this.state.filterState = this.filterManager.getFilterState();
  }

  private cloneFilterState(models: FilterModel[]): FilterModel[] {
    return models.map(model => ({
      column: model.column,
      logic: model.logic,
      conditions: (model.conditions ?? []).map(condition => ({
        operator: condition.operator,
        value: Array.isArray(condition.value)
          ? [...condition.value]
          : condition.value,
      })),
    }));
  }

  /**
   * Apply quick filter to a set of rows
   */
  private applyQuickFilter(rows: number[]): number[] {
    const query = this.quickFilterQuery.trim().toLowerCase();
    if (!query) return rows;

    const columns = this.resolveQuickFilterColumns();
    if (columns.length === 0) return rows;

    this.ensureQuickFilterCache(columns);
    if (!this.quickFilterCache) return rows;

    const matches: number[] = [];
    for (const row of rows) {
      const rowText = this.quickFilterCache[row];
      if (rowText && rowText.includes(query)) {
        matches.push(row);
      }
    }
    return matches;
  }

  /**
   * Resolve which columns to scan for quick filter
   */
  private resolveQuickFilterColumns(): number[] {
    if (this.quickFilterColumns && this.quickFilterColumns.length > 0) {
      return this.quickFilterColumns;
    }
    // Default: all columns if defined, otherwise colCount
    if (this.options.columns && this.options.columns.length > 0) {
      return this.options.columns.map((_c, index) => index);
    }
    return Array.from({ length: this.options.colCount }, (_, i) => i);
  }

  /**
   * Build or reuse quick filter cache for given columns
   */
  private ensureQuickFilterCache(columns: number[]): void {
    const cacheKey = columns.join(',');
    if (this.quickFilterCache && this.quickFilterCacheKey === cacheKey) {
      return;
    }

    if (!this.dataAccessor) {
      this.quickFilterCache = null;
      this.quickFilterCacheKey = null;
      return;
    }

    const rowCount = this.options.rowCount;
    const cache: string[] = new Array(rowCount);

    for (let row = 0; row < rowCount; row++) {
      const parts: string[] = [];
      for (const col of columns) {
        const value = this.dataAccessor.getValue(row, col);
        if (value !== undefined && value !== null) {
          parts.push(String(value));
        }
      }
      cache[row] = parts.join(' ').toLowerCase();
    }

    this.quickFilterCache = cache;
    this.quickFilterCacheKey = cacheKey;
  }

  private clearQuickFilterCache(): void {
    this.quickFilterCache = null;
    this.quickFilterCacheKey = null;
  }

  private getAllRowIndexes(): number[] {
    return Array.from({ length: this.options.rowCount }, (_v, i) => i);
  }
}
