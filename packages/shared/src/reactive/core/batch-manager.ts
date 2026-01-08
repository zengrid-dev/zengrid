/**
 * BatchManager - Batch event handling
 *
 * @description
 * Manages batching mode and event queuing.
 * Extracted from ReactiveState for modularity.
 * Implements IBatchManager for loose coupling.
 */

import type { IBatchManager } from '../interfaces';

export class BatchManager<E> implements IBatchManager<E> {
  private batchMode = false;
  private batchedEvents: Array<{ key: string; event: E }> = [];

  /**
   * Check if currently in batch mode
   */
  isBatching(): boolean {
    return this.batchMode;
  }

  /**
   * Enter batch mode
   */
  enterBatch(): void {
    this.batchMode = true;
  }

  /**
   * Exit batch mode
   */
  exitBatch(): void {
    this.batchMode = false;
  }

  /**
   * Add event to batch queue
   */
  addEvent(key: string, event: E): void {
    this.batchedEvents.push({ key, event });
  }

  /**
   * Get and clear batched events
   */
  flushEvents(): Array<{ key: string; event: E }> {
    const events = this.batchedEvents;
    this.batchedEvents = [];
    return events;
  }

  /**
   * Group events by key
   */
  groupEventsByKey(events: Array<{ key: string; event: E }>): Map<string, E[]> {
    const grouped = new Map<string, E[]>();

    events.forEach(({ key, event }) => {
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(event);
    });

    return grouped;
  }

  /**
   * Clear all batched events
   */
  clear(): void {
    this.batchedEvents = [];
    this.batchMode = false;
  }
}
