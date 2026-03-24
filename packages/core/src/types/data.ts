/**
 * Data loading request/response types
 */

import type { SortDescriptor, SortState } from './sort';
import type { FilterExpression, FilterModel } from './filter';

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
   * Monotonic identifier for this request lifecycle.
   */
  requestId?: number;

  /**
   * Abort signal for cancellation-aware backends.
   */
  signal?: AbortSignal;

  /**
   * Current sort state
   */
  sortState?: SortState[];

  /**
   * Serialized sort descriptors with optional field metadata
   */
  sort?: SortDescriptor[];

  /**
   * Shared filter expression used by backend callbacks and backend data mode.
   */
  filterExpression?: FilterExpression;

  /**
   * Current filter state (column-based - DEPRECATED)
   * @deprecated Use `filterExpression` or `filter` instead.
   */
  filterState?: FilterModel[];

  /**
   * Field-based filter state (recommended)
   */
  filter?: import('../features/filtering/types').FieldFilterState;

  /**
   * Pre-computed filter exports.
   */
  filterExport?: {
    queryString: string;
    graphqlWhere: Record<string, any>;
    sql: import('../features/filtering/adapters/types').SQLFilterExport;
  };

  /**
   * Pagination info
   */
  pagination?: {
    page: number;
    pageSize: number;
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

/**
 * Backend data request lifecycle state
 */
export interface DataRequestState {
  /** Resolved data mode */
  mode: 'frontend' | 'backend';

  /** Current request status */
  status: 'idle' | 'loading' | 'success' | 'empty' | 'error';

  /** Whether a backend request is currently in flight */
  isLoading: boolean;

  /** Last request error, if any */
  error: Error | null;

  /** Last request sent to the backend */
  lastRequest: DataLoadRequest | null;

  /** Last successfully loaded row window */
  lastLoadedRange: {
    startRow: number;
    endRow: number;
  } | null;

  /** Latest known total row count */
  totalRows: number;

  /** Whether retry is currently possible */
  canRetry: boolean;
}
