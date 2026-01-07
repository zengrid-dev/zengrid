/**
 * Cell, range, and position types
 */

/**
 * Cell reference
 */
export interface CellRef {
  row: number;
  col: number;
}

/**
 * Cell range
 */
export interface CellRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

/**
 * Visible range with overscan
 */
export interface VisibleRange {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

/**
 * Scroll position
 */
export interface ScrollPosition {
  top: number;
  left: number;
}

/**
 * Cell position (in pixels)
 */
export interface CellPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Viewport dimensions
 */
export interface ViewportDimensions {
  width: number;
  height: number;
}
