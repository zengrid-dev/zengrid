/**
 * ScrollModel - Reactive scroll position management
 *
 * @description
 * Manages scroll position as reactive state.
 * Emits events when scroll position changes.
 *
 * @example
 * ```typescript
 * const scrollModel = new ScrollModel();
 *
 * // Subscribe to scroll changes
 * scrollModel.subscribe({
 *   onChange: (event) => {
 *     console.log('Scrolled to:', event.state);
 *   }
 * });
 *
 * // Update scroll position (triggers event)
 * scrollModel.setScroll(100, 50);
 * ```
 */

import { ReactiveState } from '@zengrid/shared';
import type { StateSubscriber } from '@zengrid/shared';
import type { ScrollState, ScrollEvent, ScrollEventType } from './types';

/**
 * ScrollModel - Single source of truth for scroll position
 */
export class ScrollModel extends ReactiveState<ScrollState, ScrollEvent> {
  private static SCROLL_KEY = 'scroll';

  constructor() {
    super();

    // Initialize with default scroll position
    this.setState(ScrollModel.SCROLL_KEY, { top: 0, left: 0 }, {
      type: 'scroll',
      oldPosition: { top: 0, left: 0 },
      newPosition: { top: 0, left: 0 },
      state: { top: 0, left: 0 },
    });
  }

  /**
   * Subscribe to scroll changes
   */
  subscribe(subscriber: StateSubscriber<ScrollEvent>): () => void {
    return this.subscribeToKey(ScrollModel.SCROLL_KEY, subscriber);
  }

  /**
   * Get current scroll position
   */
  getScroll(): ScrollState {
    return this.getState(ScrollModel.SCROLL_KEY) ?? { top: 0, left: 0 };
  }

  /**
   * Set scroll position (triggers reactive update)
   */
  setScroll(top: number, left: number): void {
    const oldPosition = this.getScroll();
    const newPosition = { top, left };

    // Determine event type
    let eventType: ScrollEventType = 'scroll';
    if (top !== oldPosition.top && left === oldPosition.left) {
      eventType = 'scrollY';
    } else if (top === oldPosition.top && left !== oldPosition.left) {
      eventType = 'scrollX';
    }

    this.setState(ScrollModel.SCROLL_KEY, newPosition, {
      type: eventType,
      oldPosition,
      newPosition,
      state: newPosition,
    });
  }

  /**
   * Set vertical scroll only
   */
  setScrollTop(top: number): void {
    const current = this.getScroll();
    this.setScroll(top, current.left);
  }

  /**
   * Set horizontal scroll only
   */
  setScrollLeft(left: number): void {
    const current = this.getScroll();
    this.setScroll(current.top, left);
  }

  /**
   * Reset scroll to (0, 0)
   */
  reset(): void {
    this.setScroll(0, 0);
  }
}
