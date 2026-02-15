import { SkipList } from '@zengrid/shared';

export function initSkipListDemo() {
  const skiplistKeyInput = document.getElementById('skiplist-key') as HTMLInputElement;
  const skiplistValueInput = document.getElementById('skiplist-value') as HTMLInputElement;
  const skiplistInsertBtn = document.getElementById('skiplist-insert-btn') as HTMLButtonElement;
  const skiplistDeleteBtn = document.getElementById('skiplist-delete-btn') as HTMLButtonElement;
  const skiplistClearBtn = document.getElementById('skiplist-clear-btn') as HTMLButtonElement;
  const skiplistRangeInput = document.getElementById('skiplist-range') as HTMLInputElement;
  const skiplistRangeBtn = document.getElementById('skiplist-range-btn') as HTMLButtonElement;
  const skiplistKthInput = document.getElementById('skiplist-kth') as HTMLInputElement;
  const skiplistKthBtn = document.getElementById('skiplist-kth-btn') as HTMLButtonElement;
  const skiplistPopulateBtn = document.getElementById('skiplist-populate-btn') as HTMLButtonElement;
  const skiplistBenchmarkBtn = document.getElementById('skiplist-benchmark-btn') as HTMLButtonElement;
  const skiplistVisualization = document.getElementById('skiplist-visualization') as HTMLDivElement;
  const skiplistResult = document.getElementById('skiplist-result') as HTMLDivElement;
  const skiplistSizeEl = document.getElementById('skiplist-size') as HTMLDivElement;
  const skiplistLevelEl = document.getElementById('skiplist-level') as HTMLDivElement;
  const skiplistMinEl = document.getElementById('skiplist-min') as HTMLDivElement;
  const skiplistMaxEl = document.getElementById('skiplist-max') as HTMLDivElement;
  const skiplistTimeEl = document.getElementById('skiplist-time') as HTMLDivElement;

  const skipList = new SkipList<number, string>();

  function updateSkipListStats() {
    const stats = skipList.getStats();

    skiplistSizeEl.textContent = stats.size.toString();
    skiplistLevelEl.textContent = stats.level.toString();

    const min = skipList.min();
    const max = skipList.max();

    skiplistMinEl.textContent = min ? min.key.toString() : '-';
    skiplistMaxEl.textContent = max ? max.key.toString() : '-';
  }

  function visualizeSkipList() {
    const entries = skipList.entries();

    if (entries.length === 0) {
      skiplistVisualization.innerHTML = '<div style="color: #999; padding: 20px; text-align: center;">Empty Skip List - Insert some data to see visualization</div>';
      return;
    }

    let html = '<div style="display: flex; gap: 4px; flex-wrap: wrap;">';

    entries.forEach(([key, value]) => {
      html += `<div style="
        display: inline-block;
        padding: 10px 14px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 6px;
        font-family: monospace;
        font-size: 13px;
        text-align: center;
        min-width: 80px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        <div style="font-size: 11px; opacity: 0.8; margin-bottom: 4px;">Key: ${key}</div>
        <div style="font-weight: bold; font-size: 14px;">${value}</div>
      </div>`;
    });

    html += '</div>';
    skiplistVisualization.innerHTML = html;
  }

  skiplistInsertBtn.addEventListener('click', () => {
    const key = parseInt(skiplistKeyInput.value);
    const value = skiplistValueInput.value.trim();

    if (isNaN(key)) {
      skiplistResult.innerHTML = '<span class="error">❌ Please enter a valid number for key</span>';
      return;
    }

    if (!value) {
      skiplistResult.innerHTML = '<span class="error">❌ Please enter a value</span>';
      return;
    }

    const start = performance.now();
    const oldValue = skipList.set(key, value);
    const end = performance.now();

    skiplistTimeEl.textContent = `${(end - start).toFixed(4)}ms`;

    if (oldValue !== undefined) {
      skiplistResult.innerHTML = `<span class="success">✅ Updated key ${key}</span>\n\nOld value: "${oldValue}"\nNew value: "${value}"\nTime: ${(end - start).toFixed(4)}ms`;
    } else {
      skiplistResult.innerHTML = `<span class="success">✅ Inserted key ${key}</span>\n\nValue: "${value}"\nTime: ${(end - start).toFixed(4)}ms\n\n💡 Skip List maintains sorted order automatically!`;
    }

    visualizeSkipList();
    updateSkipListStats();

    skiplistValueInput.value = '';
    skiplistKeyInput.value = (key + 1).toString();
  });

  skiplistDeleteBtn.addEventListener('click', () => {
    const key = parseInt(skiplistKeyInput.value);

    if (isNaN(key)) {
      skiplistResult.innerHTML = '<span class="error">❌ Please enter a valid number for key</span>';
      return;
    }

    const start = performance.now();
    const deleted = skipList.delete(key);
    const end = performance.now();

    skiplistTimeEl.textContent = `${(end - start).toFixed(4)}ms`;

    if (deleted) {
      skiplistResult.innerHTML = `<span class="success">✅ Deleted key ${key}</span>\n\nTime: ${(end - start).toFixed(4)}ms`;
    } else {
      skiplistResult.innerHTML = `<span class="error">❌ Key ${key} not found</span>\n\nTime: ${(end - start).toFixed(4)}ms`;
    }

    visualizeSkipList();
    updateSkipListStats();
  });

  skiplistClearBtn.addEventListener('click', () => {
    skipList.clear();

    skiplistResult.innerHTML = '<span class="success">✅ Skip List cleared</span>';
    visualizeSkipList();
    updateSkipListStats();
  });

  skiplistRangeBtn.addEventListener('click', () => {
    const rangeStr = skiplistRangeInput.value.trim();
    const match = rangeStr.match(/^(\d+)-(\d+)$/);

    if (!match) {
      skiplistResult.innerHTML = '<span class="error">❌ Invalid format. Use: "start-end" (e.g., "10-50")</span>';
      return;
    }

    const startKey = parseInt(match[1]);
    const endKey = parseInt(match[2]);

    if (startKey > endKey) {
      skiplistResult.innerHTML = '<span class="error">❌ Start key must be ≤ end key</span>';
      return;
    }

    const start = performance.now();
    const results = skipList.range(startKey, endKey);
    const end = performance.now();

    skiplistTimeEl.textContent = `${(end - start).toFixed(4)}ms`;

    if (results.length === 0) {
      skiplistResult.innerHTML = `<span style="color: #f39c12;">⚠️ No entries in range [${startKey}, ${endKey}]</span>\n\nTime: ${(end - start).toFixed(4)}ms`;
    } else {
      let output = `<span class="success">✅ Found ${results.length} entries in range [${startKey}, ${endKey}]</span>\n\nTime: ${(end - start).toFixed(4)}ms\n\n`;
      output += 'Results:\n';
      results.forEach(r => {
        output += `  ${r.key}: "${r.value}"\n`;
      });
      skiplistResult.innerHTML = output;
    }
  });

  skiplistKthBtn.addEventListener('click', () => {
    const k = parseInt(skiplistKthInput.value);

    if (isNaN(k) || k < 0) {
      skiplistResult.innerHTML = '<span class="error">❌ Please enter a valid non-negative number</span>';
      return;
    }

    const start = performance.now();
    const result = skipList.getKth(k);
    const end = performance.now();

    skiplistTimeEl.textContent = `${(end - start).toFixed(4)}ms`;

    if (result) {
      skiplistResult.innerHTML = `<span class="success">✅ Found ${k}th element</span>\n\nKey: ${result.key}\nValue: "${result.value}"\nTime: ${(end - start).toFixed(4)}ms\n\n💡 This is the ${k}th smallest element (0-indexed)`;
    } else {
      skiplistResult.innerHTML = `<span class="error">❌ Invalid index ${k}</span>\n\nSkip List size: ${skipList.size}\nValid range: 0 to ${skipList.size - 1}`;
    }
  });

  skiplistPopulateBtn.addEventListener('click', () => {
    const count = 50;

    skipList.clear();

    const start = performance.now();

    for (let i = 0; i < count; i++) {
      const key = Math.floor(Math.random() * 200);
      const value = `Item-${key}`;
      skipList.set(key, value);
    }

    const end = performance.now();

    skiplistTimeEl.textContent = `${(end - start).toFixed(2)}ms`;

    skiplistResult.innerHTML = `<span class="success">✅ Populated with random data</span>\n\nAttempted: ${count} insertions\nActual size: ${skipList.size} (duplicates were updated)\nTime: ${(end - start).toFixed(2)}ms\n\n💡 Data is automatically maintained in sorted order!`;

    visualizeSkipList();
    updateSkipListStats();
  });

  skiplistBenchmarkBtn.addEventListener('click', () => {
    const iterations = 10000;

    skipList.clear();

    let insertTime = 0;
    let searchTime = 0;
    let deleteTime = 0;
    let rangeTime = 0;

    let start = performance.now();
    for (let i = 0; i < iterations / 2; i++) {
      skipList.set(i, `value-${i}`);
    }
    let end = performance.now();
    insertTime = end - start;

    start = performance.now();
    for (let i = 0; i < iterations; i++) {
      skipList.get(Math.floor(Math.random() * iterations / 2));
    }
    end = performance.now();
    searchTime = end - start;

    start = performance.now();
    for (let i = 0; i < 100; i++) {
      const startKey = Math.floor(Math.random() * 1000);
      skipList.range(startKey, startKey + 100);
    }
    end = performance.now();
    rangeTime = end - start;

    start = performance.now();
    for (let i = 0; i < 1000; i++) {
      skipList.delete(i);
    }
    end = performance.now();
    deleteTime = end - start;

    const totalTime = insertTime + searchTime + rangeTime + deleteTime;

    skiplistTimeEl.textContent = `${totalTime.toFixed(2)}ms`;

    skiplistResult.innerHTML = `<span class="success">✅ Benchmark completed</span>\n\nInsert (5K ops):\n• Total: ${insertTime.toFixed(2)}ms\n• Avg: ${(insertTime / (iterations / 2) * 1000).toFixed(2)}μs/op\n• Ops/sec: ${Math.floor((iterations / 2) / (insertTime / 1000)).toLocaleString()}\n\nSearch (10K ops):\n• Total: ${searchTime.toFixed(2)}ms\n• Avg: ${(searchTime / iterations * 1000).toFixed(2)}μs/op\n• Ops/sec: ${Math.floor(iterations / (searchTime / 1000)).toLocaleString()}\n\nRange Query (100 ops):\n• Total: ${rangeTime.toFixed(2)}ms\n• Avg: ${(rangeTime / 100).toFixed(2)}ms/op\n\nDelete (1K ops):\n• Total: ${deleteTime.toFixed(2)}ms\n• Avg: ${(deleteTime / 1000 * 1000).toFixed(2)}μs/op\n\n🚀 Total time: ${totalTime.toFixed(2)}ms\nFinal size: ${skipList.size}`;

    visualizeSkipList();
    updateSkipListStats();
  });

  visualizeSkipList();
  updateSkipListStats();
}
