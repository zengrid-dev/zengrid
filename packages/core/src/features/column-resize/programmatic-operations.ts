import type { EventEmitter } from '../../events/event-emitter';
import type { GridEvents } from '../../events/grid-events';
import type { ResizableDataSource } from './column-resize-manager.interface';
import type { ResizeConstraintManager } from './resize-constraint-manager';
import type { ResizeStateManager } from './resize-state-manager';
import type { AutoFitCalculator } from './auto-fit-calculator';

export interface OperationsConfig {
  dataSource: ResizableDataSource;
  constraintManager: ResizeConstraintManager;
  stateManager: ResizeStateManager;
  autoFitCalculator: AutoFitCalculator | null;
  events?: EventEmitter<GridEvents>;
  onWidthChange: () => void;
  onUpdateHandles: () => void;
}

/**
 * Handles programmatic column resize operations
 */
export class ProgrammaticOperations {
  constructor(private config: OperationsConfig) {}

  /**
   * Auto-fit a single column
   */
  autoFitColumn(column: number): void {
    if (!this.config.autoFitCalculator) return;

    const oldWidth = this.config.dataSource.getColumnWidth(column);
    const optimalWidth = this.config.autoFitCalculator.calculateOptimalWidth(column);
    const constrainedWidth = this.config.constraintManager.applyConstraints(column, optimalWidth);

    this.config.dataSource.setColumnWidth(column, constrainedWidth);

    // Record and emit
    this.config.stateManager.recordResize(column, oldWidth, constrainedWidth);

    if (this.config.events && constrainedWidth !== oldWidth) {
      this.config.events.emit('column:resize', {
        column,
        oldWidth,
        newWidth: constrainedWidth,
      });
    }

    this.config.onWidthChange();
    this.config.onUpdateHandles();
  }

  /**
   * Auto-fit all columns
   */
  autoFitAllColumns(): void {
    if (!this.config.autoFitCalculator) return;

    const colCount = this.config.dataSource.getColumnCount();
    for (let col = 0; col < colCount; col++) {
      this.autoFitColumn(col);
    }
  }

  /**
   * Resize a column programmatically
   */
  resizeColumn(column: number, width: number): void {
    const oldWidth = this.config.dataSource.getColumnWidth(column);
    const constrainedWidth = this.config.constraintManager.applyConstraints(column, width);

    this.config.dataSource.setColumnWidth(column, constrainedWidth);

    // Record and emit
    this.config.stateManager.recordResize(column, oldWidth, constrainedWidth);

    if (this.config.events && constrainedWidth !== oldWidth) {
      this.config.events.emit('column:resize', {
        column,
        oldWidth,
        newWidth: constrainedWidth,
      });
    }

    this.config.onWidthChange();
    this.config.onUpdateHandles();
  }
}
