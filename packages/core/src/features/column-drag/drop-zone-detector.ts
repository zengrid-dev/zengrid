/**
 * Drop Zone Detector
 *
 * @description
 * Detects drop position based on mouse coordinates relative to column headers.
 * Calculates which column the mouse is over and whether it's before/after that column.
 */

import type { ColumnModel } from '../columns/column-model';
import type {
  DropZoneResult,
  DropPosition,
  ColumnDragOptions,
} from './column-drag-manager.interface';

/**
 * Detects drop zones during column drag operations
 */
export class DropZoneDetector {
  private columnModel: ColumnModel;
  private getScrollLeft: () => number;
  private lockedColumns: Set<string>;
  private noDropColumns: Set<string>;

  constructor(options: ColumnDragOptions) {
    this.columnModel = options.columnModel;
    this.getScrollLeft = options.getScrollLeft ?? (() => 0);
    this.lockedColumns = options.lockedColumns ?? new Set();
    this.noDropColumns = options.noDropColumns ?? new Set();
  }

  /**
   * Detect drop zone at given coordinates
   *
   * @param x Mouse X position relative to container
   * @param sourceColumnId Column being dragged (to exclude from detection)
   * @returns Drop zone result
   */
  detect(x: number, sourceColumnId: string): DropZoneResult {
    const scrollLeft = this.getScrollLeft();
    const adjustedX = x + scrollLeft;

    // Get visible columns sorted by order (excluding source column)
    const columns = this.columnModel
      .getColumns()
      .filter((col) => col.visible && col.id !== sourceColumnId)
      .sort((a, b) => a.order - b.order);

    if (columns.length === 0) {
      return this.createInvalidResult();
    }

    let cumulativeX = 0;

    for (const column of columns) {
      const colStart = cumulativeX;
      const colEnd = colStart + column.actualWidth;
      const colMid = (colStart + colEnd) / 2;

      // Check if mouse is over this column
      if (adjustedX >= colStart && adjustedX < colEnd) {
        // Determine if before or after based on midpoint
        const position: DropPosition = adjustedX < colMid ? 'before' : 'after';
        const indicatorX = position === 'before' ? colStart : colEnd;

        // Check if this column can receive drops
        if (this.noDropColumns.has(column.id)) {
          return this.createInvalidResult();
        }

        return {
          valid: true,
          columnId: column.id,
          columnIndex: column.order,
          position,
          // Return absolute position within full header content (not adjusted for scroll)
          // Drop indicator uses position:absolute within scrollable header container
          indicatorX: indicatorX,
        };
      }

      cumulativeX = colEnd;
    }

    // If past all columns, drop at end
    const lastColumn = columns[columns.length - 1];
    if (adjustedX >= cumulativeX) {
      if (this.noDropColumns.has(lastColumn.id)) {
        return this.createInvalidResult();
      }

      return {
        valid: true,
        columnId: lastColumn.id,
        columnIndex: lastColumn.order,
        position: 'after',
        // Return absolute position within full header content (not adjusted for scroll)
        indicatorX: cumulativeX,
      };
    }

    return this.createInvalidResult();
  }

  /**
   * Calculate final drop index based on source and target
   *
   * @param sourceIndex Current position of dragged column
   * @param targetIndex Position of target column
   * @param position Whether dropping before or after target
   * @returns Final index for the column
   */
  calculateDropIndex(sourceIndex: number, targetIndex: number, position: DropPosition): number {
    let dropIndex = position === 'before' ? targetIndex : targetIndex + 1;

    // Adjust for source position
    // If dragging from left to right, we need to account for the column being removed
    if (sourceIndex < dropIndex) {
      dropIndex -= 1;
    }

    return dropIndex;
  }

  /**
   * Check if a column can be dragged
   */
  canDragColumn(columnId: string): boolean {
    return !this.lockedColumns.has(columnId);
  }

  /**
   * Check if a column can receive drops
   */
  canDropOnColumn(columnId: string): boolean {
    return !this.noDropColumns.has(columnId);
  }

  /**
   * Update locked columns
   */
  setLockedColumns(columns: Set<string>): void {
    this.lockedColumns = columns;
  }

  /**
   * Update no-drop columns
   */
  setNoDropColumns(columns: Set<string>): void {
    this.noDropColumns = columns;
  }

  private createInvalidResult(): DropZoneResult {
    return {
      valid: false,
      columnId: null,
      columnIndex: -1,
      position: 'before',
      indicatorX: 0,
    };
  }
}
