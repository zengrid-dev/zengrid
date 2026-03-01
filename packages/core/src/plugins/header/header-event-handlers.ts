/**
 * HeaderManager - Event handlers
 */

import type { SortState } from '../../types';
import type { EventEmitter } from '../../events/event-emitter';
import type { GridEvents } from '../../events/grid-events';

/**
 * Event handler callbacks interface
 */
export interface EventHandlerCallbacks {
  onSortChange: (payload?: any) => void;
  onFilterChange: () => void;
  onScroll: (payload: any) => void;
}

/**
 * Setup event listeners
 */
export function setupEventListeners(
  eventEmitter: EventEmitter<GridEvents>,
  callbacks: EventHandlerCallbacks
): void {
  eventEmitter.on('sort:change', (payload: any) => {
    callbacks.onSortChange(payload);
  });
  eventEmitter.on('filter:change', callbacks.onFilterChange);
  eventEmitter.on('scroll', callbacks.onScroll);
}

/**
 * Remove event listeners
 */
export function removeEventListeners(
  eventEmitter: EventEmitter<GridEvents>,
  callbacks: EventHandlerCallbacks
): void {
  eventEmitter.off('sort:change', callbacks.onSortChange);
  eventEmitter.off('filter:change', callbacks.onFilterChange);
  eventEmitter.off('scroll', callbacks.onScroll);
}

/**
 * Handle sort state change
 */
export function handleSortChange(
  _payload: any,
  _getSortState: (() => SortState[]) | undefined,
  updateAllHeaders: () => void
): void {
  updateAllHeaders();
}

/**
 * Handle filter state change
 */
export function handleFilterChange(updateAllHeaders: () => void): void {
  updateAllHeaders();
}

/**
 * Handle scroll event
 */
export function handleScroll(payload: any, syncScroll: (scrollLeft: number) => void): void {
  if (payload.scrollLeft !== undefined) {
    syncScroll(payload.scrollLeft);
  }
}
