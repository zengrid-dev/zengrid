/**
 * Column Drag Manager
 *
 * @description
 * Orchestrates column drag-and-drop reordering.
 * Manages state machine, visual feedback, and integration with ColumnReorderPlugin.
 *
 * @example
 * ```typescript
 * const dragManager = new ColumnDragManager({
 *   columnModel,
 *   events,
 *   commandStack,
 *   getScrollLeft: () => grid.getScrollLeft(),
 *   getHeaderCell: (id) => grid.getHeaderCell(id),
 * });
 *
 * dragManager.attach(headerContainer);
 * ```
 */

import { throttle } from '@zengrid/shared';
import type { ThrottledFunction, StateMachine } from '@zengrid/shared';
import type { ColumnReorderPlugin } from '../columns/plugins/column-reorder';
import { DragStateManager } from './drag-state-manager';
import { DropZoneDetector } from './drop-zone-detector';
import { DragVisualFeedback } from './drag-visual-feedback';
import { DragKeyboardHandler } from './drag-keyboard-handler';
import { DragTouchHandler } from './drag-touch-handler';
import { DragMouseHandler } from './drag-mouse-handler';
import { createDragStateMachine } from './drag-state-machine';
import { DragOperations } from './drag-operations';
import { DragEventHandlers } from './drag-event-handlers';
import { DragLifecycle } from './drag-lifecycle';
import { createMouseCallbacks } from './drag-callbacks';
import type {
  DragState,
  DragEvent,
  ColumnDragOptions,
  DragStateSnapshot,
} from './column-drag-manager.interface';

/**
 * Column Drag Manager - Main orchestrator for column drag-and-drop
 *
 * Architecture:
 * - Uses StateMachine for predictable state transitions
 * - Delegates to specialized sub-managers
 * - Integrates with ColumnReorderPlugin for actual reordering
 * - Supports mouse, touch, and keyboard interactions
 */
export class ColumnDragManager {
  private enabled: boolean;
  private stateMachine: StateMachine<DragState, DragEvent>;
  private stateManager: DragStateManager;
  private dragOperations: DragOperations;
  private eventHandlers: DragEventHandlers;
  private lifecycle: DragLifecycle;
  private mouseHandler: DragMouseHandler;
  private dragThresholdMet = false;

