/**
 * ObjectPool - Object pooling for virtual rendering
 *
 * @description
 * Reuses objects instead of creating/destroying (10x faster scroll).
 * Uses PoolStatsTracker for monitoring.
 *
 * @performance
 * - Traditional: User scrolls → destroy 50 cells → create 50 new (10-15ms)
 * - Pooling: User scrolls → release 50 → acquire 50 from pool (1-2ms)
 *
 * @example
 * ```typescript
 * const cellPool = new ObjectPool({
 *   factory: () => document.createElement('div'),
 *   reset: (div) => div.innerHTML = '',
 *   initialSize: 50,
 * });
 *
 * const cell = cellPool.acquire();
 * cell.textContent = 'Cell content';
 * document.body.appendChild(cell);
 *
 * // Later: release back to pool
 * document.body.removeChild(cell);
 * cellPool.release(cell);
 * ```
 */

import { PoolStatsTracker, type ObjectPoolStats } from './core/pool-stats';

// Re-export types
export type { ObjectPoolStats };

export interface ObjectPoolOptions<T> {
  factory: () => T;
  reset?: (obj: T) => void;
  validate?: (obj: T) => boolean;
  initialSize?: number;
  maxSize?: number;
}

export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset?: (obj: T) => void;
  private validate?: (obj: T) => boolean;
  private maxSize: number;
  private stats = new PoolStatsTracker();

  constructor(options: ObjectPoolOptions<T>) {
    this.factory = options.factory;
    this.reset = options.reset;
    this.validate = options.validate;
    this.maxSize = options.maxSize ?? 100;

    // Prewarm pool with initial objects
    const initialSize = options.initialSize ?? 0;
    this.prewarm(initialSize);
  }

  /**
   * Acquire object from pool (reuse or create)
   *
   * @performance O(1) - pop from array
   */
  acquire(): T {
    this.stats.incrementAcquired();

    let obj: T;

    if (this.pool.length > 0) {
      // Reuse from pool
      obj = this.pool.pop()!;

      // Validate if validator provided
      if (this.validate && !this.validate(obj)) {
        obj = this.createNew();
      }
    } else {
      // Pool empty, create new
      obj = this.createNew();
    }

    return obj;
  }

  /**
   * Release object back to pool
   *
   * @performance O(1) - push to array + O(reset)
   */
  release(obj: T): void {
    this.stats.incrementReleased();

    // Don't exceed max size
    if (this.pool.length >= this.maxSize) {
      return; // Discard (GC will handle)
    }

    // Reset object before returning to pool
    if (this.reset) {
      try {
        this.reset(obj);
      } catch (error) {
        console.error('ObjectPool: Reset error:', error);
        return; // Don't add to pool if reset fails
      }
    }

    this.pool.push(obj);
  }

  /**
   * Create new object
   *
   * @private
   */
  private createNew(): T {
    this.stats.incrementCreated();
    try {
      return this.factory();
    } catch (error) {
      console.error('ObjectPool: Factory error:', error);
      throw error;
    }
  }

  /**
   * Acquire multiple objects from pool
   */
  acquireMany(count: number): T[] {
    const objects: T[] = [];
    for (let i = 0; i < count; i++) {
      objects.push(this.acquire());
    }
    return objects;
  }

  /**
   * Release multiple objects back to pool
   */
  releaseMany(objects: T[]): void {
    objects.forEach((obj) => this.release(obj));
  }

  /**
   * Prewarm pool with objects
   */
  prewarm(count: number): void {
    const needed = Math.max(0, count - this.pool.length);
    const toCreate = Math.min(needed, this.maxSize - this.pool.length);

    for (let i = 0; i < toCreate; i++) {
      const obj = this.createNew();
      this.pool.push(obj);
    }
  }

  /**
   * Get current pool size
   */
  size(): number {
    return this.pool.length;
  }

  /**
   * Get pool statistics
   */
  getStats(): ObjectPoolStats {
    return this.stats.getStats(this.pool.length, this.maxSize);
  }

  /**
   * Shrink pool to target size
   */
  shrink(targetSize: number): void {
    if (this.pool.length > targetSize) {
      this.pool.length = targetSize;
    }
  }

  /**
   * Clear pool
   */
  clear(): void {
    this.pool = [];
  }

  /**
   * Destroy pool
   */
  destroy(): void {
    this.clear();
    this.stats.reset();
  }
}
