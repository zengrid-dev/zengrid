import type { FilterModel, FilterQuery, FilterExpression } from '../../../types';
import type { OperationMode } from '@zengrid/shared';
import type { EventEmitter } from '../../../events/event-emitter';
import type { GridEvents } from '../../../events/grid-events';
import { FilterQueryParser } from '../filter-query-parser';
import type { FilterCore } from './filter-core';

/**
 * FilterQueryHandler - SQL-like query parsing and mode management
 *
 * Handles SQL-like filter queries, mode switching (frontend/backend/auto),
 * and filter expression management.
 */
export class FilterQueryHandler {
  private mode: OperationMode;
  private columnNames: string[];
  private parser: FilterQueryParser;
  private onFilterRequest?: (filter: FilterExpression) => Promise<void> | void;
  private currentExpression: FilterExpression | null = null;
  private events?: EventEmitter<GridEvents>;
  private core: FilterCore;

  constructor(
    core: FilterCore,
    mode: OperationMode,
    columnNames: string[],
    events?: EventEmitter<GridEvents>,
    onFilterRequest?: (filter: FilterExpression) => Promise<void> | void
  ) {
    this.core = core;
    this.mode = mode;
    this.columnNames = columnNames;
    this.events = events;
    this.onFilterRequest = onFilterRequest;
    this.parser = new FilterQueryParser();

    // Set up column name mapping for SQL queries
    if (this.columnNames.length > 0) {
      const columnMapping: Record<string, number> = {};
      this.columnNames.forEach((name, index) => {
        columnMapping[name] = index;
      });
      this.parser.setColumnMapping(columnMapping);
    }
  }

  /**
   * Apply filter using SQL-like query or FilterModels
   * Supports both frontend and backend filtering
   *
   * @example SQL Query (Frontend)
   * ```typescript
   * await filterManager.applyFilter({
   *   sql: "age > :minAge AND status = :status",
   *   params: { minAge: 18, status: 'active' }
   * });
   * ```
   *
   * @example SQL Query (Backend)
   * ```typescript
   * // With mode='backend', this will call onFilterRequest callback
   * await filterManager.applyFilter({
   *   sql: "price BETWEEN :min AND :max",
   *   params: { min: 100, max: 500 }
   * });
   * ```
   *
   * @example FilterModels
   * ```typescript
   * await filterManager.applyFilter([
   *   {
   *     column: 2,
   *     conditions: [{ operator: 'greaterThan', value: 18 }],
   *     logic: 'AND'
   *   }
   * ]);
   * ```
   */
  async applyFilter(filter: FilterQuery | FilterModel[] | null): Promise<void> {
    if (!filter) {
      this.core.clearAll();
      this.currentExpression = null;
      return;
    }

    try {
      // Parse filter into FilterExpression
      const expression = this.parseFilterInput(filter);
      this.currentExpression = expression;

      // Emit filter:start event
      if (this.events) {
        this.events.emit('filter:start', {
          timestamp: Date.now(),
          filter: expression,
        });
      }

      // Apply filter based on mode
      if (this.mode === 'backend') {
        await this.applyBackendFilter(expression);
      } else if (this.mode === 'frontend') {
        await this.applyFrontendFilter(expression);
      } else if (this.mode === 'auto') {
        // Auto mode: use backend if callback provided, else frontend
        if (this.onFilterRequest) {
          await this.applyBackendFilter(expression);
        } else {
          await this.applyFrontendFilter(expression);
        }
      }

      // Emit filter:end event
      if (this.events) {
        this.events.emit('filter:end', {
          timestamp: Date.now(),
          resultCount: this.core.getColumnFilters().size,
        });
      }
    } catch (error) {
      if (this.events) {
        this.events.emit('filter:error', {
          timestamp: Date.now(),
          error: error as Error,
        });
      }
      throw error;
    }
  }

  /**
   * Parse filter input into FilterExpression
   */
  private parseFilterInput(filter: FilterQuery | FilterModel[]): FilterExpression {
    if (this.isFilterQuery(filter)) {
      // Parse SQL-like query
      return this.parser.parse(filter);
    } else {
      // Use FilterModel array
      return {
        type: 'model',
        models: filter,
      };
    }
  }

  /**
   * Type guard for FilterQuery
   */
  private isFilterQuery(filter: FilterQuery | FilterModel[]): filter is FilterQuery {
    return (filter as FilterQuery).sql !== undefined;
  }

  /**
   * Apply frontend filtering (in-memory)
   */
  private async applyFrontendFilter(expression: FilterExpression): Promise<void> {
    if (expression.type === 'model' && expression.models) {
      // Apply FilterModels using existing logic
      this.core.clearAll();
      for (const model of expression.models) {
        this.core.setColumnFilter(model.column, model.conditions, model.logic);
      }
    } else if (expression.type === 'sql') {
      // For SQL filtering in frontend, we would need to:
      // 1. Parse SQL to FilterModels (complex)
      // 2. Or evaluate SQL directly against rows (simpler but limited)

      // For now, log a warning and suggest using FilterModels or backend mode
      console.warn(
        'Frontend SQL filtering is limited. For complex SQL queries, use backend mode. ' +
          'Alternatively, convert your query to FilterModels for full frontend support.'
      );

      // Clear filters as we can't apply SQL in frontend mode properly yet
      this.core.clearAll();
    }
  }

  /**
   * Apply backend filtering (delegate to server)
   */
  private async applyBackendFilter(expression: FilterExpression): Promise<void> {
    if (!this.onFilterRequest) {
      throw new Error('Backend filtering requires onFilterRequest callback');
    }

    // Delegate to backend
    // The backend callback should:
    // 1. Receive the FilterExpression
    // 2. Use expression.sql and expression.params to query the database
    // 3. Call grid.setData() with the filtered results
    await this.onFilterRequest(expression);
  }

  /**
   * Get current filter expression
   */
  getCurrentExpression(): FilterExpression | null {
    return this.currentExpression;
  }

  /**
   * Update column names (for SQL query mapping)
   */
  setColumnNames(names: string[]): void {
    this.columnNames = names;
    const columnMapping: Record<string, number> = {};
    names.forEach((name, index) => {
      columnMapping[name] = index;
    });
    this.parser.setColumnMapping(columnMapping);
  }
}
