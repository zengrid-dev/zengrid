/**
 * PoolStats - Object pool statistics tracking
 *
 * @description
 * Tracks pool performance metrics.
 * Extracted from ObjectPool for modularity.
 *
 * @internal
 */

export interface ObjectPoolStats {
  available: number;
  created: number;
  acquired: number;
  released: number;
  hitRate: number;
  maxSize: number;
}

export class PoolStatsTracker {
  private createdCount = 0;
  private acquireCount = 0;
  private releaseCount = 0;

  /**
   * Increment created count
   */
  incrementCreated(): void {
    this.createdCount++;
  }

  /**
   * Increment acquired count
   */
  incrementAcquired(): void {
    this.acquireCount++;
  }

  /**
   * Increment released count
   */
  incrementReleased(): void {
    this.releaseCount++;
  }

  /**
   * Calculate hit rate (% of acquires from pool vs created)
   */
  calculateHitRate(): number {
    const total = this.acquireCount;
    if (total === 0) return 0;

    const hits = total - this.createdCount;
    return (hits / total) * 100;
  }

  /**
   * Get statistics snapshot
   */
  getStats(availableCount: number, maxSize: number): ObjectPoolStats {
    return {
      available: availableCount,
      created: this.createdCount,
      acquired: this.acquireCount,
      released: this.releaseCount,
      hitRate: this.calculateHitRate(),
      maxSize,
    };
  }

  /**
   * Reset all counters
   */
  reset(): void {
    this.createdCount = 0;
    this.acquireCount = 0;
    this.releaseCount = 0;
  }
}
