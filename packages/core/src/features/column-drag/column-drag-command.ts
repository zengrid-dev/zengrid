/**
 * Column Drag Command
 *
 * @description
 * Command pattern implementation for undoing/redoing column reorder operations.
 * Integrates with CommandStack for undo/redo functionality.
 */

import type { ICommand } from '@zengrid/shared';
import type { ColumnReorderPlugin } from '../columns/plugins/column-reorder';

/**
 * Command for undoing/redoing column reorder operations
 *
 * @example
 * ```typescript
 * const command = new ColumnDragCommand(
 *   reorderPlugin,
 *   'col-2',
 *   2,
 *   5
 * );
 *
 * commandStack.execute(command); // Move column from index 2 to 5
 * commandStack.undo();           // Move back to index 2
 * commandStack.redo();           // Move to index 5 again
 * ```
 */
export class ColumnDragCommand implements ICommand {
  /** Description for undo stack UI */
  readonly description: string;

  constructor(
    private reorderPlugin: ColumnReorderPlugin,
    private columnId: string,
    private fromIndex: number,
    private toIndex: number
  ) {
    this.description = `Move column from position ${fromIndex + 1} to ${toIndex + 1}`;
  }

  /**
   * Execute the command - move column to new position
   */
  execute(): void {
    this.reorderPlugin.move(this.columnId, this.toIndex);
  }

  /**
   * Undo the command - move column back to original position
   */
  undo(): void {
    this.reorderPlugin.move(this.columnId, this.fromIndex);
  }

  /**
   * Redo the command - same as execute
   */
  redo(): void {
    this.execute();
  }

  /**
   * Get column ID
   */
  getColumnId(): string {
    return this.columnId;
  }

  /**
   * Get source index
   */
  getFromIndex(): number {
    return this.fromIndex;
  }

  /**
   * Get target index
   */
  getToIndex(): number {
    return this.toIndex;
  }
}
