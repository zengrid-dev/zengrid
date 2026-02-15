/**
 * Column Drag-and-Drop Manager - Type Definitions
 *
 * @description
 * Defines types and interfaces for the column drag-and-drop feature.
 * Supports mouse, touch, and keyboard interactions with visual feedback.
 */

import type { EventEmitter } from '../../events/event-emitter';
import type { GridEvents } from '../../events/grid-events';
import type { ColumnModel } from '../columns/column-model';
import type { ColumnDef } from '../../types/column';
import type { ICommandStack } from '@zengrid/shared';

/**
 * Drag state during drag operation
 */
export type DragState = 'idle' | 'pending' | 'dragging' | 'dropping' | 'cancelled';

/**
 * Drag event types for StateMachine
 */
export type DragEvent =
  | 'mousedown'
  | 'dragstart'
  | 'drag'
  | 'drop'
  | 'cancel'
  | 'reset';

/**
 * Drop position relative to a column
 */
export type DropPosition = 'before' | 'after';

/**
 * Configuration for ColumnDragManager
 */
export interface ColumnDragOptions {
  /** Event emitter for grid events */
  events?: EventEmitter<GridEvents>;

  /** Column model for reactive state management */
  columnModel: ColumnModel;

  /** Enable column drag (default: true) */
  enabled?: boolean;

  /** Minimum drag distance to start drag (default: 5px) */
  dragThreshold?: number;

  /** Enable ghost element preview (default: true) */
  showGhost?: boolean;

  /** Enable drop indicator line (default: true) */
  showDropIndicator?: boolean;

  /** Enable adjacent column highlights (default: true) */
  showHighlights?: boolean;

  /** Enable adjacent column highlights (alias for showHighlights) */
  showAdjacentHighlights?: boolean;

  /** Enable keyboard reordering (default: true) */
  enableKeyboard?: boolean;

  /** Enable touch support (default: true) */
  enableTouch?: boolean;

  /** Long press duration for touch drag in ms (default: 500) */
  touchLongPressDuration?: number;

  /** Command stack for undo/redo integration */
  commandStack?: ICommandStack;

  /** Get scroll left position */
  getScrollLeft?: () => number;

  /** Get viewport width */
  getViewportWidth?: () => number;

  /** Get header cell element by column ID */
  getHeaderCell?: (columnId: string) => HTMLElement | null;

  /** Columns that cannot be dragged (by column ID) */
  lockedColumns?: Set<string>;

  /** Columns that cannot receive drops (by column ID) */
  noDropColumns?: Set<string>;

  /** Auto-scroll settings for edge scrolling during drag */
  autoScroll?: AutoScrollOptions;

  /** Called before drag starts - return false to prevent */
  onBeforeDrag?: (event: BeforeDragEvent) => boolean;

  /** Called during drag - for custom animations */
  onDuringDrag?: (event: DuringDragEvent) => void;

  /** Called after drag completes */
  onAfterDrag?: (event: AfterDragEvent) => void;
}

/**
 * Auto-scroll configuration
 */
export interface AutoScrollOptions {
  /** Enable auto-scroll (default: true) */
  enabled?: boolean;
  /** Edge zone width in px (default: 50) */
  edgeZone?: number;
  /** Scroll speed in px/frame (default: 10) */
  speed?: number;
}

/**
 * Current drag state snapshot
 */
export interface DragStateSnapshot {
  /** Current state machine state */
  state: DragState;
  /** Column being dragged (by ID) */
  sourceColumnId: string | null;
  /** Source column index */
  sourceIndex: number;
  /** Current drop target column ID */
  targetColumnId: string | null;
  /** Target column index */
  targetIndex: number;
  /** Drop position relative to target */
  dropPosition: DropPosition | null;
  /** Start X position of drag */
  startX: number;
  /** Start Y position of drag */
  startY: number;
  /** Current X position */
  currentX: number;
  /** Current Y position */
  currentY: number;
}

/**
 * Drop zone detection result
 */
