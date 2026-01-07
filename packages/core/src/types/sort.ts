/**
 * Sort types
 */

import type { OperationMode } from '@zengrid/shared';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc' | null;

/**
 * Sort mode - alias for OperationMode for backward compatibility
 * @deprecated Use OperationMode from @zengrid/shared instead
 */
export type SortMode = OperationMode;

/**
 * Sort state for a column
 */
export interface SortState {
  column: number;
  direction: SortDirection;
  sortIndex?: number; // For multi-column sort
}
