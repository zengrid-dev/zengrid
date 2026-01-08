/**
 * BatchQueue - Manages batching queue and deduplication
 *
 * @description
 * Handles queueing items and optional deduplication.
 * Extracted from BatchProcessor for modularity.
 *
 * @internal
 */

export class BatchQueue<T> {
  private queue: T[] = [];
  private deduplicate?: (items: T[]) => T[];

  constructor(deduplicate?: (items: T[]) => T[]) {
    this.deduplicate = deduplicate;
  }

  /**
   * Add item to queue
   */
  add(item: T): void {
    this.queue.push(item);
  }

  /**
   * Add multiple items to queue
   */
  addMany(items: T[]): void {
    this.queue.push(...items);
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Flush queue (get and clear items)
   */
  flush(): T[] {
    let items = this.queue.slice();
    this.queue = [];

    // Apply deduplication if provided
    if (this.deduplicate && items.length > 0) {
      items = this.deduplicate(items);
    }

    return items;
  }
}
