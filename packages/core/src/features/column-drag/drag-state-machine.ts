/**
 * Drag State Machine
 *
 * @description
 * Creates and configures the state machine for column drag lifecycle.
 */

import { StateMachine } from '@zengrid/shared';
import type { DragState, DragEvent } from './column-drag-manager.interface';

export function createDragStateMachine(
  onTransition: (from: DragState, event: DragEvent, to: DragState) => void
): StateMachine<DragState, DragEvent> {
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
  machine.addTransition('idle', 'reset', 'idle'); // reset when already idle (e.g. cancel → idle → reset)

  // Listen to transitions for side effects
  machine.onTransition((from, event, to) => {
    onTransition(from, event, to);
  });

  return machine;
}
