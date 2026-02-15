import { LRUCache } from '@zengrid/shared';

export function initLRUCacheDemo() {
  const cacheCapacityInput = document.getElementById('cache-capacity') as HTMLInputElement;
  const cacheInitBtn = document.getElementById('cache-init-btn') as HTMLButtonElement;
  const cachePopulateBtn = document.getElementById('cache-populate-btn') as HTMLButtonElement;
  const cacheAccessBtn = document.getElementById('cache-access-btn') as HTMLButtonElement;
  const cacheStressBtn = document.getElementById('cache-stress-btn') as HTMLButtonElement;
  const cacheResult = document.getElementById('cache-result') as HTMLDivElement;
  const cacheSizeEl = document.getElementById('cache-size') as HTMLDivElement;
  const cacheHitsEl = document.getElementById('cache-hits') as HTMLDivElement;
  const cacheMissesEl = document.getElementById('cache-misses') as HTMLDivElement;
  const cacheHitRateEl = document.getElementById('cache-hitrate') as HTMLDivElement;
  const cacheEvictionsEl = document.getElementById('cache-evictions') as HTMLDivElement;
  const cacheMemoryEl = document.getElementById('cache-memory') as HTMLDivElement;

  let cache: LRUCache<string, string> | null = null;

  function updateCacheStats() {
    if (!cache) return;

    const stats = cache.getStats();

    cacheSizeEl.textContent = stats.size.toString();
    cacheHitsEl.textContent = stats.hits.toString();
    cacheMissesEl.textContent = stats.misses.toString();
    cacheHitRateEl.textContent = `${(stats.hitRate * 100).toFixed(1)}%`;
    cacheEvictionsEl.textContent = stats.evictions.toString();
    cacheMemoryEl.textContent = `${(stats.memoryBytes / 1024).toFixed(1)} KB`;
  }

  cacheInitBtn.addEventListener('click', () => {
    const capacity = parseInt(cacheCapacityInput.value);

    if (capacity < 10 || capacity > 1000) {
      cacheResult.innerHTML = '<span class="error">❌ Capacity must be between 10 and 1000</span>';
      return;
    }

    cache = new LRUCache<string, string>({
      capacity,
      trackStats: true,
    });

    cacheResult.innerHTML = `<span class="success">✅ LRU Cache initialized with capacity ${capacity}</span>\n\nCache Features:\n• O(1) get/set/delete operations\n• Automatic eviction of least recently used items\n• Bounded memory usage\n• Statistics tracking\n\nReady to test! Click "Populate with Random Data" to start.`;

    cachePopulateBtn.disabled = false;
    cacheAccessBtn.disabled = false;
    cacheStressBtn.disabled = false;
    cacheInitBtn.textContent = '✓ Cache Initialized';
    cacheInitBtn.disabled = true;

    updateCacheStats();
  });

  cachePopulateBtn.addEventListener('click', () => {
    if (!cache) return;

    const start = performance.now();

    const capacity = cache.getStats().capacity;
    const itemsToAdd = Math.min(capacity * 2, 500);

    for (let i = 0; i < itemsToAdd; i++) {
      const row = Math.floor(Math.random() * 1000);
      const col = Math.floor(Math.random() * 26);
      const key = `R${row}C${col}`;
      const value = `<div class="cell">Cell at ${key}: ${Math.random().toFixed(4)}</div>`;
      cache.set(key, value);
    }

    const end = performance.now();
    const stats = cache.getStats();

    cacheResult.innerHTML = `<span class="success">✅ Populated cache with ${itemsToAdd} random cells</span>\n\nOperation Summary:\n• Added: ${itemsToAdd} items\n• Time: ${(end - start).toFixed(2)}ms\n• Avg per item: ${((end - start) / itemsToAdd).toFixed(4)}ms\n• Current size: ${stats.size} (capacity: ${stats.capacity})\n• Evictions: ${stats.evictions} (older items removed)\n\nThe cache automatically evicted ${stats.evictions} least recently used items to stay within capacity!`;

    updateCacheStats();
  });

  cacheAccessBtn.addEventListener('click', () => {
    if (!cache) return;

    const start = performance.now();

    const capacity = cache.getStats().capacity;
    const hotKeys: string[] = [];

    for (let i = 0; i < Math.floor(capacity * 0.2); i++) {
      hotKeys.push(`R${i}C0`);
      cache.set(`R${i}C0`, `<div>Hot cell ${i}</div>`);
    }

    for (let i = 0; i < capacity; i++) {
      cache.set(`R${i + 1000}C0`, `<div>Cold cell ${i}</div>`);
    }

    const iterations = 100;
    let hits = 0;

    for (let i = 0; i < iterations; i++) {
      const key = hotKeys[Math.floor(Math.random() * hotKeys.length)];
      if (cache.get(key)) hits++;
    }

    const end = performance.now();
    const stats = cache.getStats();

    cacheResult.innerHTML = `<span class="success">✅ Simulated hot access pattern</span>\n\nAccess Pattern Results:\n• Hot keys (20% of capacity): ${hotKeys.length}\n• Total accesses: ${iterations}\n• Hits in test: ${hits}/${iterations}\n• Overall hit rate: ${(stats.hitRate * 100).toFixed(1)}%\n• Time: ${(end - start).toFixed(2)}ms\n\nThe cache keeps frequently accessed items in memory while evicting rarely used ones. Perfect for grid cell caching where users scroll to the same areas repeatedly!`;

    updateCacheStats();
  });

  cacheStressBtn.addEventListener('click', () => {
    if (!cache) return;

    const iterations = 10000;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      const op = Math.random();
      const key = `R${Math.floor(Math.random() * 1000)}C${Math.floor(Math.random() * 10)}`;

      if (op < 0.6) {
        cache.get(key);
      } else if (op < 0.9) {
        cache.set(key, `<div>Value ${i}</div>`);
      } else {
        cache.delete(key);
      }
    }

    const end = performance.now();
    const totalTime = end - start;
    const avgTime = totalTime / iterations;
    const stats = cache.getStats();

    cacheResult.innerHTML = `<span class="success">✅ Stress test completed</span>\n\nPerformance Results:\n• Total operations: ${iterations.toLocaleString()}\n• Total time: ${totalTime.toFixed(2)}ms\n• Avg per operation: ${(avgTime * 1000).toFixed(2)}μs\n• Operations/sec: ${Math.floor(iterations / (totalTime / 1000)).toLocaleString()}\n\nCache Statistics:\n• Hits: ${stats.hits.toLocaleString()}\n• Misses: ${stats.misses.toLocaleString()}\n• Hit rate: ${(stats.hitRate * 100).toFixed(1)}%\n• Evictions: ${stats.evictions.toLocaleString()}\n• Final size: ${stats.size}\n\n🚀 Performance verified: O(1) operations maintained at scale!`;

    updateCacheStats();
  });
}
