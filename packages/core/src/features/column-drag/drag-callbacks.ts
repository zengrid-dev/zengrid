/**
 * Drag Callbacks Factory
 *
 * @description
 * Creates callbacks for mouse handler to communicate with manager.
 */

import type { StateMachine } from '@zengrid/shared';
import type { DropZoneDetector } from './drop-zone-detector';
import type { DragStateManager } from './drag-state-manager';
import type { DragVisualFeedback } from './drag-visual-feedback';
import type {
  DragState,
  DragEvent,
  DragMouseEventCallbacks,
  ColumnDragOptions,
} from './column-drag-manager.interface';

export function createMouseCallbacks(
  dropZoneDetector: DropZoneDetector,
  columnModel: ColumnDragOptions['columnModel'],
  stateMachine: StateMachine<DragState, DragEvent>,
  stateManager: DragStateManager,
  visualFeedback: DragVisualFeedback,
  events: ColumnDragOptions['events'],
  dragThresholdMetGetter: () => boolean,
  dragThresholdMetSetter: (value: boolean) => void,
  cancelDragCallback: (reason: 'escape' | 'invalid-drop' | 'programmatic') => void,
  commitDropCallback: () => void
): DragMouseEventCallbacks {
  return {
    canDragColumn: (columnId: string) => dropZoneDetector.canDragColumn(columnId),
    getColumn: (columnId: string) => columnModel.getColumn(columnId),
    getState: () => stateMachine.current as DragState,
    getDragDistance: () => stateManager.getDragDistance(),
    onMouseDown: (columnId: string, columnIndex: number, x: number, y: number) => {
      stateManager.startDrag(columnId, columnIndex, x, y);
      dragThresholdMetSetter(false);
      stateMachine.transition('mousedown');
    },
    onMouseMove: (x: number, y: number) => {
      stateManager.updatePosition(x, y);
    },
    onMouseUp: () => {
      if (stateMachine.is('pending') || !dragThresholdMetGetter()) {
        cancelDragCallback('programmatic');
      } else {
        commitDropCallback();
      }
    },
    onDragStart: (event: MouseEvent, target: HTMLElement) => {
      dragThresholdMetSetter(true);
      stateMachine.transition('dragstart');

      const sourceColumnId = stateManager.getSourceColumnId();
      if (sourceColumnId) {
        const column = columnModel.getColumn(sourceColumnId);
        if (column) {
          events?.emit('column:dragStart', {
            columnId: sourceColumnId,
            columnIndex: column.order,
            column: column.definition,
            nativeEvent: event,
          });

          const headerElement = target.closest('[data-column-id]') as HTMLElement;
          if (headerElement) {
            const { clientX, clientY } = event;
            visualFeedback.startDrag(headerElement, clientX, clientY);
          }
        }
      }
    },
  };
}