export interface DropZoneResult {
  /** Whether a valid drop zone was found */
  valid: boolean;
  /** Target column ID */
  columnId: string | null;
  /** Target column index */
  columnIndex: number;
  /** Position relative to target column */
  position: DropPosition;
  /** X position for drop indicator */
  indicatorX: number;
}

/**
 * Header hit-test result for drag initiation
 */
export interface HeaderHitResult {
  /** Whether hit is on a draggable header */
  isDraggable: boolean;
  /** Column ID if hit */
  columnId: string | null;
  /** Column index */
  columnIndex: number;
  /** Header element rect */
  rect: DOMRect | null;
}

/**
 * Before drag lifecycle event
 */
export interface BeforeDragEvent {
  /** Column being dragged */
  columnId: string;
  /** Column definition */
  column: ColumnDef;
  /** Column index */
  columnIndex: number;
  /** Original mouse event */
  nativeEvent: MouseEvent | TouchEvent;
  /** Prevent drag */
  preventDefault: () => void;
}

/**
 * During drag lifecycle event
 */
export interface DuringDragEvent {
  /** Column being dragged */
  sourceColumnId: string;
  /** Current position */
  currentX: number;
  currentY: number;
  /** Drop zone info */
  dropZone: DropZoneResult | null;
}

/**
 * After drag lifecycle event
 */
export interface AfterDragEvent {
  /** Column that was dragged */
  columnId: string;
  /** Original index */
  fromIndex: number;
  /** New index */
  toIndex: number;
  /** Whether drag was cancelled */
  cancelled: boolean;
}

/**
 * Column drag events to add to GridEvents interface
 */
export interface ColumnDragEvents {
  'column:dragStart': {
    columnId: string;
    columnIndex: number;
    column: ColumnDef;
    nativeEvent: MouseEvent | TouchEvent;
  };

  'column:drag': {
    columnId: string;
    currentX: number;
    currentY: number;
    targetColumnId: string | null;
    targetIndex: number;
    dropPosition: DropPosition | null;
  };

  'column:dragEnd': {
    columnId: string;
    fromIndex: number;
    toIndex: number;
    cancelled: boolean;
  };

  'column:dragCancel': {
    columnId: string;
    columnIndex: number;
    reason: 'escape' | 'invalid-drop' | 'programmatic';
  };
}

/**
 * Keyboard handler options
 */
export interface KeyboardHandlerOptions {
  /** Column model */
  columnModel: ColumnModel;
  /** Event emitter */
  events?: EventEmitter<GridEvents>;
  /** Get header cell by column ID */
  getHeaderCell?: (columnId: string) => HTMLElement | null;
}

/**
 * Touch handler options
 */
export interface TouchHandlerOptions {
  /** Drag threshold in pixels */
  dragThreshold?: number;
  /** Long press duration in ms (default: 500) */
  longPressDuration?: number;
}

/**
 * Visual feedback options
 */
export interface VisualFeedbackOptions {
  /** Show ghost element */
  showGhost?: boolean;
  /** Show drop indicator */
  showDropIndicator?: boolean;
  /** Show highlights on adjacent columns */
  showHighlights?: boolean;
  /** Get header container element */
  getHeaderContainer?: () => HTMLElement | null;
}

/**
 * Callbacks for mouse handler to communicate with manager
 */
export interface DragMouseEventCallbacks {
  /** Check if column can be dragged */
  canDragColumn: (columnId: string) => boolean;
  /** Get column by ID */
  getColumn: (columnId: string) => { definition: ColumnDef; order: number } | null;
  /** Get current drag state */
  getState: () => DragState;
  /** Get drag distance */
  getDragDistance: () => number;
  /** Called on mousedown */
  onMouseDown: (columnId: string, columnIndex: number, x: number, y: number) => void;
  /** Called on mousemove */
  onMouseMove: (x: number, y: number) => void;
  /** Called on mouseup */
  onMouseUp: () => void;
  /** Called when drag starts (threshold met) */
  onDragStart: (event: MouseEvent, target: HTMLElement) => void;
}
