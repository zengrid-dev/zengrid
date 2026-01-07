import type { FilterModel } from '../../../types';
import type { EventEmitter } from '../../../events/event-emitter';
import type { GridEvents } from '../../../events/grid-events';
import { ColumnFilter } from '../column-filter';

/**
 * FilterCore - Core filter state management
 *
 * Handles setting/clearing filters, testing rows, and managing filter state.
 */
export class FilterCore {
  private colCount: number;
  private events?: EventEmitter<GridEvents>;
  private getValue: (row: number, col: number) => any;
  private columnFilters: Map<number, ColumnFilter> = new Map();
  private filterState: FilterModel[] = [];
  private filterStateHash = '';

  // Callbacks for cache invalidation and optimization
  private onFilterStateChange?: () => void;

  constructor(
    colCount: number,
    getValue: (row: number, col: number) => any,
    events?: EventEmitter<GridEvents>,
    onFilterStateChange?: () => void
  ) {
    this.colCount = colCount;
    this.getValue = getValue;
    this.events = events;
    this.onFilterStateChange = onFilterStateChange;
  }

  /**
   * Initialize with filter models
   */
  initializeFilters(initialFilters: FilterModel[]): void {
    for (const model of initialFilters) {
      this.setColumnFilterFromModel(model);
    }
  }

  /**
   * Set filter for a column
   * @param column - Column index
   * @param conditions - Filter conditions
   * @param logic - Logic operator ('AND' or 'OR')
   */
  setColumnFilter(
    column: number,
    conditions: any[],
    logic: 'AND' | 'OR' = 'AND'
  ): void {
    if (column < 0 || column >= this.colCount) {
      throw new RangeError(`Column ${column} out of bounds`);
    }

    // Remove existing filter if empty
    if (conditions.length === 0) {
      this.clearColumnFilter(column);
      return;
    }

    // Create or update filter
    const filter = new ColumnFilter({
      column,
      conditions,
      logic,
      onChange: (_model) => this.updateFilterState(),
    });

    this.columnFilters.set(column, filter);
    this.updateFilterState();
    this.emitFilterChange();
  }

  /**
   * Set column filter from model
   */
  private setColumnFilterFromModel(model: FilterModel): void {
    this.setColumnFilter(model.column, model.conditions, model.logic);
  }

  /**
   * Clear filter for a column
   * @param column - Column index
   */
  clearColumnFilter(column: number): void {
    if (this.columnFilters.has(column)) {
      this.columnFilters.delete(column);
      this.updateFilterState();
      this.emitFilterChange();
    }
  }

  /**
   * Clear all filters
   */
  clearAll(): void {
    this.columnFilters.clear();
    this.filterState = [];
    this.filterStateHash = '';
    this.emitFilterChange();

    if (this.onFilterStateChange) {
      this.onFilterStateChange();
    }
  }

  /**
   * Test if a row passes all filters
   * @param row - Row index
   * @returns True if row passes all filters
   */
  testRow(row: number): boolean {
    // No filters = all rows pass
    if (this.columnFilters.size === 0) return true;

    // Test each column filter
    for (const [column, filter] of this.columnFilters) {
      const value = this.getValue(row, column);
      if (!filter.test(value)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all visible row indices (basic version without optimization)
   * @param rowCount - Total row count
   * @returns Array of visible row indices
   */
  getVisibleRowsBasic(rowCount: number): number[] {
    const visible: number[] = [];
    for (let row = 0; row < rowCount; row++) {
      if (this.testRow(row)) {
        visible.push(row);
      }
    }
    return visible;
  }

  /**
   * Get current filter state
   */
  getFilterState(): FilterModel[] {
    return [...this.filterState];
  }

  /**
   * Get filter state hash for caching
   */
  getFilterStateHash(): string {
    return this.filterStateHash;
  }

  /**
   * Check if any filters are active
   */
  hasActiveFilters(): boolean {
    return this.columnFilters.size > 0;
  }

  /**
   * Get filter for specific column
   * @param column - Column index
   */
  getColumnFilter(column: number): ColumnFilter | undefined {
    return this.columnFilters.get(column);
  }

  /**
   * Get all column filters
   */
  getColumnFilters(): Map<number, ColumnFilter> {
    return this.columnFilters;
  }

  /**
   * Emit filter change event
   */
  private emitFilterChange(): void {
    if (!this.events) return;

    this.events.emit('filter:change', {
      filterState: this.filterState,
      previousFilterState: [], // TODO: Track previous state
    });
  }

  /**
   * Update filter state array and hash
   */
  private updateFilterState(): void {
    this.filterState = Array.from(this.columnFilters.values()).map(f => f.getModel());

    // Update hash for cache key
    this.filterStateHash = JSON.stringify(this.filterState);

    // Notify listeners (for cache invalidation)
    if (this.onFilterStateChange) {
      this.onFilterStateChange();
    }
  }
}
