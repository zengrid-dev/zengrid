/**
 * Drag Operations Handler
 *
 * @description
 * Handles drag operations: performDrag, commitDrop, cancelDrag, reset.
 */

import type { StateMachine } from '@zengrid/shared';
import type { ColumnReorderPlugin } from '../columns/plugins/column-reorder';
import type { DragStateManager } from './drag-state-manager';
import type { DropZoneDetector } from './drop-zone-detector';
import type { DragVisualFeedback } from './drag-visual-feedback';
import type {
  DragState,
  DragEvent,
  ColumnDragOptions,
} from './column-drag-manager.interface';

export class DragOperations {
  constructor(
    private stateMachine: StateMachine<DragState, DragEvent>,
    private stateManager: DragStateManager,
    private dropZoneDetector: DropZoneDetector,
    private visualFeedback: DragVisualFeedback,
    private reorderPlugin: ColumnReorderPlugin,
    private columnModel: ColumnDragOptions['columnModel'],
    private events: ColumnDragOptions['events'],
    private onDuringDrag: ColumnDragOptions['onDuringDrag'],
    private onAfterDrag: ColumnDragOptions['onAfterDrag'],
    private getContainer: () => HTMLElement | null,
    private dragThresholdMetGetter: () => boolean,
    private dragThresholdMetSetter: (value: boolean) => void
  ) {}

  /**
   * Perform drag operation (throttled)
   */
  performDrag(x: number, y: number): void {
    const sourceColumnId = this.stateManager.getSourceColumnId();
    const container = this.getContainer();
    if (!sourceColumnId || !container) return;

    // Convert viewport coordinates to container-relative coordinates
    const containerRect = container.getBoundingClientRect();
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
        if (headerCell && container) {
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
   * Commit the drop operation
   */
  commitDrop(): void {
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
  cancelDrag(reason: 'escape' | 'invalid-drop' | 'programmatic'): void {
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
  reset(): void {
    // Hide all visual feedback
    this.visualFeedback.endDrag();

    this.stateManager.reset();
    this.dragThresholdMetSetter(false);
    this.stateMachine.transition('reset');
  }
}
