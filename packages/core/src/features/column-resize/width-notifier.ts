import type { ResizableDataSource } from './column-resize-manager.interface';
import type { ResizeStateManager } from './resize-state-manager';

/**
 * Notifies about width changes for persistence
 */
export class WidthNotifier {
  constructor(
    private dataSource: ResizableDataSource,
    private stateManager: ResizeStateManager
  ) {}

  /**
   * Notify about width changes (for persistence)
   */
  notifyWidthChange(): void {
    const colCount = this.dataSource.getColumnCount();
    const widths: number[] = [];
    for (let col = 0; col < colCount; col++) {
      widths.push(this.dataSource.getColumnWidth(col));
    }
    this.stateManager.notifyWidthChange(widths);
  }
}
