/**
 * ColumnVisibilityPlugin - Column show/hide
 *
 * @description
 * Provides column visibility management.
 * Useful for:
 * - Column picker/selector UI
 * - Responsive layouts (hide columns on mobile)
 * - User preferences
 *
 * @example
 * ```typescript
 * const columnModel = new ColumnModel(columns);
 * const visibility = new ColumnVisibilityPlugin(columnModel);
 *
 * // Hide column
 * visibility.hide('col-2');
 *
 * // Show column
 * visibility.show('col-2');
 *
 * // Toggle visibility
 * visibility.toggle('col-2');
 *
 * // Get all visible columns
 * const visible = visibility.getVisibleColumns();
 *
 * // Batch hide multiple columns
 * visibility.hideMany(['col-2', 'col-3', 'col-4']);
 * ```
 */

import type { ColumnModel } from '../column-model';
import type { ColumnState } from '../types';

export class ColumnVisibilityPlugin {
  constructor(private columnModel: ColumnModel) {}

  /**
   * Show column
   *
   * @param columnId - Column identifier
   */
  show(columnId: string): void {
    this.setVisibility(columnId, true);
  }

  /**
   * Hide column
   *
   * @param columnId - Column identifier
   */
  hide(columnId: string): void {
    this.setVisibility(columnId, false);
  }

  /**
   * Toggle column visibility
   *
   * @param columnId - Column identifier
   */
  toggle(columnId: string): void {
    const column = this.columnModel.getColumn(columnId);
    if (!column) return;

    this.setVisibility(columnId, !column.visible);
  }

  /**
   * Set column visibility
   *
   * @private
   */
  private setVisibility(columnId: string, visible: boolean): void {
    const column = this.columnModel.getColumn(columnId);
    if (!column) return;

    if (column.visible === visible) return; // No change

    this.columnModel.updateState(
      columnId,
      { visible },
      {
        type: 'visibility',
        columnId,
        oldValue: column.visible,
        newValue: visible,
        state: { ...column, visible },
      }
    );
  }

  /**
   * Show multiple columns at once
   *
   * @param columnIds - Array of column identifiers
   */
  showMany(columnIds: string[]): void {
    this.columnModel.batchUpdate(() => {
      columnIds.forEach((id) => this.show(id));
    });
  }

  /**
   * Hide multiple columns at once
   *
   * @param columnIds - Array of column identifiers
   */
  hideMany(columnIds: string[]): void {
    this.columnModel.batchUpdate(() => {
      columnIds.forEach((id) => this.hide(id));
    });
  }

  /**
   * Show all columns
   */
  showAll(): void {
    this.columnModel.batchUpdate(() => {
      this.columnModel.getColumns().forEach((col) => {
        if (!col.visible) {
          this.show(col.id);
        }
      });
    });
  }

  /**
   * Get all visible columns in display order
   *
   * @returns Array of visible column states
   */
  getVisibleColumns(): ColumnState[] {
    return this.columnModel
      .getColumns()
      .filter((col) => col.visible)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get all hidden columns
   *
   * @returns Array of hidden column states
   */
  getHiddenColumns(): ColumnState[] {
    return this.columnModel
      .getColumns()
      .filter((col) => !col.visible)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get visible column count
   *
   * @returns Number of visible columns
   */
  getVisibleCount(): number {
    return this.columnModel.getColumns().filter((col) => col.visible).length;
  }

  /**
   * Check if column is visible
   *
   * @param columnId - Column identifier
   * @returns True if visible
   */
  isVisible(columnId: string): boolean {
    const column = this.columnModel.getColumn(columnId);
    return column ? column.visible : false;
  }
}
