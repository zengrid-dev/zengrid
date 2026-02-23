import type { ColumnDef } from '../../../types';
import { FilterExportManager, type FilterExportManagerOptions } from '../filter-export-manager';
import type { FieldFilterState } from '../types';
import type { FilterExportResult } from '../adapters/types';
import type { FilterCore } from './filter-core';

/**
 * FilterExporter - Export transformation module
 *
 * Handles field-based conversion and multi-format export (REST, GraphQL, SQL).
 */
export class FilterExporter {
  private exportManager: FilterExportManager | null = null;
  private enableExport: boolean;
  private core: FilterCore;

  constructor(
    core: FilterCore,
    enableExport: boolean,
    columns?: ColumnDef[],
    exportConfig?: Partial<FilterExportManagerOptions>
  ) {
    this.core = core;
    this.enableExport = enableExport;

    // Initialize FilterExportManager if columns are provided
    if (this.enableExport && columns && columns.length > 0) {
      this.exportManager = new FilterExportManager({
        columns,
        ...exportConfig,
      });
    }
  }

  /**
   * Get current filter state in field-based format
   * Returns filter state using field names instead of column indices
   *
   * @returns Field-based filter state or null if no export manager
   */
  getFieldFilterState(): FieldFilterState | null {
    if (!this.exportManager) {
      console.warn(
        'FilterManager: Export manager not initialized. Provide columns in constructor.'
      );
      return null;
    }

    const filterState = this.core.getFilterState();
    return this.exportManager.convertFromModels(filterState);
  }

  /**
   * Get filter export in all formats (REST, GraphQL, SQL)
   * Returns ready-to-use filter formats for backend consumption
   *
   * @returns Filter export result with all formats
   *
   * @example
   * ```typescript
   * const exports = filterManager.getFilterExport();
   *
   * // REST
   * fetch(`/api/users?${exports.rest.queryString}`);
   *
   * // GraphQL
   * graphqlClient.query({ query, variables: { where: exports.graphql.where } });
   *
   * // SQL
   * db.query(`SELECT * FROM users WHERE ${exports.sql.whereClause}`, exports.sql.positionalParams);
   * ```
   */
  getFilterExport(): FilterExportResult | null {
    if (!this.exportManager) {
      console.warn(
        'FilterManager: Export manager not initialized. Provide columns in constructor.'
      );
      return null;
    }

    const fieldState = this.getFieldFilterState();
    if (!fieldState) return null;

    return this.exportManager.export(fieldState);
  }

  /**
   * Get filter export in specific format
   *
   * @param format - Adapter name ('rest', 'graphql', 'sql', or custom)
   * @returns Filter export in specified format
   *
   * @example
   * ```typescript
   * const restExport = filterManager.getFilterExportAs<RESTFilterExport>('rest');
   * fetch(`/api/users?${restExport.queryString}`);
   * ```
   */
  getFilterExportAs<T>(format: string): T | null {
    if (!this.exportManager) {
      console.warn(
        'FilterManager: Export manager not initialized. Provide columns in constructor.'
      );
      return null;
    }

    const fieldState = this.getFieldFilterState();
    if (!fieldState) return null;

    return this.exportManager.exportAs<T>(fieldState, format);
  }

  /**
   * Set filter from field-based format
   * Converts field-based filter state to column-based FilterModels
   *
   * @param state - Field-based filter state
   *
   * @example
   * ```typescript
   * filterManager.setFieldFilter({
   *   root: {
   *     logic: 'AND',
   *     conditions: [
   *       { field: 'age', operator: 'gt', value: 18 },
   *       { field: 'status', operator: 'eq', value: 'active' }
   *     ]
   *   },
   *   activeFields: ['age', 'status'],
   *   timestamp: Date.now()
   * });
   * ```
   */
  setFieldFilter(state: FieldFilterState): void {
    if (!this.exportManager) {
      console.warn(
        'FilterManager: Export manager not initialized. Provide columns in constructor.'
      );
      return;
    }

    const models = this.exportManager.convertToModels(state);
    this.core.clearAll();

    for (const model of models) {
      this.core.setColumnFilter(model.column, model.conditions, model.logic);
    }
  }

  /**
   * Update columns (for export manager)
   */
  setColumns(columns: ColumnDef[]): void {
    if (this.exportManager) {
      this.exportManager.setColumns(columns);
    } else if (this.enableExport) {
      // Initialize export manager if it wasn't initialized before
      this.exportManager = new FilterExportManager({
        columns,
      });
    }
  }
}
