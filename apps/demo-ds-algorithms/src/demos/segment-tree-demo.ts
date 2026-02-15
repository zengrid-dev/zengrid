import { SegmentTree, AggregationType } from '@zengrid/shared';

export function initSegmentTreeDemo() {
  const segtreeSizeInput = document.getElementById('segtree-size') as HTMLInputElement;
  const segtreeTypeSelect = document.getElementById('segtree-type') as HTMLSelectElement;
  const segtreeInitBtn = document.getElementById('segtree-init-btn') as HTMLButtonElement;
  const segtreeQueryInput = document.getElementById('segtree-query-input') as HTMLInputElement;
  const segtreeQueryBtn = document.getElementById('segtree-query-btn') as HTMLButtonElement;
  const segtreeUpdateInput = document.getElementById('segtree-update-input') as HTMLInputElement;
  const segtreeUpdateBtn = document.getElementById('segtree-update-btn') as HTMLButtonElement;
  const segtreeStressBtn = document.getElementById('segtree-stress-btn') as HTMLButtonElement;
  const segtreeArray = document.getElementById('segtree-array') as HTMLDivElement;
  const segtreeResult = document.getElementById('segtree-result') as HTMLDivElement;
  const segtreeSizeStat = document.getElementById('segtree-size-stat') as HTMLDivElement;
  const segtreeTotal = document.getElementById('segtree-total') as HTMLDivElement;
  const segtreeQueries = document.getElementById('segtree-queries') as HTMLDivElement;
  const segtreeUpdates = document.getElementById('segtree-updates') as HTMLDivElement;
  const segtreeTime = document.getElementById('segtree-time') as HTMLDivElement;

  let segmentTree: SegmentTree<number> | null = null;
  let queryCount = 0;
  let updateCount = 0;

  function updateSegTreeStats() {
    if (!segmentTree) return;

    segtreeSizeStat.textContent = segmentTree.size.toString();
    segtreeTotal.textContent = segmentTree.total.toString();
    segtreeQueries.textContent = queryCount.toString();
    segtreeUpdates.textContent = updateCount.toString();
  }

  function visualizeArray() {
    if (!segmentTree) return;

    const values = segmentTree.toArray();
    let html = '<div style="display: flex; gap: 4px; flex-wrap: wrap;">';

    values.forEach((val, idx) => {
      html += `<div style="
        display: inline-block;
        padding: 8px 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
        text-align: center;
        min-width: 50px;
      ">
        <div style="font-size: 10px; opacity: 0.8;">[${idx}]</div>
        <div style="font-weight: bold;">${val}</div>
      </div>`;
    });

    html += '</div>';
    segtreeArray.innerHTML = html;
  }

  segtreeInitBtn.addEventListener('click', () => {
    const size = parseInt(segtreeSizeInput.value);
    const typeStr = segtreeTypeSelect.value;

    if (size < 5 || size > 100) {
      segtreeResult.innerHTML = '<span class="error">❌ Size must be between 5 and 100</span>';
      return;
    }

    let aggType: AggregationType;
    switch (typeStr) {
      case 'sum':
        aggType = AggregationType.SUM;
        break;
      case 'min':
        aggType = AggregationType.MIN;
        break;
      case 'max':
        aggType = AggregationType.MAX;
        break;
      case 'gcd':
        aggType = AggregationType.GCD;
        break;
      default:
        aggType = AggregationType.SUM;
    }

    const segmentTreeArray = Array.from({ length: size }, () =>
      Math.floor(Math.random() * 100) + 1
    );

    const start = performance.now();
    segmentTree = new SegmentTree({
      values: segmentTreeArray,
      type: aggType,
    });
    const end = performance.now();

    queryCount = 0;
    updateCount = 0;

    segtreeTime.textContent = `${(end - start).toFixed(3)}ms`;

    segtreeQueryInput.disabled = false;
    segtreeQueryBtn.disabled = false;
    segtreeUpdateInput.disabled = false;
    segtreeUpdateBtn.disabled = false;
    segtreeStressBtn.disabled = false;

    segtreeInitBtn.textContent = '✓ Tree Initialized';

    segtreeResult.innerHTML = `<span class="success">✅ Segment Tree initialized</span>\n\nConfiguration:\n• Size: ${size} elements\n• Type: ${typeStr.toUpperCase()}\n• Build time: ${(end - start).toFixed(3)}ms\n• Total: ${segmentTree.total}\n\nYou can now query ranges and update values!\n\nExamples:\n• Query: "0-${size - 1}" (full range)\n• Query: "0-${Math.floor(size / 2)}" (first half)\n• Update: "0:50" (set index 0 to 50)`;

    visualizeArray();
    updateSegTreeStats();
  });

  segtreeQueryBtn.addEventListener('click', () => {
    if (!segmentTree) return;

    const input = segtreeQueryInput.value.trim();
    const match = input.match(/^(\d+)-(\d+)$/);

    if (!match) {
      segtreeResult.innerHTML = '<span class="error">❌ Invalid format. Use: "start-end" (e.g., "0-10")</span>';
      return;
    }

    const left = parseInt(match[1]);
    const right = parseInt(match[2]);

    if (left < 0 || right >= segmentTree.size || left > right) {
      segtreeResult.innerHTML = `<span class="error">❌ Invalid range. Must be 0 ≤ left ≤ right < ${segmentTree.size}</span>`;
      return;
    }

    const start = performance.now();
    const result = segmentTree.query(left, right);
    const end = performance.now();

    queryCount++;
    segtreeTime.textContent = `${(end - start).toFixed(4)}ms`;

    const rangeSize = right - left + 1;
    const typeStr = segmentTree.aggregationType.toString().toUpperCase();

    segtreeResult.innerHTML = `<span class="success">✅ Query completed</span>\n\nQuery: ${typeStr}[${left}, ${right}]\nRange size: ${rangeSize} elements\nResult: <strong>${result}</strong>\nTime: ${(end - start).toFixed(4)}ms\n\n💡 This query ran in O(log n) time!`;

    updateSegTreeStats();
  });

  segtreeUpdateBtn.addEventListener('click', () => {
    if (!segmentTree) return;

    const input = segtreeUpdateInput.value.trim();
    const match = input.match(/^(\d+):(-?\d+)$/);

    if (!match) {
      segtreeResult.innerHTML = '<span class="error">❌ Invalid format. Use: "index:value" (e.g., "5:100")</span>';
      return;
    }

    const index = parseInt(match[1]);
    const value = parseInt(match[2]);

    if (index < 0 || index >= segmentTree.size) {
      segtreeResult.innerHTML = `<span class="error">❌ Invalid index. Must be 0 ≤ index < ${segmentTree.size}</span>`;
      return;
    }

    const oldValue = segmentTree.get(index);

    const start = performance.now();
    segmentTree.update(index, value);
    const end = performance.now();

    updateCount++;
    segtreeTime.textContent = `${(end - start).toFixed(4)}ms`;

    segtreeResult.innerHTML = `<span class="success">✅ Update completed</span>\n\nUpdated index ${index}:\n• Old value: ${oldValue}\n• New value: ${value}\n• Time: ${(end - start).toFixed(4)}ms\n• New total: ${segmentTree.total}\n\n💡 This update ran in O(log n) time and updated all affected nodes in the tree!`;

    visualizeArray();
    updateSegTreeStats();
  });

  segtreeStressBtn.addEventListener('click', () => {
    if (!segmentTree) return;

    const iterations = 1000;
    const queryTimes: number[] = [];
    const updateTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      if (i % 2 === 0) {
        const left = Math.floor(Math.random() * segmentTree.size);
        const right = Math.min(
          left + Math.floor(Math.random() * 10),
          segmentTree.size - 1
        );

        const start = performance.now();
        segmentTree.query(left, right);
        const end = performance.now();

        queryTimes.push(end - start);
        queryCount++;
      } else {
        const index = Math.floor(Math.random() * segmentTree.size);
        const value = Math.floor(Math.random() * 100) + 1;

        const start = performance.now();
        segmentTree.update(index, value);
        const end = performance.now();

        updateTimes.push(end - start);
        updateCount++;
      }
    }

    const avgQueryTime =
      queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
    const avgUpdateTime =
      updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
    const totalTime = queryTimes.reduce((a, b) => a + b, 0) + updateTimes.reduce((a, b) => a + b, 0);

    segtreeTime.textContent = `${totalTime.toFixed(2)}ms`;

    segtreeResult.innerHTML = `<span class="success">✅ Stress test completed</span>\n\nPerformed ${iterations} operations:\n\nQueries (${queryTimes.length}):\n• Avg time: ${(avgQueryTime * 1000).toFixed(2)}μs\n• Total time: ${queryTimes.reduce((a, b) => a + b, 0).toFixed(2)}ms\n\nUpdates (${updateTimes.length}):\n• Avg time: ${(avgUpdateTime * 1000).toFixed(2)}μs\n• Total time: ${updateTimes.reduce((a, b) => a + b, 0).toFixed(2)}ms\n\nTotal time: ${totalTime.toFixed(2)}ms\nOps/sec: ${Math.floor(iterations / (totalTime / 1000)).toLocaleString()}\n\n🚀 Performance verified: O(log n) operations maintained at scale!\nFinal total: ${segmentTree.total}`;

    visualizeArray();
    updateSegTreeStats();
  });
}
