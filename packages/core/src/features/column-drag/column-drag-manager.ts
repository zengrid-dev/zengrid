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

import { StateMachine, throttle } from '@zengrid/shared';
import type { ThrottledFunction } from '@zengrid/shared';
import type { ColumnReorderPlugin } from '../columns/plugins/column-reorder';
import { DragStateManager } from './drag-state-manager';
import { DropZoneDetector } from './drop-zone-detector';
import { DragVisualFeedback } from './drag-visual-feedback';
import { DragKeyboardHandler } from './drag-keyboard-handler';
import { DragTouchHandler } from './drag-touch-handler';
import type {
  DragState,
  DragEvent,
  ColumnDragOptions,
  DragStateSnapshot,
  BeforeDragEvent,
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
  // Core dependencies
  private enabled: boolean;
  private columnModel: ColumnDragOptions['columnModel'];
  private reorderPlugin: ColumnReorderPlugin;
  private events?: ColumnDragOptions['events'];

  // Configuration
  private dragThreshold: number;
  private onBeforeDrag?: ColumnDragOptions['onBeforeDrag'];
  private onDuringDrag?: ColumnDragOptions['onDuringDrag'];
  private onAfterDrag?: ColumnDragOptions['onAfterDrag'];

  // State machine for drag lifecycle
  private stateMachine: StateMachine<DragState, DragEvent>;

  // Sub-managers
  private stateManager: DragStateManager;
  private dropZoneDetector: DropZoneDetector;
  private visualFeedback: DragVisualFeedback;
  private keyboardHandler: DragKeyboardHandler;
  private touchHandler: DragTouchHandler;

  // Event handlers (bound for cleanup)
  private boundHandleMouseDown: (e: MouseEvent) => void;
  private boundHandleMouseMove: (e: MouseEvent) => void;
  private boundHandleMouseUp: (e: MouseEvent) => void;
  private boundHandleKeyDown: (e: KeyboardEvent) => void;

  // Throttled drag handler for performance
  private throttledDrag: ThrottledFunction<(x: number, y: number) => void>;

  // Container reference
  private container: HTMLElement | null = null;

  // Track if drag threshold was met
  private dragThresholdMet = false;

  constructor(options: ColumnDragOptions, reorderPlugin: ColumnReorderPlugin) {
    this.enabled = options.enabled ?? true;
    this.columnModel = options.columnModel;
    this.reorderPlugin = reorderPlugin;
    this.events = options.events;
    this.dragThreshold = options.dragThreshold ?? 5;
    this.onBeforeDrag = options.onBeforeDrag;
    this.onDuringDrag = options.onDuringDrag;
    this.onAfterDrag = options.onAfterDrag;

    // Initialize state machine
    this.stateMachine = this.createStateMachine();

    // Initialize sub-managers
    this.stateManager = new DragStateManager();
    this.dropZoneDetector = new DropZoneDetector(options);

    // Initialize visual feedback
    this.visualFeedback = new DragVisualFeedback({
      showGhost: options.showGhost ?? true,
      showDropIndicator: options.showDropIndicator ?? true,
      showHighlights: options.showAdjacentHighlights ?? true,
      getHeaderContainer: () => this.container,
    });

    // Initialize keyboard handler
    this.keyboardHandler = new DragKeyboardHandler(
      {
        columnModel: this.columnModel,
        events: this.events,
        getHeaderCell: options.getHeaderCell,
      },
      this.reorderPlugin
    );

    // Initialize touch handler
    this.touchHandler = new DragTouchHandler({
      dragThreshold: this.dragThreshold,
      longPressDuration: options.touchLongPressDuration ?? 500,
    });

    // Set up touch handler callbacks
    this.touchHandler.setCallbacks({
      onDragStart: (columnId, x, y, event) => {
        const column = this.columnModel.getColumn(columnId);
        if (!column) return;

        // Start drag state
        this.stateManager.startDrag(columnId, column.order, x, y);
        this.dragThresholdMet = true;
        this.stateMachine.transition('mousedown');
        this.stateMachine.transition('dragstart');

        // Show visual feedback
        const headerElement = (event.target as HTMLElement).closest('[data-column-id]') as HTMLElement;
        if (headerElement) {
          this.visualFeedback.startDrag(headerElement, x, y);
        }

        // Emit dragStart event
        this.events?.emit('column:dragStart', {
          columnId,
          columnIndex: column.order,
          column: column.definition,
          nativeEvent: event,
        });
      },
      onDragMove: (x, y, _event) => {
        if (this.stateMachine.is('dragging')) {
          this.performDrag(x, y);
        }
      },
      onDragEnd: (_x, _y, _event) => {
        if (this.stateMachine.is('dragging')) {
          this.commitDrop();
        }
      },
      onDragCancel: () => {
        this.cancelDrag('programmatic');
      },
    });

    // Bind event handlers
    this.boundHandleMouseDown = this.handleMouseDown.bind(this);
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);

    // Throttled drag for performance (60fps)
    this.throttledDrag = throttle(this.performDrag.bind(this), 16);
  }

  /**
   * Create state machine with drag lifecycle transitions
   */
  private createStateMachine(): StateMachine<DragState, DragEvent> {
    const machine = new StateMachine<DragState, DragEvent>('idle', {
      strict: false,
    });

    // Define valid state transitions
    machine.addTransition('idle', 'mousedown', 'pending');
    machine.addTransition('pending', 'dragstart', 'dragging');
    machine.addTransition('pending', 'cancel', 'idle');
    machine.addTransition('dragging', 'drag', 'dragging'); // Self-transition
    machine.addTransition('dragging', 'drop', 'dropping');
    machine.addTransition('dragging', 'cancel', 'cancelled');
    machine.addTransition('dropping', 'reset', 'idle');
    machine.addTransition('cancelled', 'reset', 'idle');

    // Listen to transitions for side effects
    machine.onTransition((from, event, to) => {
      this.handleStateTransition(from, event, to);
    });

    return machine;
  }

  /**
   * Handle state machine transitions
   */
  private handleStateTransition(from: DragState, event: DragEvent, to: DragState): void {
    this.stateManager.updateState(to);

    // Log transitions in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ColumnDrag] ${from} --[${event}]--> ${to}`);
    }
  }

  /**
   * Attach drag listeners to container
   */
  attach(container: HTMLElement): void {
    if (!this.enabled) return;

    this.container = container;

    // Attach mousedown listener to container (event delegation)
    container.addEventListener('mousedown', this.boundHandleMouseDown);

    // Attach touch handler for mobile support
    this.touchHandler.attach(container);

    // Keyboard listener for Escape and delegation to keyboard handler
    document.addEventListener('keydown', this.boundHandleKeyDown);
  }

  /**
   * Detach all event listeners
   */
  detach(): void {
    if (this.container) {
      this.container.removeEventListener('mousedown', this.boundHandleMouseDown);
      this.touchHandler.detach(this.container);

      // Clean up any visual feedback
      this.visualFeedback.endDrag();

      this.container = null;
    }

    document.removeEventListener('keydown', this.boundHandleKeyDown);
    this.removeGlobalListeners();
  }

  /**
   * Handle mousedown event on header
   */
  private handleMouseDown(e: MouseEvent): void {
    if (!this.enabled || e.button !== 0) return; // Only left click

    // Find column header element
    const headerCell = (e.target as HTMLElement).closest('[data-column-id]') as HTMLElement;
    if (!headerCell) return;

    const columnId = headerCell.dataset.columnId;
    if (!columnId) return;

    // Check if column can be dragged
    if (!this.dropZoneDetector.canDragColumn(columnId)) return;

    const column = this.columnModel.getColumn(columnId);
    if (!column) return;

    // Call before drag hook
    if (this.onBeforeDrag) {
      let prevented = false;
      const beforeEvent: BeforeDragEvent = {
        columnId,
        column: column.definition,
        columnIndex: column.order,
        nativeEvent: e,
        preventDefault: () => {
          prevented = true;
        },
      };
      const result = this.onBeforeDrag(beforeEvent);
      if (result === false || prevented) return;
    }

    // Start drag state
    this.stateManager.startDrag(columnId, column.order, e.clientX, e.clientY);
    this.dragThresholdMet = false;

    // Transition to pending state
    this.stateMachine.transition('mousedown');

    // Add global listeners
    document.addEventListener('mousemove', this.boundHandleMouseMove);
    document.addEventListener('mouseup', this.boundHandleMouseUp);

    // Prevent text selection during drag
    e.preventDefault();
  }

  /**
   * Handle mousemove event
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.stateMachine.is('pending') && !this.stateMachine.is('dragging')) return;

    // Update position
    this.stateManager.updatePosition(e.clientX, e.clientY);

    // Check if drag threshold is met
    if (this.stateMachine.is('pending')) {
      const distance = this.stateManager.getDragDistance();
      if (distance >= this.dragThreshold) {
        this.dragThresholdMet = true;
        this.stateMachine.transition('dragstart');

        // Emit dragStart event
        const sourceColumnId = this.stateManager.getSourceColumnId();
        if (sourceColumnId) {
          const column = this.columnModel.getColumn(sourceColumnId);
          if (column) {
            this.events?.emit('column:dragStart', {
              columnId: sourceColumnId,
              columnIndex: column.order,
              column: column.definition,
              nativeEvent: e,
            });

            // Show visual feedback when drag starts
            const headerElement = (e.target as HTMLElement).closest('[data-column-id]') as HTMLElement;
            if (headerElement) {
              this.visualFeedback.startDrag(headerElement, e.clientX, e.clientY);
            }
          }
        }
      }
    }

    // Perform drag if in dragging state
    if (this.stateMachine.is('dragging')) {
      this.throttledDrag(e.clientX, e.clientY);
    }
  }

  /**
   * Perform drag operation (throttled)
   */
  private performDrag(x: number, y: number): void {
    const sourceColumnId = this.stateManager.getSourceColumnId();
    if (!sourceColumnId || !this.container) return;

    // Convert viewport coordinates to container-relative coordinates
    const containerRect = this.container.getBoundingClientRect();
    const containerX = x - containerRect.left;

    // Detect drop zone using container-relative coordinates
    const dropZone = this.dropZoneDetector.detect(containerX, sourceColumnId);

    // Update drop target in state
    this.stateManager.updateDropTarget(
      dropZone.columnId,
      dropZone.columnIndex,
      dropZone.position
    );

    // Update visual feedback during drag
    this.visualFeedback.updateGhostPosition(x, y);

    // Show drop indicator if valid drop zone
    if (dropZone.valid && dropZone.columnId) {
      const targetCell = this.columnModel.getColumn(dropZone.columnId);
      if (targetCell) {
        // Calculate drop indicator position based on drop position
        const getHeaderCell = (id: string) => {
          return document.querySelector(`[data-column-id="${id}"]`) as HTMLElement | null;
        };
        const headerCell = getHeaderCell(dropZone.columnId);
        if (headerCell && this.container) {
          // Drop zone detector already returns the correct absolute position
          // within the header container (accounting for scroll)
          this.visualFeedback.showDropIndicatorAt(dropZone.indicatorX);

          // Highlight adjacent columns - DISABLED by user request
          // const columns = this.columnModel.getColumns().sort((a, b) => a.order - b.order);
          // const targetIndex = targetCell.order;
          // const leftColumn = dropZone.position === 'before'
          //   ? columns[targetIndex - 1]
          //   : columns[targetIndex];
          // const rightColumn = dropZone.position === 'before'
          //   ? columns[targetIndex]
          //   : columns[targetIndex + 1];

          // this.visualFeedback.highlightAdjacentColumns(
          //   leftColumn?.id || null,
          //   rightColumn?.id || null,
          //   getHeaderCell
          // );
        }
      }
    } else {
      this.visualFeedback.hideDropIndicator();
      this.visualFeedback.clearHighlights(); // Clear any orphaned highlights
    }

    // Emit drag event
    this.events?.emit('column:drag', {
      columnId: sourceColumnId,
      currentX: x,
      currentY: y,
      targetColumnId: dropZone.columnId,
      targetIndex: dropZone.columnIndex,
      dropPosition: dropZone.position,
    });

    // Call during drag hook
    if (this.onDuringDrag) {
      this.onDuringDrag({
        sourceColumnId,
        currentX: x,
        currentY: y,
        dropZone: dropZone.valid ? dropZone : null,
      });
    }
  }

  /**
   * Handle mouseup event
   */
  private handleMouseUp(_e: MouseEvent): void {
    if (!this.stateMachine.is('pending') && !this.stateMachine.is('dragging')) return;

    // If we never met the threshold, cancel
    if (this.stateMachine.is('pending') || !this.dragThresholdMet) {
      this.cancelDrag('programmatic');
      return;
    }

    // Commit the drop
    this.commitDrop();

    // Remove global listeners
    this.removeGlobalListeners();
  }

  /**
   * Handle keyboard events
   */
  private handleKeyDown(e: KeyboardEvent): void {
    // Escape to cancel drag
    if (e.key === 'Escape' && this.stateMachine.is('dragging')) {
      this.cancelDrag('escape');
      return;
    }

    // Delegate keyboard navigation to keyboard handler
    // Find the currently focused column ID from the active element
    const activeElement = document.activeElement as HTMLElement;
    const focusedHeader = activeElement?.closest('[data-column-id]') as HTMLElement;
    const focusedColumnId = focusedHeader?.dataset.columnId || null;

    // Let keyboard handler handle the event
    if (focusedColumnId) {
      const handled = this.keyboardHandler.handleKeyDown(e, focusedColumnId);
      if (handled) {
        return; // Event was handled by keyboard handler
      }
    }
  }

  /**
   * Commit the drop operation
   */
  private commitDrop(): void {
    const sourceColumnId = this.stateManager.getSourceColumnId();
    const sourceIndex = this.stateManager.getSourceIndex();
    const targetColumnId = this.stateManager.getTargetColumnId();
    const targetIndex = this.stateManager.getTargetIndex();
    const dropPosition = this.stateManager.getDropPosition();

    if (!sourceColumnId || !targetColumnId || dropPosition === null) {
      this.cancelDrag('invalid-drop');
      return;
    }

    // Calculate final drop index
    const finalIndex = this.dropZoneDetector.calculateDropIndex(
      sourceIndex,
      targetIndex,
      dropPosition
    );

    // Perform the reorder
    this.reorderPlugin.move(sourceColumnId, finalIndex);

    // Transition to dropping state
    this.stateMachine.transition('drop');

    // Emit dragEnd event
    this.events?.emit('column:dragEnd', {
      columnId: sourceColumnId,
      fromIndex: sourceIndex,
      toIndex: finalIndex,
      cancelled: false,
    });

    // Call after drag hook
    if (this.onAfterDrag) {
      this.onAfterDrag({
        columnId: sourceColumnId,
        fromIndex: sourceIndex,
        toIndex: finalIndex,
        cancelled: false,
      });
    }

    // Reset
    this.reset();
  }

  /**
   * Cancel drag operation
   */
  private cancelDrag(reason: 'escape' | 'invalid-drop' | 'programmatic'): void {
    const sourceColumnId = this.stateManager.getSourceColumnId();
    const sourceIndex = this.stateManager.getSourceIndex();

    if (sourceColumnId !== null) {
      // Emit cancel event
      this.events?.emit('column:dragCancel', {
        columnId: sourceColumnId,
        columnIndex: sourceIndex,
        reason,
      });

      // Emit dragEnd with cancelled flag
      this.events?.emit('column:dragEnd', {
        columnId: sourceColumnId,
        fromIndex: sourceIndex,
        toIndex: sourceIndex,
        cancelled: true,
      });

      // Call after drag hook
      if (this.onAfterDrag) {
        this.onAfterDrag({
          columnId: sourceColumnId,
          fromIndex: sourceIndex,
          toIndex: sourceIndex,
          cancelled: true,
        });
      }
    }

    this.stateMachine.transition('cancel');
    this.reset();
  }

  /**
   * Reset to idle state
   */
  private reset(): void {
    // Hide all visual feedback
    this.visualFeedback.endDrag();

    this.stateManager.reset();
    this.dragThresholdMet = false;
    this.stateMachine.transition('reset');
    this.removeGlobalListeners();
  }

  /**
   * Remove global mouse listeners
   */
  private removeGlobalListeners(): void {
    document.removeEventListener('mousemove', this.boundHandleMouseMove);
    document.removeEventListener('mouseup', this.boundHandleMouseUp);
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
      this.cancelDrag('programmatic');
    }
  }

  /**
   * Enable drag
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable drag
   */
  disable(): void {
    this.enabled = false;
    if (this.isDragging()) {
      this.cancel();
    }
  }

  /**
   * Destroy manager and cleanup
   */
  destroy(): void {
    this.detach();
    this.stateManager.reset();
  }
}
