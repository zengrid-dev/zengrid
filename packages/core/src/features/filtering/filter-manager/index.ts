import type { FilterModel, FilterQuery, FilterExpression, ColumnDef } from '../../../types';
import type { ColumnType } from '@zengrid/shared';
import type { FieldFilterState } from '../types';
import type { FilterExportResult } from '../adapters/types';
import type { FilterManagerOptions } from './types';
import { FilterCore } from './filter-core';
import { FilterQueryHandler } from './filter-query';
import { FilterExporter } from './filter-export';
import { FilterOptimizer } from './filter-optimizer';
import type { ColumnFilter } from '../column-filter';

/**
 * FilterManager - Manages filtering across all columns
 *
 * Supports both frontend and backend filtering with two input formats:
 * 1. FilterModel[] - Traditional structured filters
 * 2. FilterQuery - SQL-like queries with parameterization
 *
 * @example Traditional Filtering
 * ```typescript
 * const filterManager = new FilterManager({
 *   colCount: 10,
 *   getValue: (row, col) => data[row][col],
 *   mode: 'frontend'
 * });
 *
 * // Add filter for column 0
 * filterManager.setColumnFilter(0, [
 *   { operator: 'greaterThan', value: 100 },
 * ]);
 *
 * // Test if row passes all filters
 * const passes = filterManager.testRow(5);
 *
 * // Get visible row indices
 * const visible = filterManager.getVisibleRows(1000);
 * ```
 *
 * @example SQL-like Filtering
 * ```typescript
 * const filterManager = new FilterManager({
 *   colCount: 10,
 *   getValue: (row, col) => data[row][col],
 *   mode: 'frontend',
 *   columnNames: ['id', 'name', 'age', 'status']
 * });
 *
 * // Apply SQL-like filter
 * await filterManager.applyFilter({
 *   sql: "age > :minAge AND status = :status",
 *   params: { minAge: 18, status: 'active' }
 * });
 * ```
 *
 * @example Backend Filtering
 * ```typescript
 * const filterManager = new FilterManager({
 *   colCount: 10,
 *   getValue: (row, col) => data[row][col],
 *   mode: 'backend',
 *   onFilterRequest: async (filter) => {
 *     const data = await api.get('/data', {
 *       filter: filter.sql,
 *       params: filter.params
 *     });
 *     grid.setData(data);
 *   }
 * });
 * ```
 */
export class FilterManager {
  private core: FilterCore;
  private query: FilterQueryHandler;
  private exporter: FilterExporter;
  private optimizer: FilterOptimizer;

  constructor(options: FilterManagerOptions) {
    // Initialize core filter management
    this.core = new FilterCore(options.colCount, options.getValue, options.events, () =>
      this.optimizer?.invalidateCache()
    );

    // Initialize query handler
    this.query = new FilterQueryHandler(
      this.core,
      options.mode || 'frontend',
      options.columnNames || [],
      options.events,
      options.onFilterRequest
    );

    // Initialize exporter
    this.exporter = new FilterExporter(
      this.core,
      options.enableExport ?? true,
      options.columns,
      options.exportConfig
    );

    // Initialize optimizer
    this.optimizer = new FilterOptimizer(
      this.core,
      options.getValue,
      options.enableOptimizations ?? true,
      {
        enableCache: options.enableCache,
        cacheCapacity: options.cacheCapacity,
        enableVectorization: options.enableVectorization,
        maxIndexMemoryMB: options.maxIndexMemoryMB,
        enableRangeOptimization: options.enableRangeOptimization,
        dataVersion: options.dataVersion,
      }
    );

    // Initialize with initial filters if provided
    if (options.initialFilters) {
      this.core.initializeFilters(options.initialFilters);
    }
  }

  // ==================== Core Filter Methods ====================

  /**
   * Set filter for a column
   */
  setColumnFilter(column: number, conditions: any[], logic: 'AND' | 'OR' = 'AND'): void {
    this.core.setColumnFilter(column, conditions, logic);
  }