  constructor(options: ColumnDragOptions, reorderPlugin: ColumnReorderPlugin) {
    this.enabled = options.enabled ?? true;

    // Initialize sub-managers
    this.stateManager = new DragStateManager();
    const dropZoneDetector = new DropZoneDetector(options);

    const visualFeedback = new DragVisualFeedback({
      showGhost: options.showGhost ?? true,
      showDropIndicator: options.showDropIndicator ?? true,
      showHighlights: options.showAdjacentHighlights ?? true,
      getHeaderContainer: () => this.lifecycle.getContainer(),
    });

    const keyboardHandler = new DragKeyboardHandler(
      {
        columnModel: options.columnModel,
        events: options.events,
        getHeaderCell: options.getHeaderCell,
      },
      reorderPlugin
    );

    // Initialize event handlers (state transitions + keyboard)
    this.eventHandlers = new DragEventHandlers(
      this.stateManager,
      keyboardHandler,
      null as any, // Will be set after stateMachine is created
      (reason) => this.dragOperations.cancelDrag(reason)
    );

    // Initialize state machine
    this.stateMachine = createDragStateMachine(
      this.eventHandlers.handleStateTransition.bind(this.eventHandlers)
    );

    // Re-initialize event handlers with real state machine
    this.eventHandlers = new DragEventHandlers(
      this.stateManager,
      keyboardHandler,
      this.stateMachine,
      (reason) => this.dragOperations.cancelDrag(reason)
    );

    // Initialize drag operations
    this.dragOperations = new DragOperations(
      this.stateMachine,
      this.stateManager,
      dropZoneDetector,
      visualFeedback,
      reorderPlugin,
      options.columnModel,
      options.events,
      options.onDuringDrag,
      options.onAfterDrag,
      () => this.lifecycle.getContainer(),
      (value) => {
        this.dragThresholdMet = value;
      }
    );

    // Throttled drag for performance (60fps)
    const throttledDrag: ThrottledFunction<(x: number, y: number) => void> = throttle(
      this.dragOperations.performDrag.bind(this.dragOperations),
      16
    );

    // Mouse callbacks
    const mouseCallbacks = createMouseCallbacks(
      dropZoneDetector,
      options.columnModel,
      this.stateMachine,
      this.stateManager,
      visualFeedback,
      options.events,
      () => this.dragThresholdMet,
      (value) => {
        this.dragThresholdMet = value;
      },
      (reason) => this.dragOperations.cancelDrag(reason),
      () => this.dragOperations.commitDrop()
    );

    // Initialize mouse handler
    this.mouseHandler = new DragMouseHandler(
      {
        enabled: this.enabled,
        dragThreshold: options.dragThreshold ?? 5,
        onBeforeDrag: options.onBeforeDrag,
      },
      mouseCallbacks,
      throttledDrag
    );

    // Initialize touch handler
    const touchHandler = new DragTouchHandler({
      dragThreshold: options.dragThreshold ?? 5,
      longPressDuration: options.touchLongPressDuration ?? 500,
    });

    // Set up touch handler callbacks
    touchHandler.setCallbacks({
      onDragStart: (columnId, x, y, event) => {
        const column = options.columnModel.getColumn(columnId);
        if (!column) return;

        this.stateManager.startDrag(columnId, column.order, x, y);
        this.dragThresholdMet = true;
        this.stateMachine.transition('mousedown');
        this.stateMachine.transition('dragstart');

        const headerElement = (event.target as HTMLElement).closest(
          '[data-column-id]'
        ) as HTMLElement;
        if (headerElement) {
          visualFeedback.startDrag(headerElement, x, y);
        }

        options.events?.emit('column:dragStart', {
          columnId,
          columnIndex: column.order,
          column: column.definition,
          nativeEvent: event,
        });
      },
      onDragMove: (x, y, _event) => {
        if (this.stateMachine.is('dragging')) {
          this.dragOperations.performDrag(x, y);
        }
      },
      onDragEnd: (_x, _y, _event) => {
        if (this.stateMachine.is('dragging')) {
          this.dragOperations.commitDrop();
        }
      },
      onDragCancel: () => {
        this.dragOperations.cancelDrag('programmatic');
      },
    });

    // Initialize lifecycle
    this.lifecycle = new DragLifecycle(
      this.enabled,
      this.mouseHandler,
      touchHandler,
      visualFeedback,
      this.eventHandlers.handleKeyDown.bind(this.eventHandlers)
    );
  }

  /**
   * Attach drag listeners to container
   */
  attach(container: HTMLElement): void {
    this.lifecycle.attach(container);
  }

  /**
   * Detach all event listeners
   */
  detach(): void {
    this.lifecycle.detach();
  }

  /**
   * Check if currently dragging
   */
  isDragging(): boolean {
    return this.stateMachine.is('dragging');
  }

  /**
   * Get current drag state
   */
  getState(): DragStateSnapshot {
    return this.stateManager.getState();
  }

  /**
   * Cancel current drag (programmatic)
   */
  cancel(): void {
    if (this.stateMachine.is('dragging')) {
      this.dragOperations.cancelDrag('programmatic');
    }
  }

  /**
   * Enable drag
   */
  enable(): void {
    this.enabled = true;
    this.mouseHandler.enable();
  }

  /**
   * Disable drag
   */
  disable(): void {
    this.enabled = false;
    this.mouseHandler.disable();
    if (this.isDragging()) {
      this.cancel();
    }
  }

  /**
   * Destroy manager and cleanup
   */
  destroy(): void {
    this.lifecycle.detach();
    this.stateManager.reset();
  }
}
