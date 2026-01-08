/**
 * ColumnPinPlugin - Column pinning (freeze left/right)
 *
 * @description
 * Provides column pinning capability for freezing columns during scroll.
 * Common use cases:
 * - Pin first column (row numbers/checkboxes) to left
 * - Pin last column (actions) to right
 *
 * @example
 * ```typescript
 * const columnModel = new ColumnModel(columns);
 * const pinning = new ColumnPinPlugin(columnModel);
 *
 * // Pin first column to left
 * pinning.pin('col-0', 'left');
 *
 * // Pin last column to right
 * pinning.pin('col-5', 'right');
 *
 * // Unpin column
 * pinning.unpin('col-0');
 *
 * // Get all pinned columns
 * const leftPinned = pinning.getPinnedColumns('left');
 * ```
 */

import type { ColumnModel } from '../column-model';
import type { ColumnState } from '../types';

export class ColumnPinPlugin {
  constructor(private columnModel: ColumnModel) {}

  /**
   * Pin column to left or right
   *
   * @param columnId - Column identifier
   * @param position - Pin position ('left' or 'right')
   */
  pin(columnId: string, position: 'left' | 'right'): void {
    const column = this.columnModel.getColumn(columnId);
    if (!column) return;

    if (column.pinned === position) return; // Already pinned

    this.columnModel.updateState(columnId, { pinned: position }, {
      type: 'pin',
      columnId,
      oldValue: column.pinned,
      newValue: position,
      state: { ...column, pinned: position },
    });
  }

  /**
   * Unpin column (allow normal scrolling)
   *
   * @param columnId - Column identifier
   */
  unpin(columnId: string): void {
    const column = this.columnModel.getColumn(columnId);
    if (!column) return;

    if (column.pinned === null) return; // Already unpinned

    this.columnModel.updateState(columnId, { pinned: null }, {
      type: 'unpin',
      columnId,
      oldValue: column.pinned,
      newValue: null,
      state: { ...column, pinned: null },
    });
  }

  /**
   * Get all pinned columns
   *
   * @param position - Pin position ('left' or 'right')
   * @returns Array of pinned column states
   */
  getPinnedColumns(position: 'left' | 'right'): ColumnState[] {
    return this.columnModel
      .getColumns()
      .filter(col => col.pinned === position)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Check if column is pinned
   *
   * @param columnId - Column identifier
   * @returns True if pinned to left or right
   */
  isPinned(columnId: string): boolean {
    const column = this.columnModel.getColumn(columnId);
    return column ? column.pinned !== null : false;
  }
}
