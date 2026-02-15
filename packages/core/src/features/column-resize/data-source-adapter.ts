import type { ResizableDataSource } from './column-resize-manager.interface';

/**
 * Adapter to make Grid callbacks compatible with ResizableDataSource interface
 */
export class DataSourceAdapter implements ResizableDataSource {
  constructor(
    private colCount: number,
    private getColOffset: (col: number) => number,
    private getColWidth: (col: number) => number,
    private setColWidth: (col: number, width: number) => void,
    private getValueFn?: (row: number, col: number) => any,
    private rowCount?: number
  ) {}

  getColumnCount(): number {
    return this.colCount;
  }

  getColumnOffset(col: number): number {
    return this.getColOffset(col);
  }

  getColumnWidth(col: number): number {
    return this.getColWidth(col);
  }

  setColumnWidth(col: number, width: number): void {
    this.setColWidth(col, width);
  }

  getValue(row: number, col: number): any {
    return this.getValueFn?.(row, col);
  }

  getRowCount(): number {
    return this.rowCount ?? 0;
  }
}
