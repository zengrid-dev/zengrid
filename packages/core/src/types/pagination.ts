/**
 * Pagination types
 */

/**
 * Pagination state
 */
export interface PaginationState {
  /**
   * Current page number (0-based)
   */
  currentPage: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Number of rows per page
   */
  pageSize: number;

  /**
   * Total number of rows across all pages
   */
  totalRows: number;

  /**
   * Available page size options
   */
  pageSizeOptions: number[];
}

/**
 * Pagination template type - 5 built-in styles
 */
export type PaginationTemplate =
  | 'simple'      // Minimal: < 1 2 3 >
  | 'material'    // Material Design style
  | 'bootstrap'   // Bootstrap style with ellipsis
  | 'compact'     // Compact with page input
  | 'full';       // Full featured with all controls

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  /**
   * Enable pagination
   * @default false
   */
  enabled?: boolean;

  /**
   * Page size (rows per page)
   * @default 100
   */
  pageSize?: number;

  /**
   * Available page size options for selector
   * @default [25, 50, 100, 200, 500]
   */
  pageSizeOptions?: number[];

  /**
   * Template style
   * @default 'material'
   */
  template?: PaginationTemplate;

  /**
   * Custom template renderer
   * If provided, overrides built-in templates
   */
  customTemplate?: (state: PaginationState, handlers: PaginationHandlers) => HTMLElement;

  /**
   * Position of pagination controls
   * @default 'bottom'
   */
  position?: 'top' | 'bottom' | 'both';

  /**
   * Show page size selector
   * @default true
   */
  showPageSizeSelector?: boolean;

  /**
   * Show total count
   * @default true
   */
  showTotalCount?: boolean;

  /**
   * Show page info (e.g., "Showing 1-100 of 1000")
   * @default true
   */
  showPageInfo?: boolean;

  /**
   * Maximum number of page buttons to show
   * @default 7
   */
  maxPageButtons?: number;
}

/**
 * Pagination event handlers
 */
export interface PaginationHandlers {
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onFirstPage: () => void;
  onLastPage: () => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
}
