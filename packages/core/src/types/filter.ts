/**
 * Filter types
 */

import type { FilterExportResult } from '../features/filtering/adapters/types';
import type { FieldFilterState } from '../features/filtering/types';

/**
 * Filter operator types
 */
export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'blank'
  | 'notBlank'
  | 'between'
  | 'in'
  | 'notIn'
  | 'regex';

/**
 * Filter condition
 */
export interface FilterCondition {
  operator: FilterOperator;
  value?: any;
}

/**
 * Filter model for a column
 */
export interface FilterModel {
  column: number;
  conditions: FilterCondition[];
  logic?: 'AND' | 'OR';
}

/**
 * Quick filter state shared across frontend/backend request paths
 */
export interface FilterQuickState {
  query: string;
  columns: number[] | null;
}

/**
 * SQL-like filter query with parameterization
 * Supports cleaner syntax than FilterModel for complex queries
 */
export interface FilterQuery {
  sql: string;
  params?: Record<string, any>;
}

/**
 * Parsed filter expression shared by backend callbacks and backend data requests.
 */
export interface FilterExpression {
  /**
   * Type of filter input.
   */
  type: 'sql' | 'model';

  /**
   * Original SQL query (if type is 'sql').
   */
  sql?: string;

  /**
   * Bound SQL converted to positional placeholders (if type is 'sql').
   */
  boundSql?: string;

  /**
   * Parameters array for positional binding.
   */
  params?: any[];

  /**
   * Column-based filter models.
   */
  models?: FilterModel[];

  /**
   * Quick filter state applied alongside column filters.
   */
  quickFilter?: FilterQuickState;

  /**
   * Field-based filter state for backend-friendly consumption.
   */
  fieldState?: FieldFilterState;

  /**
   * Pre-computed backend exports (REST / GraphQL / SQL).
   */
  filterExport?: FilterExportResult;
}
