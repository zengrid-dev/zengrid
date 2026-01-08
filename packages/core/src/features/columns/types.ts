/**
 * Column Model Types
 *
 * @description
 * Runtime state and event types for reactive column management.
 * Separates column definition (ColumnDef) from runtime state (ColumnState).
 */

import type { ColumnDef } from '../../types/column';

/**
 * Column pin position
 */
export type ColumnPinPosition = 'left' | 'right' | null;

/**
 * Runtime state of a column
 *
 * @description
 * Represents current state of a column during grid operation.
 * Managed by ColumnModel and synced between headers and body.
 *
 * @example
 * ```typescript
 * const state: ColumnState = {
 *   id: 'col-0',
 *   field: 'name',
 *   width: 150,
 *   actualWidth: 150,
 *   visible: true,
 *   pinned: null,
 *   order: 0,
 *   definition: columnDef,
 * };
 * ```
 */
export interface ColumnState {
  /**
   * Unique column identifier
   * Format: 'col-{index}' or custom ID
   */
  id: string;

  /**
   * Data field name (from ColumnDef)
   */
  field: string;

  /**
   * Requested column width (from user or definition)
   * May differ from actualWidth due to constraints
   */
  width: number;

  /**
   * Actual rendered width (after applying min/max constraints)
   * This is what DOM uses
   */
  actualWidth: number;

  /**
   * Column visibility
   */
  visible: boolean;

  /**
   * Pin position (left, right, or null)
   */
  pinned: ColumnPinPosition;

  /**
   * Display order (0-based index)
   * Used for reordering
   */
  order: number;

  /**
   * Parent group ID (for grouped columns)
   * null for top-level columns
   */
  groupId: string | null;

  /**
   * Original column definition
   * Reference to initial configuration
   */
  definition: ColumnDef;
}

/**
 * Column event types
 */
export type ColumnEventType =
  | 'width'        // Width changed
  | 'resize'       // User resizing
  | 'reorder'      // Order changed (drag & drop)
  | 'pin'          // Pinned left/right
  | 'unpin'        // Unpinned
  | 'visibility'   // Show/hide
  | 'group'        // Grouped
  | 'ungroup';     // Ungrouped

/**
 * Column change event
 *
 * @description
 * Emitted when column state changes.
 * Subscribers can react to specific event types.
 *
 * @example
 * ```typescript
 * // Width change event
 * {
 *   type: 'width',
 *   columnId: 'col-0',
 *   oldValue: 100,
 *   newValue: 150,
 *   actualValue: 150,
 *   state: columnState,
 * }
 *
 * // Reorder event
 * {
 *   type: 'reorder',
 *   columnId: 'col-0',
 *   oldValue: 0,
 *   newValue: 2,
 *   state: columnState,
 * }
 * ```
 */
export interface ColumnEvent {
  /**
   * Event type
   */
  type: ColumnEventType;

  /**
   * Column identifier
   */
  columnId: string;

  /**
   * Previous value (width, order, pinned status, etc.)
   */
  oldValue?: any;

  /**
   * New value (width, order, pinned status, etc.)
   */
  newValue?: any;

  /**
   * Actual applied value (after constraints)
   * For width changes, this is actualWidth
   */
  actualValue?: any;

  /**
   * Full column state after change
   */
  state: ColumnState;
}

/**
 * Column batch update
 *
 * @description
 * Used for bulk operations that affect multiple columns.
 * Example: Reordering affects order of many columns.
 *
 * @example
 * ```typescript
 * // Batch reorder
 * {
 *   type: 'reorder',
 *   columns: ['col-0', 'col-1', 'col-2'],
 *   updates: [
 *     { columnId: 'col-0', order: 2 },
 *     { columnId: 'col-1', order: 0 },
 *     { columnId: 'col-2', order: 1 },
 *   ],
 * }
 * ```
 */
export interface ColumnBatchUpdate {
  /**
   * Operation type
   */
  type: ColumnEventType;

  /**
   * Affected column IDs
   */
  columns: string[];

  /**
   * Individual column updates
   */
  updates: Array<{
    columnId: string;
    [key: string]: any;
  }>;
}

/**
 * Column constraints (min/max width)
 */
export interface ColumnConstraints {
  minWidth: number;
  maxWidth: number;
}
