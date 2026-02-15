/**
 * HeaderManager - Reactive column subscription
 */

import type { StateSubscriber } from '@zengrid/shared';
import type { ColumnModel } from '../features/columns/column-model';
import type { ColumnEvent } from '../features/columns/types';

/**
 * Reactive subscription callbacks
 */
export interface SubscriptionCallbacks {
  onWidthChange: (columnId: string) => void;
  onVisibilityChange: () => void;
  onReorderChange: () => void;
  onOtherChange: (columnId: string) => void;
}

/**
 * Subscribe to column model changes (reactive)
 */
export function subscribeToColumnChanges(
  columnModel: ColumnModel,
  callbacks: SubscriptionCallbacks
): () => void {
  const subscriber: StateSubscriber<ColumnEvent> = {
    onChange: (event: ColumnEvent) => {
      handleColumnChange(event, callbacks);
    },
  };

  // Subscribe to all column changes globally
  return columnModel.subscribeAll(subscriber);
}

/**
 * Handle column model changes reactively
 */
function handleColumnChange(event: ColumnEvent, callbacks: SubscriptionCallbacks): void {
  const { type, columnId } = event;

  // Update the specific header based on event type
  switch (type) {
    case 'width':
    case 'resize':
      // Width changed - update header width
      callbacks.onWidthChange(columnId);
      break;

    case 'visibility':
      // Visibility changed - re-render all headers
      callbacks.onVisibilityChange();
      break;

    case 'reorder':
    case 'pin':
    case 'unpin':
      // Order changed - re-render all headers
      callbacks.onReorderChange();
      break;

    default:
      // Unknown event - update specific header
      callbacks.onOtherChange(columnId);
  }
}
