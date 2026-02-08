/**
 * RowHeightManager - Orchestrates dynamic row height measurement and updates
 *
 * Responsibilities:
 * - Measure actual row heights after rendering
 * - Batch height updates for performance
 * - Invalidate measurements when data/columns change
 * - Coordinate with HeightProvider for efficient updates
 *
 * Architecture:
 * - Measurement happens after cells are rendered
 * - Updates are batched and debounced to prevent layout thrashing
 * - Height provider handles efficient storage and queries
 * - Virtual scroller receives notifications for re-layout
 */

import type { HeightProvider } from '../../rendering/height-provider/height-provider.interface';
import type { ColumnDef } from '../../types/column';
import type { RowHeightConfig } from '../../types/grid';

/**
 * Row height mode configuration
 * - fixed: All rows use default height (no measurement)
 * - auto: All rows measured after render
 * - content-aware: Only rows/columns marked for auto-height are measured
 */
export type RowHeightMode = 'fixed' | 'auto' | 'content-aware';

/**
 * Options for RowHeightManager
 */
export interface RowHeightManagerOptions {
  /** Row height mode */
  mode: RowHeightMode;
  /** Height configuration */
  config: Partial<RowHeightConfig> & { defaultHeight?: number };
  /** Height provider for storing and querying heights */
  heightProvider: HeightProvider;
  /** Column definitions */
  columns: ColumnDef[];
  /** Callback when heights are updated */
  onHeightUpdate?: (updates: Map<number, number>) => void;
}

/**
 * RowHeightManager - Configuration holder for dynamic row heights
 * Measurement logic is handled by CellPositioner
 */
export class RowHeightManager {
  private mode: RowHeightMode;
  private config: {
    defaultHeight: number;
    minHeight: number;
    maxHeight: number;
    heightAffectingColumns: string[];
  };
  private columns: ColumnDef[];

  // Column indices that affect height (for content-aware mode)
  private heightAffectingColumnIndices: Set<number>;

  constructor(options: RowHeightManagerOptions) {
    this.mode = options.mode;
    this.config = {
      defaultHeight: options.config.defaultHeight ?? 30,
      minHeight: options.config.minHeight ?? 20,
      maxHeight: options.config.maxHeight ?? 500,
      heightAffectingColumns: options.config.heightAffectingColumns ?? [],
    };
    this.columns = options.columns;

    // Build index of height-affecting columns
    this.heightAffectingColumnIndices = this.buildHeightAffectingIndices();
  }

  /**
   * Build set of column indices that affect row height
   */
  private buildHeightAffectingIndices(): Set<number> {
    const indices = new Set<number>();

    if (this.mode === 'auto') {
      // In auto mode, all columns affect height
      this.columns.forEach((_, index) => indices.add(index));
      return indices;
    }

    // In content-aware mode, only specific columns
    this.columns.forEach((col, index) => {
      // Check column-level flag
      if (col.autoHeight) {
        indices.add(index);
      }
      // Check if column field is in heightAffectingColumns list
      if (col.field && this.config.heightAffectingColumns.includes(col.field)) {
        indices.add(index);
      }
    });

    return indices;
  }

  /**
   * Check if a row needs height measurement
   * Used by CellPositioner to determine which rows to measure
   * @param _row - Row index (unused, kept for API consistency)
   */
  needsMeasurement(_row: number): boolean {
    // Fixed mode never measures
    if (this.mode === 'fixed') {
      return false;
    }

    // Auto mode always measures (unless already cached by CellPositioner)
    if (this.mode === 'auto') {
      return true;
    }

    // Content-aware mode: only if row has height-affecting columns
    return this.heightAffectingColumnIndices.size > 0;
  }

  /**
   * Update columns (e.g., when grid config changes)
   */
  updateColumns(columns: ColumnDef[]): void {
    this.columns = columns;
    this.heightAffectingColumnIndices = this.buildHeightAffectingIndices();
  }

  /**
   * Get current mode
   */
  getMode(): RowHeightMode {
    return this.mode;
  }

  /**
   * Change mode at runtime
   */
  setMode(mode: RowHeightMode): void {
    if (this.mode === mode) {
      return;
    }

    this.mode = mode;
    this.heightAffectingColumnIndices = this.buildHeightAffectingIndices();
  }

  /**
   * Get configuration stats (for debugging)
   */
  getStats() {
    return {
      mode: this.mode,
      heightAffectingColumns: this.heightAffectingColumnIndices.size,
      defaultHeight: this.config.defaultHeight,
      minHeight: this.config.minHeight,
      maxHeight: this.config.maxHeight,
    };
  }
}
