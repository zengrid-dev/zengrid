/**
 * Drag Event Handlers
 *
 * @description
 * Handles state transitions and keyboard events for drag operations.
 */

import type { StateMachine } from '@zengrid/shared';
import type { DragKeyboardHandler } from './drag-keyboard-handler';
import type { DragStateManager } from './drag-state-manager';
import type { DragState, DragEvent } from './column-drag-manager.interface';

export class DragEventHandlers {
  constructor(
    private stateManager: DragStateManager,
    private keyboardHandler: DragKeyboardHandler,
    private stateMachine: StateMachine<DragState, DragEvent>,
    private cancelDragCallback: (reason: 'escape' | 'invalid-drop' | 'programmatic') => void
  ) {}

  /**
   * Handle state machine transitions
   */
  handleStateTransition(_from: DragState, _event: DragEvent, to: DragState): void {
    this.stateManager.updateState(to);
  }

  /**
   * Handle keyboard events
   */
  handleKeyDown(e: KeyboardEvent): void {
    // Escape to cancel drag
    if (e.key === 'Escape' && this.stateMachine.is('dragging')) {
      this.cancelDragCallback('escape');
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
}
