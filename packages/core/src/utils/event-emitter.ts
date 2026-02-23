/**
 * EventEmitter - Simplified event emitter for pub/sub patterns
 *
 * In production, this would be imported from @zengrid/shared
 * This is a simplified implementation for demonstration purposes
 */

export type EventListener<T = any> = (data: T) => void;

/**
 * Simple event emitter for managing event subscriptions
 */
export class EventEmitter<EventMap extends Record<string, any> = Record<string, any>> {
  private listeners: Map<keyof EventMap, Set<EventListener<any>>> = new Map();

  /**
   * Subscribe to an event
   *
   * @param event - Event name to listen for
   * @param listener - Callback function to invoke when event is emitted
   * @returns Unsubscribe function
   */
  on<K extends keyof EventMap>(event: K, listener: EventListener<EventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => this.off(event, listener);
  }

  /**
   * Subscribe to an event (one-time only)
   *
   * @param event - Event name to listen for
   * @param listener - Callback function to invoke when event is emitted
   * @returns Unsubscribe function
   */
  once<K extends keyof EventMap>(event: K, listener: EventListener<EventMap[K]>): () => void {
    const onceListener: EventListener<EventMap[K]> = (data) => {
      listener(data);
      this.off(event, onceListener);
    };

    return this.on(event, onceListener);
  }

  /**
   * Unsubscribe from an event
   *
   * @param event - Event name
   * @param listener - Listener function to remove
   */
  off<K extends keyof EventMap>(event: K, listener: EventListener<EventMap[K]>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);

      // Clean up empty sets
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event to all subscribers
   *
   * @param event - Event name
   * @param data - Event data to pass to listeners
   */
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      // Create a copy to avoid issues if listeners modify the set
      const listenersCopy = Array.from(eventListeners);
      listenersCopy.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for "${String(event)}":`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for a specific event
   *
   * @param event - Event name (if omitted, removes all listeners)
   */
  removeAllListeners<K extends keyof EventMap>(event?: K): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   *
   * @param event - Event name
   * @returns Number of listeners
   */
  listenerCount<K extends keyof EventMap>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  /**
   * Get all event names that have listeners
   *
   * @returns Array of event names
   */
  eventNames(): (keyof EventMap)[] {
    return Array.from(this.listeners.keys());
  }
}
