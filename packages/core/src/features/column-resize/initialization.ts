import type { ColumnResizeOptions } from './column-resize-manager.interface';
import { ResizeConstraintManager } from './resize-constraint-manager';
import { ResizeZoneDetector } from './resize-zone-detector';
import { ResizeStateManager } from './resize-state-manager';
import { AutoFitCalculator } from './auto-fit-calculator';
import { DataSourceAdapter } from './data-source-adapter';
import { SingleColumnResizeStrategy } from './resize-strategies';
import type { ResizeStrategy, ResizableDataSource } from './column-resize-manager.interface';

export interface InitializedComponents {
  dataSource: ResizableDataSource;
  constraintManager: ResizeConstraintManager;
  zoneDetector: ResizeZoneDetector;
  stateManager: ResizeStateManager;
  strategy: ResizeStrategy;
  autoFitCalculator: AutoFitCalculator | null;
}

/**
 * Initialize all components for column resize manager
 */
export function initializeComponents(
  options: ColumnResizeOptions
): InitializedComponents {
  // Create data source adapter
  const dataSource = new DataSourceAdapter(
    options.colCount,
    options.getColOffset,
    options.getColWidth,
    options.onWidthChange,
    options.getValue,
    options.rowCount
  );

  // Initialize sub-managers
  const constraintManager = new ResizeConstraintManager({
    defaultConstraints: options.defaultConstraints,
    columnConstraints: options.columnConstraints,
    onValidateResize: options.onValidateResize,
    constraintProvider: options.constraintProvider,
  });

  const zoneDetector = new ResizeZoneDetector({
    resizeZoneWidth: options.resizeZoneWidth,
  });

  const stateManager = new ResizeStateManager({
    onColumnWidthsChange: options.onColumnWidthsChange,
    undoRedoManager: options.undoRedoManager,
  });

  // Initialize strategy
  const strategy = options.strategy ?? new SingleColumnResizeStrategy();

  // Initialize auto-fit calculator if getValue is provided
  let autoFitCalculator: AutoFitCalculator | null = null;
  if (options.getValue && options.rowCount) {
    autoFitCalculator = new AutoFitCalculator({
      getValue: options.getValue,
      rowCount: options.rowCount,
      getHeaderText: options.getHeaderText,
      getFullHeaderWidth: options.getFullHeaderWidth,
      sampleSize: options.autoFitSampleSize ?? 100,
      padding: options.autoFitPadding ?? 16,
      skipHeaderOnAutoSize: options.skipHeaderOnAutoSize ?? false,
    });
  }

  return {
    dataSource,
    constraintManager,
    zoneDetector,
    stateManager,
    strategy,
    autoFitCalculator,
  };
}
