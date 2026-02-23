/**
 * SubscriptionManager - Manages targeted and global subscriptions
 *
 * @description
 * Handles subscriber registration and notification with O(m) targeted approach.
 * Extracted from ReactiveState for modularity.
 * Implements ISubscriptionManager for loose coupling.
 */

import type { ISubscriptionManager, ISubscriber } from '../interfaces';

export class SubscriptionManager<E> implements ISubscriptionManager<E> {
  private keySubscribers = new Map<string, Set<ISubscriber<E>>>();
  private globalSubscribers = new Set<ISubscriber<E>>();

  /**
   * Subscribe to specific key
   */
  subscribeToKey(key: string, subscriber: ISubscriber<E>): () => void {
    if (!this.keySubscribers.has(key)) {
      this.keySubscribers.set(key, new Set());
    }

    this.keySubscribers.get(key)!.add(subscriber);

    return () => {
      const subscribers = this.keySubscribers.get(key);
      if (subscribers) {
        subscribers.delete(subscriber);
        if (subscribers.size === 0) {
          this.keySubscribers.delete(key);
        }
      }
    };
  }

  /**
   * Subscribe to all changes
   */
  subscribeGlobal(subscriber: ISubscriber<E>): () => void {
    this.globalSubscribers.add(subscriber);
    return () => this.globalSubscribers.delete(subscriber);
  }

  /**
   * Notify subscribers for key (immediate)
   */
  notifyKey(key: string, event: E): void {
    // Key-specific subscribers
    const subscribers = this.keySubscribers.get(key);
    if (subscribers) {
      subscribers.forEach((sub) => {
        try {
          sub.onChange(event);
        } catch (error) {
          console.error(`SubscriptionManager: Error for key ${key}:`, error);
        }
      });
    }

    // Global subscribers
    this.globalSubscribers.forEach((sub) => {
      try {
        sub.onChange(event);
      } catch (error) {
        console.error('SubscriptionManager: Global error:', error);
      }
    });
  }

  /**
   * Notify subscribers with batched events
   */
  notifyBatch(eventsByKey: Map<string, E[]>): void {
    // Notify key-specific subscribers
    eventsByKey.forEach((events, key) => {
      const subscribers = this.keySubscribers.get(key);
      if (subscribers) {
        subscribers.forEach((sub) => {
          try {
            if (sub.onBatchChange) {
              sub.onBatchChange(events);
            } else {
              events.forEach((event) => sub.onChange(event));
            }
          } catch (error) {
            console.error(`SubscriptionManager: Batch error for key ${key}:`, error);
          }
        });
      }
    });

    // Notify global subscribers
    const allEvents: E[] = [];
    eventsByKey.forEach((events) => allEvents.push(...events));

    this.globalSubscribers.forEach((sub) => {
      try {
        if (sub.onBatchChange) {
          sub.onBatchChange(allEvents);
        } else {
          allEvents.forEach((event) => sub.onChange(event));
        }
      } catch (error) {
        console.error('SubscriptionManager: Global batch error:', error);
      }
    });
  }

  /**
   * Get subscriber count for key
   */
  getKeySubscriberCount(key: string): number {
    return this.keySubscribers.get(key)?.size ?? 0;
  }

  /**
   * Get global subscriber count
   */
  getGlobalSubscriberCount(): number {
    return this.globalSubscribers.size;
  }

  /**
   * Check if key has subscribers
   */
  hasKeySubscribers(key: string): boolean {
    const subscribers = this.keySubscribers.get(key);
    return subscribers ? subscribers.size > 0 : false;
  }

  /**
   * Clear all subscribers
   */
  clear(): void {
    this.keySubscribers.clear();
    this.globalSubscribers.clear();
  }
}
