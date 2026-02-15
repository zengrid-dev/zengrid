import { DisjointSet, DisjointSetUtils } from '@zengrid/shared';

export function initDisjointSetDemo() {
  const disjointGridSizeInput = document.getElementById('disjoint-grid-size') as HTMLInputElement;
  const disjointInitBtn = document.getElementById('disjoint-init-btn') as HTMLButtonElement;
  const disjointMergeInput = document.getElementById('disjoint-merge-input') as HTMLInputElement;
  const disjointMergeBtn = document.getElementById('disjoint-merge-btn') as HTMLButtonElement;
  const disjointCheckInput = document.getElementById('disjoint-check-input') as HTMLInputElement;
  const disjointCheckBtn = document.getElementById('disjoint-check-btn') as HTMLButtonElement;
  const disjointPreset1Btn = document.getElementById('disjoint-preset1') as HTMLButtonElement;
  const disjointPreset2Btn = document.getElementById('disjoint-preset2') as HTMLButtonElement;
  const disjointBenchmarkBtn = document.getElementById('disjoint-benchmark-btn') as HTMLButtonElement;
  const disjointVisualization = document.getElementById('disjoint-visualization') as HTMLDivElement;
  const disjointResult = document.getElementById('disjoint-result') as HTMLDivElement;
  const disjointCellsEl = document.getElementById('disjoint-cells') as HTMLDivElement;
  const disjointSetsEl = document.getElementById('disjoint-sets') as HTMLDivElement;
  const disjointLargestEl = document.getElementById('disjoint-largest') as HTMLDivElement;
  const disjointTimeEl = document.getElementById('disjoint-time') as HTMLDivElement;

  let disjointSet: DisjointSet<[number, number]> | null = null;
  let gridRows = 0;
  let gridCols = 0;

  function updateDisjointSetStats() {
    if (!disjointSet) return;

    const stats = disjointSet.getStats();

    disjointCellsEl.textContent = stats.totalElements.toString();
    disjointSetsEl.textContent = stats.numSets.toString();
    disjointLargestEl.textContent = stats.largestSetSize.toString();
  }

  function visualizeDisjointGrid() {
    if (!disjointSet) {
      disjointVisualization.innerHTML = '<div style="color: #999; padding: 20px; text-align: center;">Grid not initialized - Click "Initialize Grid" button</div>';
      return;
    }

    const sets = disjointSet.getSets();
    const colorMap = new Map<string, string>();

    const colors = [
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
      '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#d35400',
      '#c0392b', '#27ae60', '#2980b9', '#8e44ad', '#16a085'
    ];

    let colorIndex = 0;
    sets.forEach((_cells, root) => {
      const rootKey = DisjointSetUtils.gridHashFn(root);
      colorMap.set(rootKey, colors[colorIndex % colors.length]);
      colorIndex++;
    });

    let html = '<table style="border-collapse: collapse; margin: 0 auto;">';

    for (let row = 0; row < gridRows; row++) {
      html += '<tr>';
      for (let col = 0; col < gridCols; col++) {
        const cell: [number, number] = [row, col];
        const root = disjointSet.find(cell);
        const rootKey = root ? DisjointSetUtils.gridHashFn(root) : '';
        const color = colorMap.get(rootKey) || '#ecf0f1';
        const setSize = disjointSet.getSetSize(cell);

        html += `<td style="
          width: 40px;
          height: 40px;
          border: 1px solid #bdc3c7;
          text-align: center;
          background: ${color};
          color: white;
          font-size: 10px;
          font-weight: bold;
          vertical-align: middle;
          position: relative;
        ">
          <div style="font-size: 9px; opacity: 0.8;">${row},${col}</div>
          ${setSize > 1 ? `<div style="font-size: 8px; position: absolute; bottom: 2px; right: 2px; background: rgba(0,0,0,0.3); padding: 1px 3px; border-radius: 2px;">${setSize}</div>` : ''}
        </td>`;
      }
      html += '</tr>';
    }

    html += '</table>';
    html += '<div style="margin-top: 10px; font-size: 11px; color: #666; text-align: center;">Each color represents a merged cell region. Numbers in bottom-right show set size.</div>';

    disjointVisualization.innerHTML = html;
  }

  disjointInitBtn.addEventListener('click', () => {
    const sizeStr = disjointGridSizeInput.value.trim();
    const match = sizeStr.match(/^(\d+)x(\d+)$/i);

    if (!match) {
      disjointResult.innerHTML = '<span class="error">❌ Invalid format. Use: "rowsxcols" (e.g., "10x10")</span>';
      return;
    }

    gridRows = parseInt(match[1]);
    gridCols = parseInt(match[2]);

    if (gridRows < 1 || gridRows > 20 || gridCols < 1 || gridCols > 20) {
      disjointResult.innerHTML = '<span class="error">❌ Grid size must be between 1x1 and 20x20</span>';
      return;
    }

    const start = performance.now();

    disjointSet = new DisjointSet<[number, number]>({
      hashFn: DisjointSetUtils.gridHashFn,
      equalityFn: DisjointSetUtils.gridEqualityFn,
    });

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        disjointSet.makeSet([row, col]);
      }
    }

    const end = performance.now();

    disjointTimeEl.textContent = `${(end - start).toFixed(3)}ms`;

    disjointMergeInput.disabled = false;
    disjointMergeBtn.disabled = false;
    disjointCheckInput.disabled = false;
    disjointCheckBtn.disabled = false;
    disjointPreset1Btn.disabled = false;
    disjointPreset2Btn.disabled = false;
    disjointBenchmarkBtn.disabled = false;

    disjointInitBtn.textContent = '✓ Grid Initialized';

    disjointResult.innerHTML = `<span class="success">✅ Grid initialized</span>\n\nSize: ${gridRows} rows × ${gridCols} columns\nTotal cells: ${gridRows * gridCols}\nTime: ${(end - start).toFixed(3)}ms\n\nYou can now merge cells and check connections!\n\nExamples:\n• Merge: "(0,0)-(2,2)" (3×3 block)\n• Merge: "(0,0)-(0,${gridCols - 1})" (header row)\n• Check: "(0,0),(1,1)" (are they merged?)`;

    visualizeDisjointGrid();
    updateDisjointSetStats();
  });

  disjointMergeBtn.addEventListener('click', () => {
    if (!disjointSet) return;

    const input = disjointMergeInput.value.trim();
    const match = input.match(/^\((\d+),(\d+)\)-\((\d+),(\d+)\)$/);

    if (!match) {
      disjointResult.innerHTML = '<span class="error">❌ Invalid format. Use: "(row1,col1)-(row2,col2)" (e.g., "(0,0)-(2,2)")</span>';
      return;
    }

    const row1 = parseInt(match[1]);
    const col1 = parseInt(match[2]);
    const row2 = parseInt(match[3]);
    const col2 = parseInt(match[4]);

    if (
      row1 < 0 || row1 >= gridRows || col1 < 0 || col1 >= gridCols ||
      row2 < 0 || row2 >= gridRows || col2 < 0 || col2 >= gridCols
    ) {
      disjointResult.innerHTML = `<span class="error">❌ Coordinates out of bounds. Valid range: 0-${gridRows - 1}, 0-${gridCols - 1}</span>`;
      return;
    }

    const startRow = Math.min(row1, row2);
    const endRow = Math.max(row1, row2);
    const startCol = Math.min(col1, col2);
    const endCol = Math.max(col1, col2);

    const start = performance.now();

    let mergeCount = 0;
    const firstCell: [number, number] = [startRow, startCol];

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (row === startRow && col === startCol) continue;

        const merged = disjointSet.union(firstCell, [row, col]);
        if (merged) mergeCount++;
      }
    }

    const end = performance.now();

    disjointTimeEl.textContent = `${(end - start).toFixed(4)}ms`;

    const totalCells = (endRow - startRow + 1) * (endCol - startCol + 1);
    const setSize = disjointSet.getSetSize(firstCell);

    disjointResult.innerHTML = `<span class="success">✅ Merged cell range</span>\n\nRange: (${startRow},${startCol}) to (${endRow},${endCol})\nCells in range: ${totalCells}\nMerge operations: ${mergeCount}\nFinal set size: ${setSize}\nTime: ${(end - start).toFixed(4)}ms\n\n💡 All cells in this range are now in the same set!\nPath compression ensures future queries are O(α(n)) ≈ O(1)`;

    visualizeDisjointGrid();
    updateDisjointSetStats();
  });

  disjointCheckBtn.addEventListener('click', () => {
    if (!disjointSet) return;

    const input = disjointCheckInput.value.trim();
    const match = input.match(/^\((\d+),(\d+)\),\((\d+),(\d+)\)$/);

    if (!match) {
      disjointResult.innerHTML = '<span class="error">❌ Invalid format. Use: "(row1,col1),(row2,col2)" (e.g., "(0,0),(1,1)")</span>';
      return;
    }

    const row1 = parseInt(match[1]);
    const col1 = parseInt(match[2]);
    const row2 = parseInt(match[3]);
    const col2 = parseInt(match[4]);

    if (
      row1 < 0 || row1 >= gridRows || col1 < 0 || col1 >= gridCols ||
      row2 < 0 || row2 >= gridRows || col2 < 0 || col2 >= gridCols
    ) {
      disjointResult.innerHTML = `<span class="error">❌ Coordinates out of bounds. Valid range: 0-${gridRows - 1}, 0-${gridCols - 1}</span>`;
      return;
    }

    const cell1: [number, number] = [row1, col1];
    const cell2: [number, number] = [row2, col2];

    const start = performance.now();
    const connected = disjointSet.connected(cell1, cell2);
    const root1 = disjointSet.find(cell1);
    const root2 = disjointSet.find(cell2);
    const setSize1 = disjointSet.getSetSize(cell1);
    const setSize2 = disjointSet.getSetSize(cell2);
    const end = performance.now();

    disjointTimeEl.textContent = `${(end - start).toFixed(4)}ms`;

    if (connected) {
      disjointResult.innerHTML = `<span class="success">✅ Cells are CONNECTED</span>\n\nCell 1: (${row1},${col1})\nCell 2: (${row2},${col2})\n\nBoth cells belong to the same merged region!\n\nRoot: (${root1?.[0]},${root1?.[1]})\nSet size: ${setSize1} cells\nTime: ${(end - start).toFixed(4)}ms\n\n💡 This query ran in O(α(n)) ≈ O(1) time!`;
    } else {
      disjointResult.innerHTML = `<span style="color: #f39c12;">⚠️ Cells are NOT connected</span>\n\nCell 1: (${row1},${col1})\n• Root: (${root1?.[0]},${root1?.[1]})\n• Set size: ${setSize1}\n\nCell 2: (${row2},${col2})\n• Root: (${root2?.[0]},${root2?.[1]})\n• Set size: ${setSize2}\n\nTime: ${(end - start).toFixed(4)}ms`;
    }
  });

  disjointPreset1Btn.addEventListener('click', () => {
    if (!disjointSet) return;

    const start = performance.now();

    let mergeCount = 0;
    for (let col = 1; col < gridCols; col++) {
      const merged = disjointSet.union([0, 0], [0, col]);
      if (merged) mergeCount++;
    }

    const end = performance.now();

    disjointTimeEl.textContent = `${(end - start).toFixed(4)}ms`;

    disjointResult.innerHTML = `<span class="success">✅ Merged header row</span>\n\nMerged cells (0,0) through (0,${gridCols - 1})\nMerge operations: ${mergeCount}\nTime: ${(end - start).toFixed(4)}ms\n\n💡 Common pattern for spreadsheet headers!`;

    visualizeDisjointGrid();
    updateDisjointSetStats();
  });

  disjointPreset2Btn.addEventListener('click', () => {
    if (!disjointSet) return;

    const start = performance.now();

    let mergeCount = 0;
    for (let row = 0; row < gridRows - 1; row += 2) {
      for (let col = 0; col < gridCols - 1; col += 2) {
        const firstCell: [number, number] = [row, col];

        for (let dr = 0; dr < 2; dr++) {
          for (let dc = 0; dc < 2; dc++) {
            if (dr === 0 && dc === 0) continue;
            if (row + dr >= gridRows || col + dc >= gridCols) continue;

            const merged = disjointSet.union(firstCell, [row + dr, col + dc]);
            if (merged) mergeCount++;
          }
        }
      }
    }

    const end = performance.now();

    disjointTimeEl.textContent = `${(end - start).toFixed(4)}ms`;

    disjointResult.innerHTML = `<span class="success">✅ Created 2×2 merged blocks</span>\n\nMerge operations: ${mergeCount}\nTime: ${(end - start).toFixed(4)}ms\n\n💡 Creates a checkerboard pattern of merged cells!`;

    visualizeDisjointGrid();
    updateDisjointSetStats();
  });

  disjointBenchmarkBtn.addEventListener('click', () => {
    const benchRows = 100;
    const benchCols = 100;
    const totalCells = benchRows * benchCols;

    const benchSet = new DisjointSet<[number, number]>({
      hashFn: DisjointSetUtils.gridHashFn,
      equalityFn: DisjointSetUtils.gridEqualityFn,
    });

    let start = performance.now();
    for (let row = 0; row < benchRows; row++) {
      for (let col = 0; col < benchCols; col++) {
        benchSet.makeSet([row, col]);
      }
    }
    let end = performance.now();
    const initTime = end - start;

    start = performance.now();
    let mergeCount = 0;
    for (let row = 0; row < benchRows; row += 5) {
      for (let col = 0; col < benchCols - 1; col++) {
        benchSet.union([row, col], [row, col + 1]);
        mergeCount++;
      }
    }
    end = performance.now();
    const mergeTime = end - start;

    start = performance.now();
    let checkCount = 0;
    for (let i = 0; i < 1000; i++) {
      const row = Math.floor(Math.random() * benchRows);
      const col1 = Math.floor(Math.random() * benchCols);
      const col2 = Math.floor(Math.random() * benchCols);
      benchSet.connected([row, col1], [row, col2]);
      checkCount++;
    }
    end = performance.now();
    const checkTime = end - start;

    const totalTime = initTime + mergeTime + checkTime;

    disjointTimeEl.textContent = `${totalTime.toFixed(2)}ms`;

    const stats = benchSet.getStats();

    disjointResult.innerHTML = `<span class="success">✅ Benchmark completed on ${benchRows}×${benchCols} grid</span>\n\nInitialization (${totalCells} cells):\n• Time: ${initTime.toFixed(2)}ms\n• Ops/sec: ${Math.floor(totalCells / (initTime / 1000)).toLocaleString()}\n\nMerge Operations (${mergeCount} unions):\n• Time: ${mergeTime.toFixed(2)}ms\n• Avg: ${(mergeTime / mergeCount * 1000).toFixed(2)}μs/op\n• Ops/sec: ${Math.floor(mergeCount / (mergeTime / 1000)).toLocaleString()}\n\nConnectivity Checks (${checkCount} queries):\n• Time: ${checkTime.toFixed(2)}ms\n• Avg: ${(checkTime / checkCount * 1000).toFixed(2)}μs/op\n• Ops/sec: ${Math.floor(checkCount / (checkTime / 1000)).toLocaleString()}\n\n📊 Final Statistics:\n• Total cells: ${stats.totalElements}\n• Disjoint sets: ${stats.numSets}\n• Largest merge: ${stats.largestSetSize} cells\n\n🚀 Total time: ${totalTime.toFixed(2)}ms\n💡 Path compression + union by rank = O(α(n)) ≈ O(1)!`;
  });

  visualizeDisjointGrid();
  updateDisjointSetStats();
}
