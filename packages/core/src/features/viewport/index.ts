/**
 * Viewport Module - Reactive scroll and viewport state
 *
 * @description
 * Provides reactive models for managing scroll position and visible range.
 * Enables reactive virtual scrolling for both vertical and horizontal directions.
 */

export { ScrollModel } from './scroll-model';
export { ViewportModel } from './viewport-model';

export type {
  ScrollState,
  ViewportState,
  ScrollEvent,
  ScrollEventType,
  ViewportEvent,
  ViewportEventType,
} from './types';
