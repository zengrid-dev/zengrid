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
   * Auto-fit all columns (batched to avoid layout thrashing)
   */
  autoFitAllColumns(): void {
    if (!this.config.autoFitCalculator) return;

    const colCount = this.config.dataSource.getColumnCount();

    // Phase 1: Batch all reads (measure optimal widths)
    const widths: Array<{ col: number; oldWidth: number; newWidth: number }> = [];
    for (let col = 0; col < colCount; col++) {
      const oldWidth = this.config.dataSource.getColumnWidth(col);
      const optimalWidth = this.config.autoFitCalculator.calculateOptimalWidth(col);
      const constrainedWidth = this.config.constraintManager.applyConstraints(col, optimalWidth);
      if (constrainedWidth !== oldWidth) {
        widths.push({ col, oldWidth, newWidth: constrainedWidth });
      }
    }

    // Phase 2: Batch all writes (apply widths)
    for (const { col, oldWidth, newWidth } of widths) {
      this.config.dataSource.setColumnWidth(col, newWidth);
      this.config.stateManager.recordResize(col, oldWidth, newWidth);
      if (this.config.events) {
        this.config.events.emit('column:resize', { column: col, oldWidth, newWidth });
      }
    }

    // Phase 3: Single DOM update
    if (widths.length > 0) {
      this.config.onWidthChange();
      this.config.onUpdateHandles();
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
