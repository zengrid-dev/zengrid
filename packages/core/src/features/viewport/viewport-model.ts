/**
 * ViewportModel - Reactive visible range management
 *
 * @description
 * Manages visible row/column range as reactive state.
 * Emits events when visible range changes.
 *
 * @example
 * ```typescript
 * const viewportModel = new ViewportModel();
 *
 * // Subscribe to viewport changes
 * viewportModel.subscribe({
 *   onChange: (event) => {
 *     console.log('Visible range:', event.state.range);
 *     // Re-render cells in new range
 *   }
 * });
 *
 * // Update visible range (triggers event)
 * viewportModel.setRange({
 *   startRow: 0,
 *   endRow: 20,
 *   startCol: 0,
 *   endCol: 10
 * }, { top: 0, left: 0 });
 * ```
 */

import { ReactiveState } from '@zengrid/shared';
import type { StateSubscriber } from '@zengrid/shared';
import type { VisibleRange } from '../../types';
import type { ViewportState, ViewportEvent, ViewportEventType, ScrollState } from './types';

/**
 * ViewportModel - Single source of truth for visible range
 */
export class ViewportModel extends ReactiveState<ViewportState, ViewportEvent> {
  private static VIEWPORT_KEY = 'viewport';

  constructor() {
    super();

    // Initialize with empty range
    const initialState: ViewportState = {
      range: { startRow: 0, endRow: 0, startCol: 0, endCol: 0 },
      scrollPosition: { top: 0, left: 0 },
    };

    this.setState(ViewportModel.VIEWPORT_KEY, initialState, {
      type: 'range',
      oldRange: null,
      newRange: initialState.range,
      state: initialState,
    });
  }

  /**
   * Subscribe to viewport changes
   */
  subscribe(subscriber: StateSubscriber<ViewportEvent>): () => void {
    return this.subscribeToKey(ViewportModel.VIEWPORT_KEY, subscriber);
  }

  /**
   * Get current viewport state
   */
  getViewport(): ViewportState {
    return (
      this.getState(ViewportModel.VIEWPORT_KEY) ?? {
        range: { startRow: 0, endRow: 0, startCol: 0, endCol: 0 },
        scrollPosition: { top: 0, left: 0 },
      }
    );
  }

  /**
   * Get current visible range
   */
  getRange(): VisibleRange {
    return this.getViewport().range;
  }

  /**
   * Set visible range (triggers reactive update)
   */
  setRange(newRange: VisibleRange, scrollPosition: ScrollState): void {
    const oldViewport = this.getViewport();
    const oldRange = oldViewport.range;

    const newState: ViewportState = {
      range: newRange,
      scrollPosition,
    };

    // Determine event type
    let eventType: ViewportEventType = 'range';
    const rowsChanged =
      newRange.startRow !== oldRange.startRow || newRange.endRow !== oldRange.endRow;
    const colsChanged =
      newRange.startCol !== oldRange.startCol || newRange.endCol !== oldRange.endCol;

    if (rowsChanged && !colsChanged) {
      eventType = 'rows';
    } else if (!rowsChanged && colsChanged) {
      eventType = 'cols';
    }

    this.setState(ViewportModel.VIEWPORT_KEY, newState, {
      type: eventType,
      oldRange,
      newRange,
      state: newState,
    });
  }

  /**
   * Check if range has changed
   */
  hasRangeChanged(newRange: VisibleRange): boolean {
    const current = this.getRange();
    return (
      current.startRow !== newRange.startRow ||
      current.endRow !== newRange.endRow ||
      current.startCol !== newRange.startCol ||
      current.endCol !== newRange.endCol
    );
  }

  /**
   * Reset viewport to empty range
   */
  reset(): void {
    this.setRange({ startRow: 0, endRow: 0, startCol: 0, endCol: 0 }, { top: 0, left: 0 });
  }
}
