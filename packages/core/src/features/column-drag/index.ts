/**
 * Column Drag Feature - Public API
 *
 * @description
 * Exports public APIs for column drag-and-drop functionality.
 */

// Main manager
export { ColumnDragManager } from './column-drag-manager';

// Sub-managers and utilities
export { DragStateManager } from './drag-state-manager';
export { DropZoneDetector } from './drop-zone-detector';
export { DragVisualFeedback } from './drag-visual-feedback';
export { DragKeyboardHandler } from './drag-keyboard-handler';
export { DragTouchHandler } from './drag-touch-handler';
export { ColumnDragCommand } from './column-drag-command';

// Types and interfaces
export type {
  DragState,
  DragEvent,
  DropPosition,
  ColumnDragOptions,
  AutoScrollOptions,
  DragStateSnapshot,
  DropZoneResult,
  HeaderHitResult,
  BeforeDragEvent,
  DuringDragEvent,
  AfterDragEvent,
  ColumnDragEvents,
  KeyboardHandlerOptions,
  TouchHandlerOptions,
  VisualFeedbackOptions,
} from './column-drag-manager.interface';
