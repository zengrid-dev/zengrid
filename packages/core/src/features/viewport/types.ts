/**
 * Viewport and Scroll Model Types
 *
 * @description
 * Reactive state types for scroll position and visible viewport.
 * Enables reactive virtual scrolling with targeted subscriptions.
 */

import type { VisibleRange } from '../../types';

/**
 * Scroll position state
 */
export interface ScrollState {
  /**
   * Vertical scroll position (pixels from top)
   */
  top: number;

  /**
   * Horizontal scroll position (pixels from left)
   */
  left: number;
}

/**
 * Viewport state (visible row/column range)
 */
export interface ViewportState {
  /**
   * Visible range (with overscan)
   */
  range: VisibleRange;

  /**
   * Scroll position that triggered this range
   */
  scrollPosition: ScrollState;
}

/**
 * Scroll event types
 */
export type ScrollEventType =
  | 'scroll' // Scroll position changed
  | 'scrollX' // Horizontal scroll only
  | 'scrollY'; // Vertical scroll only

/**
 * Scroll change event
 */
export interface ScrollEvent {
  type: ScrollEventType;
  oldPosition: ScrollState;
  newPosition: ScrollState;
  state: ScrollState;
}

/**
 * Viewport event types
 */
export type ViewportEventType =
  | 'range' // Visible range changed
  | 'rows' // Visible rows changed
  | 'cols'; // Visible columns changed

/**
 * Viewport change event
 */
export interface ViewportEvent {
  type: ViewportEventType;
  oldRange: VisibleRange | null;
  newRange: VisibleRange;
  state: ViewportState;
}
