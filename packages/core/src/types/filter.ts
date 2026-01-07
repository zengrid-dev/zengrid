/**
 * Filter types
 */

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
 * SQL-like filter query with parameterization
 * Supports cleaner syntax than FilterModel for complex queries
 *
 * @example
 * ```typescript
 * // Simple query
 * { sql: "age > 18" }
 *
 * // Parameterized query (recommended - prevents injection)
 * {
 *   sql: "age > :minAge AND status = :status",
 *   params: { minAge: 18, status: 'active' }
 * }
 *
 * // Complex query
 * {
 *   sql: "age BETWEEN :min AND :max AND (name LIKE :search OR email LIKE :search)",
 *   params: { min: 18, max: 65, search: '%john%' }
 * }
 * ```
 */
export interface FilterQuery {
  /**
   * SQL-like query string
   * Supported operators: =, !=, <, >, <=, >=, LIKE, NOT LIKE, BETWEEN, IN, IS NULL, IS NOT NULL
   * Supported logic: AND, OR, NOT, parentheses for grouping
   */
  sql: string;

  /**
   * Named parameters for the query
   * Use :paramName in sql and provide values here
   * Recommended for security and readability
   */
  params?: Record<string, any>;
}

/**
 * Parsed filter expression (internal use)
 * Result of parsing FilterQuery or FilterModel
 */
export interface FilterExpression {
  /**
   * Type of filter input
   */
  type: 'sql' | 'model';

  /**
   * Original SQL query (if type is 'sql')
   */
  sql?: string;

  /**
   * Bound parameters with values substituted
   */
  boundSql?: string;

  /**
   * Parameters array for positional binding
   */
  params?: any[];

  /**
   * Parsed filter models (if type is 'model' or converted from sql)
   */
  models?: FilterModel[];
}