  /**
   * Clear filter for a column
   */
  clearColumnFilter(column: number): void {
    this.core.clearColumnFilter(column);
  }

  /**
   * Clear all filters
   */
  clearAll(): void {
    this.core.clearAll();
  }

  /**
   * Test if a row passes all filters
   */
  testRow(row: number): boolean {
    return this.core.testRow(row);
  }

  /**
   * Get all visible row indices
   */
  getVisibleRows(rowCount: number): number[] {
    return this.optimizer.getVisibleRows(rowCount);
  }

  /**
   * Get filter statistics
   */
  getStats(rowCount: number): {
    totalRows: number;
    visibleRows: number;
    hiddenRows: number;
    activeFilters: number;
  } {
    const visibleRows = this.getVisibleRows(rowCount);

    return {
      totalRows: rowCount,
      visibleRows: visibleRows.length,
      hiddenRows: rowCount - visibleRows.length,
      activeFilters: this.core.getColumnFilters().size,
    };
  }

  /**
   * Get current filter state
   */
  getFilterState(): FilterModel[] {
    return this.core.getFilterState();
  }

  /**
   * Check if any filters are active
   */
  hasActiveFilters(): boolean {
    return this.core.hasActiveFilters();
  }

  /**
   * Get filter for specific column
   */
  getColumnFilter(column: number): ColumnFilter | undefined {
    return this.core.getColumnFilter(column);
  }

  // ==================== Query Methods ====================

  /**
   * Apply filter using SQL-like query or FilterModels
   */
  async applyFilter(filter: FilterQuery | FilterModel[] | null): Promise<void> {
    return this.query.applyFilter(filter);
  }

  /**
   * Get current filter expression
   */
  getCurrentExpression(): FilterExpression | null {
    return this.query.getCurrentExpression();
  }

  /**
   * Update column names (for SQL query mapping)
   */
  setColumnNames(names: string[]): void {
    this.query.setColumnNames(names);
  }

  // ==================== Export Methods ====================

  /**
   * Get current filter state in field-based format
   */
  getFieldFilterState(): FieldFilterState | null {
    return this.exporter.getFieldFilterState();
  }

  /**
   * Get filter export in all formats (REST, GraphQL, SQL)
   */
  getFilterExport(): FilterExportResult | null {
    return this.exporter.getFilterExport();
  }

  /**
   * Get filter export in specific format
   */
  getFilterExportAs<T>(format: string): T | null {
    return this.exporter.getFilterExportAs<T>(format);
  }

  /**
   * Set filter from field-based format
   */
  setFieldFilter(state: FieldFilterState): void {
    this.exporter.setFieldFilter(state);
  }

  /**
   * Update columns (for export manager)
   */
  setColumns(columns: ColumnDef[]): void {
    this.exporter.setColumns(columns);
  }

  // ==================== Optimization Methods ====================

  /**
   * Set data version (invalidates cache)
   */
  setDataVersion(version: number): void {
    this.optimizer.setDataVersion(version);
  }

  /**
   * Index a column for optimized filtering
   */
  indexColumn(col: number, rowCount: number, type: ColumnType = 'float64'): void {
    this.optimizer.indexColumn(col, rowCount, type);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    hitCount: number;
    missCount: number;
    hitRate: number;
    size: number;
    capacity: number;
  } | null {
    return this.optimizer.getCacheStats();
  }

  /**
   * Get index memory statistics
   */
  getIndexMemoryStats(): {
    usedMB: number;
    limitMB: number;
    utilizationPercent: number;
    indexedColumns: number;
  } | null {
    return this.optimizer.getIndexMemoryStats();
  }

  /**
   * Clear all caches and indexes
   */
  clearOptimizations(): void {
    this.optimizer.clearOptimizations();
  }

  // ==================== Lifecycle ====================

  /**
   * Destroy filter manager
   */
  destroy(): void {
    this.core.clearAll();
    this.optimizer.clearOptimizations();
  }
}

// Re-export types
export type { FilterManagerOptions } from './types';
