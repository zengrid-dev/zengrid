import type { EventEmitter } from '../../utils/event-emitter';
import type { ColumnGroupManagerEvents } from './types';

/**
 * Configuration for event subscription manager
 */
export interface EventSubscriptionManagerConfig {
  eventEmitter: EventEmitter<ColumnGroupManagerEvents>;
}

/**
 * Manages event subscriptions for column group manager
 */
export class EventSubscriptionManager {
  constructor(private config: EventSubscriptionManagerConfig) {}

  /**
   * Subscribe to an event
   */
  on<K extends keyof ColumnGroupManagerEvents>(
    event: K,
    listener: (data: ColumnGroupManagerEvents[K]) => void
  ): () => void {
    return this.config.eventEmitter.on(event, listener);
  }

  /**
   * Subscribe to an event (one-time)
   */
  once<K extends keyof ColumnGroupManagerEvents>(
    event: K,
    listener: (data: ColumnGroupManagerEvents[K]) => void
  ): () => void {
    return this.config.eventEmitter.once(event, listener);
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof ColumnGroupManagerEvents>(
    event: K,
    listener: (data: ColumnGroupManagerEvents[K]) => void
  ): void {
    this.config.eventEmitter.off(event, listener);
  }

  /**
   * Remove all listeners for an event or all events
   */
  removeAllListeners(event?: keyof ColumnGroupManagerEvents): void {
    this.config.eventEmitter.removeAllListeners(event);
  }
}
