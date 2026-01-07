/**
 * Data loading request/response types
 */

import type { SortState } from './sort';
import type { FilterModel } from './filter';

/**
 * Data loading request parameters
 * Enhanced with field-based filter exports for backend convenience
 */
export interface DataLoadRequest {
  /**
   * Start row index (for pagination)
   */
  startRow: number;

  /**
   * End row index (for pagination)
   */
  endRow: number;

  /**
   * Current sort state
   */
  sortState?: SortState[];

  /**
   * Current filter state (column-based - DEPRECATED)
   * @deprecated Use `filter` field-based format instead
   * Kept for backwards compatibility
   */
  filterState?: FilterModel[];

  /**
   * Field-based filter state (NEW - recommended)
   * Uses field names instead of column indices
   */
  filter?: import('../features/filtering/types').FieldFilterState;

  /**
   * Pre-computed filter exports (NEW)
   * Ready-to-use formats for backend queries
   *
   * @example REST
   * ```typescript
   * fetch(`/api/users?${request.filterExport.queryString}`)
   * // => /api/users?filter[age][gt]=18
   * ```
   *
   * @example GraphQL
   * ```typescript
   * graphqlClient.query({
   *   query: GET_USERS,
   *   variables: { where: request.filterExport.graphqlWhere }
   * })
   * ```
   *
   * @example SQL
   * ```typescript
   * db.query(
   *   `SELECT * FROM users WHERE ${request.filterExport.sql.whereClause}`,
   *   request.filterExport.sql.positionalParams
   * )
   * ```
   */
  filterExport?: {
    /** REST query string (URL-encoded) */
    queryString: string;
    /** GraphQL where clause */
    graphqlWhere: Record<string, any>;
    /** SQL WHERE clause with parameters */
    sql: import('../features/filtering/adapters/types').SQLFilterExport;
  };

  /**
   * Pagination info (NEW)
   */
  pagination?: {
    /** Current page (0-based) */
    page: number;
    /** Items per page */
    pageSize: number;
    /** Row offset (startRow) */
    offset: number;
  };
}

/**
 * Data loading response
 */
export interface DataLoadResponse {
  /**
   * Loaded data rows
   */
  data: any[][];

  /**
   * Total row count (for pagination)
   */
  totalRows: number;

  /**
   * Start row of loaded data
   */
  startRow: number;

  /**
   * End row of loaded data
   */
  endRow: number;
}
