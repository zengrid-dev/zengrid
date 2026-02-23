/**
 * ColumnReorderPlugin - Column reordering (drag & drop)
 *
 * @description
 * Provides column reordering capability with batch updates.
 * Updates order of all affected columns in single operation.
 *
 * @example
 * ```typescript
 * const columnModel = new ColumnModel(columns);
 * const reorder = new ColumnReorderPlugin(columnModel);
 *
 * // User drags column from index 0 to index 2
 * reorder.move('col-0', 2);
 * // Emits events for all affected columns: col-0, col-1, col-2
 * ```
 */

import type { ColumnModel } from '../column-model';

export class ColumnReorderPlugin {
  constructor(private columnModel: ColumnModel) {}

  /**
   * Move column to new position
   *
   * @param columnId - Column to move
   * @param newOrder - Target position (0-based index)
   *
   * @example
   * ```typescript
   * // Initial: [col-0, col-1, col-2, col-3]
   * reorder.move('col-0', 2);
   * // Result: [col-1, col-2, col-0, col-3]
   * ```
   */
  move(columnId: string, newOrder: number): void {
    const column = this.columnModel.getColumn(columnId);
    if (!column) return;

    const oldOrder = column.order;
    if (oldOrder === newOrder) return;

    // Get all columns sorted by order
    const allColumns = this.columnModel.getColumns().sort((a, b) => a.order - b.order);

    // Perform reorder
    const [movedColumn] = allColumns.splice(oldOrder, 1);
    allColumns.splice(newOrder, 0, movedColumn);

    // Batch update all affected columns
    this.columnModel.batchUpdate(() => {
      allColumns.forEach((col, index) => {
        if (col.order !== index) {
          this.columnModel.updateState(
            col.id,
            { order: index },
            {
              type: 'reorder',
              columnId: col.id,
              oldValue: col.order,
              newValue: index,
              state: { ...col, order: index },
            }
          );
        }
      });
    });
  }

  /**
   * Swap two columns
   *
   * @param columnId1 - First column
   * @param columnId2 - Second column
   */
  swap(columnId1: string, columnId2: string): void {
    const col1 = this.columnModel.getColumn(columnId1);
    const col2 = this.columnModel.getColumn(columnId2);
    if (!col1 || !col2) return;

    this.columnModel.batchUpdate(() => {
      this.columnModel.updateState(
        col1.id,
        { order: col2.order },
        {
          type: 'reorder',
          columnId: col1.id,
          oldValue: col1.order,
          newValue: col2.order,
          state: { ...col1, order: col2.order },
        }
      );

      this.columnModel.updateState(
        col2.id,
        { order: col1.order },
        {
          type: 'reorder',
          columnId: col2.id,
          oldValue: col2.order,
          newValue: col1.order,
          state: { ...col2, order: col1.order },
        }
      );
    });
  }
}
