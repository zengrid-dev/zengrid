import { Grid } from '../../../../packages/core/src/grid/index';

/**
 * Update statistics display
 */
export function updateStats(grid: Grid, renderTime?: number) {
  const stats = grid.getStats();

  document.getElementById('stat-rows')!.textContent = stats.rowCount.toLocaleString();
  document.getElementById('stat-visible')!.textContent = stats.visibleCells.toLocaleString();
  document.getElementById('stat-pooled')!.textContent = `${stats.poolStats.active}/${stats.poolStats.total}`;

  if (renderTime !== undefined) {
    document.getElementById('stat-render')!.textContent = `${renderTime.toFixed(2)}ms`;
  }

  // Update cache stats if available
  if (stats.cacheStats) {
    const cacheHitRate = (stats.cacheStats.hitRate * 100).toFixed(1);
    const cacheSize = `${stats.cacheStats.size}/${stats.cacheStats.capacity}`;
    document.getElementById('stat-cache')!.textContent = `${cacheHitRate}% (${cacheSize})`;
  }
}

/**
 * Start periodic stats update
 */
export function startPeriodicStatsUpdate(grid: Grid): () => void {
  const intervalId = setInterval(() => {
    const stats = grid.getStats();
    document.getElementById('stat-visible')!.textContent = stats.visibleCells.toLocaleString();
    document.getElementById('stat-pooled')!.textContent = `${stats.poolStats.active}/${stats.poolStats.total}`;

    // Update cache stats
    if (stats.cacheStats) {
      const cacheHitRate = (stats.cacheStats.hitRate * 100).toFixed(1);
      const cacheSize = `${stats.cacheStats.size}/${stats.cacheStats.capacity}`;
      document.getElementById('stat-cache')!.textContent = `${cacheHitRate}% (${cacheSize})`;
    }
  }, 500);

  // Return cleanup function
  return () => clearInterval(intervalId);
}
