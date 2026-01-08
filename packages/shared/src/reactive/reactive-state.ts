/**
 * ReactiveState - Generic reactive state container
 *
 * @description
 * Observable state with targeted subscriptions (O(m) vs O(n)).
 * Supports dependency injection for testing and customization.
 *
 * @example
 * ```typescript
 * // Inheritance (backward compatible)
 * class ColumnModel extends ReactiveState<ColumnState, ColumnEvent> {
 *   setWidth(id: string, width: number): void {
 *     this.setState(id, { ...state, width }, event);
 *   }
 * }
 *
 * // Composition with DI (new, flexible)
 * class ColumnModel {
 *   constructor(private state: IReactiveState<ColumnState, ColumnEvent>) {}
 * }
 *
 * // Can inject custom implementation
 * const model = new ColumnModel(new ReactiveState());
 * const testModel = new ColumnModel(mockState);
 * ```
 *
 * @template T - State value type
 * @template E - Event type
 */

import type { IReactiveState, ISubscriber, ISubscriptionManager, IBatchManager } from './interfaces';
import { SubscriptionManager } from './core/subscription-manager';
import { BatchManager } from './core/batch-manager';
import { RingBuffer } from '../data-structures/ring-buffer';

export class ReactiveState<T, E> implements IReactiveState<T, E> {
  private state = new Map<string, T>();
  private subscriptions: ISubscriptionManager<E>;
  private batching: IBatchManager<E>;
  private eventHistory?: RingBuffer<E>;

  /**
   * Create ReactiveState with optional dependency injection
   *
   * @param subscriptions - Custom subscription manager (default: SubscriptionManager)
   * @param batching - Custom batch manager (default: BatchManager)
   * @param historySize - Event history size for debugging (default: 0, disabled)
   */
  constructor(
    subscriptions?: ISubscriptionManager<E>,
    batching?: IBatchManager<E>,
    historySize: number = 0
  ) {
    this.subscriptions = subscriptions ?? new SubscriptionManager<E>();
    this.batching = batching ?? new BatchManager<E>();

    if (historySize > 0) {
      this.eventHistory = new RingBuffer<E>(historySize);
    }
  }

  /**
   * Subscribe to specific key changes (targeted O(m))
   */
  subscribeToKey(key: string, subscriber: ISubscriber<E>): () => void {
    return this.subscriptions.subscribeToKey(key, subscriber);
  }

  /**
   * Subscribe to all state changes (global observer)
   */
  subscribeGlobal(subscriber: ISubscriber<E>): () => void {
    return this.subscriptions.subscribeGlobal(subscriber);
  }

  /**
   * Update state and notify subscribers
   *
   * @protected - For subclass use
   */
  protected setState(key: string, value: T, event: E): void {
    this.state.set(key, value);

    // Track event history if enabled
    if (this.eventHistory) {
      this.eventHistory.push(event);
    }

    if (this.batching.isBatching()) {
      this.batching.addEvent(key, event);
    } else {
      this.subscriptions.notifyKey(key, event);
    }
  }

  /**
   * Batch multiple updates (single notification)
   *
   * @example
   * ```typescript
   * columnModel.batch(() => {
   *   columnModel.setWidth('col-0', 150);
   *   columnModel.setWidth('col-1', 200);
   *   columnModel.setWidth('col-2', 180);
   * });
   * ```
   */
  protected batch(updates: () => void): void {
    const wasAlreadyBatching = this.batching.isBatching();

    if (!wasAlreadyBatching) {
      this.batching.enterBatch();
    }

    try {
      updates();
    } finally {
      if (!wasAlreadyBatching) {
        this.batching.exitBatch();
        this.flushBatch();
      }
    }
  }

  /**
   * Flush batched events
   *
   * @private
   */
  private flushBatch(): void {
    const events = this.batching.flushEvents();
    if (events.length === 0) return;

    const grouped = this.batching.groupEventsByKey(events);
    this.subscriptions.notifyBatch(grouped);
  }

  /**
   * Get state for key
   */
  protected getState(key: string): T | undefined {
    return this.state.get(key);
  }

  /**
   * Get all state
   */
  protected getAllState(): Map<string, T> {
    return new Map(this.state);
  }

  /**
   * Check if key has state
   */
  protected hasState(key: string): boolean {
    return this.state.has(key);
  }

  /**
   * Delete state for key and optionally notify
   */
  protected deleteState(key: string, event?: E): void {
    this.state.delete(key);

    // Notify subscribers if event provided
    if (event) {
      this.subscriptions.notifyKey(key, event);
    }
  }

  /**
   * Get all state keys
   */
  protected getKeys(): string[] {
    return Array.from(this.state.keys());
  }

  /**
   * Get subscriber count for key
   */
  getSubscriberCount(key: string): number {
    return this.subscriptions.getKeySubscriberCount(key);
  }

  /**
   * Get global subscriber count
   */
  getGlobalSubscriberCount(): number {
    return this.subscriptions.getGlobalSubscriberCount();
  }

  /**
   * Get event history (if enabled)
   * Returns [oldest, ..., newest]
   */
  getEventHistory(): E[] {
    return this.eventHistory?.toArray() ?? [];
  }

  /**
   * Get last N events from history
   */
  getLastEvents(count: number): E[] {
    const history = this.getEventHistory();
    return history.slice(-count);
  }

  /**
   * Clear event history
   */
  clearEventHistory(): void {
    this.eventHistory?.clear();
  }

  /**
   * Clear all state and subscribers
   */
  destroy(): void {
    this.state.clear();
    this.subscriptions.clear();
    this.batching.clear();
    this.eventHistory?.clear();
  }
}

/**
 * Subscriber interface (backward compatible)
 * @deprecated Use ISubscriber from interfaces.ts
 */
export interface StateSubscriber<E> {
  onChange(event: E): void;
  onBatchChange?(events: E[]): void;
}

// Re-export interface types
export type { ISubscriber, IReactiveState } from './interfaces';
