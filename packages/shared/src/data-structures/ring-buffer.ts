/**
 * RingBuffer - Fixed-size circular buffer
 *
 * @description
 * Circular buffer with fixed capacity that auto-evicts oldest items.
 * Perfect for event history, logging, and debugging.
 *
 * @performance
 * - push: O(1)
 * - get: O(1)
 * - toArray: O(n)
 * - Memory: Fixed at capacity
 *
 * @example
 * ```typescript
 * const history = new RingBuffer<Event>(100);
 *
 * // Add events
 * history.push(event1);
 * history.push(event2);
 * // ... 100 more events
 *
 * // Latest 100 events available
 * const recent = history.toArray();  // [event1, event2, ...]
 * ```
 */
export class RingBuffer<T> {
  private buffer: T[];
  private head = 0;
  private tail = 0;
  private count = 0;

  constructor(private readonly capacity: number) {
    if (capacity <= 0) {
      throw new Error('RingBuffer capacity must be > 0');
    }
    this.buffer = new Array<T>(capacity);
  }

  /**
   * Add item to buffer (O(1))
   * Auto-evicts oldest if full
   */
  push(item: T): void {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;

    if (this.count < this.capacity) {
      this.count++;
    } else {
      // Full - move head forward (evict oldest)
      this.head = (this.head + 1) % this.capacity;
    }
  }

  /**
   * Get item at index (O(1))
   * Index 0 = oldest, size()-1 = newest
   */
  get(index: number): T | undefined {
    if (index < 0 || index >= this.count) {
      return undefined;
    }

    const actualIndex = (this.head + index) % this.capacity;
    return this.buffer[actualIndex];
  }

  /**
   * Get newest item (O(1))
   */
  newest(): T | undefined {
    if (this.isEmpty()) return undefined;

    const index = (this.tail - 1 + this.capacity) % this.capacity;
    return this.buffer[index];
  }

  /**
   * Get oldest item (O(1))
   */
  oldest(): T | undefined {
    if (this.isEmpty()) return undefined;
    return this.buffer[this.head];
  }

  /**
   * Convert to array (O(n))
   * Returns [oldest, ..., newest]
   */
  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      const index = (this.head + i) % this.capacity;
      result.push(this.buffer[index]);
    }
    return result;
  }

  /**
   * Get current size
   */
  size(): number {
    return this.count;
  }

  /**
   * Check if empty
   */
  isEmpty(): boolean {
    return this.count === 0;
  }

  /**
   * Check if full
   */
  isFull(): boolean {
    return this.count === this.capacity;
  }

  /**
   * Get capacity
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * Clear buffer
   */
  clear(): void {
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }

  /**
   * Iterate over items (oldest to newest)
   */
  forEach(callback: (item: T, index: number) => void): void {
    for (let i = 0; i < this.count; i++) {
      const index = (this.head + i) % this.capacity;
      callback(this.buffer[index], i);
    }
  }

  /**
   * Get item at index with bounds checking
   * @throws Error if index is out of bounds
   */
  at(index: number): T {
    if (index < 0 || index >= this.count) {
      throw new Error(`Index ${index} out of bounds for RingBuffer of size ${this.count}`);
    }
    
    const actualIndex = (this.head + index) % this.capacity;
    return this.buffer[actualIndex];
  }

  /**
   * Replace item at index
   * @throws Error if index is out of bounds
   */
  set(index: number, item: T): void {
    if (index < 0 || index >= this.count) {
      throw new Error(`Index ${index} out of bounds for RingBuffer of size ${this.count}`);
    }
    
    const actualIndex = (this.head + index) % this.capacity;
    this.buffer[actualIndex] = item;
  }

  /**
   * Get all items as a new array (alternative to toArray)
   */
  values(): T[] {
    return this.toArray();
  }
}