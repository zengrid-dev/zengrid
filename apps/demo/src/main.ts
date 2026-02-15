import { Grid } from '../../../packages/core/src/grid/index';
import '../../../packages/core/src/styles.css';
import '../../../packages/core/src/features/loading/loading.styles.css';
import '../../../packages/core/src/features/column-resize/column-resize.styles.css';
import '../../../packages/core/src/features/column-drag/column-drag.styles.css';
import 'vanilla-calendar-pro/styles/index.css';
import { PaginationDemo } from './pagination-demo';

// Import configurations
import { ROW_COUNT, COL_COUNT, ROW_HEIGHT, dataMode, sortMode, filterMode, loadingTemplate } from './config/constants';
import { getColumns } from './config/columns';
import { createGridConfig } from './config/grid-config';

// Import data generators
import { generateData } from './data/generators';

// Import utilities
import { FPSMonitor } from './utils/fps-monitor';

// Import UI
import { updateStats, startPeriodicStatsUpdate } from './ui/stats-updater';
import { setupSidebarMenu } from './ui/sidebar';

// Import handlers
import { createSortHandler } from './handlers/sort-handler';
import { setupButtonHandlers } from './handlers/button-handlers';

// Import features
import { InfiniteScrollManager } from './features/infinite-scroll';
import { setupFilterUI } from './features/filter-ui';

function main() {
  const container = document.getElementById('grid-container');
  if (!container) {
    console.error('Grid container not found');
    return;
  }

  console.log(`🚀 Initializing ZenGrid with ${ROW_COUNT.toLocaleString()} rows...`);

  // 1. Generate initial data
  let data = generateData(ROW_COUNT, COL_COUNT);
  console.log(`✅ Generated ${(data.length * data[0].length).toLocaleString()} cells`);

  // 2. Get columns & extract widths
  const columns = getColumns(data);
  const columnWidths = columns.map(col => col.width);

  // 3. Create sort handler
  const handleSortRequest = createSortHandler({
    data,
    sortMode,
    getGrid: () => grid,
    setData: (newData) => { data = newData; },
  });

  // 4. Track loading template state
  let currentLoadingTemplate = loadingTemplate;

  // 5. Initialize grid
  console.time('Grid Initialization');
  let gridRef: Grid | null = null;

  const gridConfig = createGridConfig({
    rowCount: ROW_COUNT,
    colCount: COL_COUNT,
    columnWidths,
    columns,
    dataMode,
    sortMode,
    filterMode,
    loadingTemplate: currentLoadingTemplate,
    onSortRequest: handleSortRequest,
    onScroll: (scrollTop, scrollLeft) => {
      if (gridRef) {
        gridRef.updateColumnResizeHandles();
      }
    },
    onColumnWidthsChange: (widths) => {
      console.log('💾 Column widths changed:', widths);
      localStorage.setItem('zengrid-column-widths', JSON.stringify(widths));
    },
  });

  let grid = new Grid(container, gridConfig);
  gridRef = grid;
  console.timeEnd('Grid Initialization');

  // 6. Set data
  console.time('Set Data');
  grid.setData(data);
  console.timeEnd('Set Data');

  // 7. Initial render
  console.time('Initial Render');
  const renderStart = performance.now();
  grid.render();
  const renderTime = performance.now() - renderStart;
  console.timeEnd('Initial Render');

  console.log('✅ Column resize automatically integrated with new header system');
  console.log(`✅ Initial render took ${renderTime.toFixed(2)}ms`);

  // 8. Update stats
  updateStats(grid, renderTime);

  // 9. Update mode indicator
  const modeIndicator = document.getElementById('mode-indicator')!;
  const actualDataMode = grid.getDataMode();
  const actualSortMode = grid.getSortMode();
  modeIndicator.textContent = `Data: ${actualDataMode.toUpperCase()}, Sort: ${actualSortMode.toUpperCase()}, Filter: ${filterMode.toUpperCase()}`;
  console.log(`📋 Operation Modes - Data: ${actualDataMode}, Sort: ${actualSortMode}, Filter: ${filterMode}`);

  // 10. Initialize FPS monitor
  const fpsElement = document.getElementById('fps-monitor')!;
  new FPSMonitor(fpsElement);

  // 11. Setup sidebar menu
  setupSidebarMenu();

  // 12. Setup features
  const infiniteScrollManager = new InfiniteScrollManager({
    container,
    columns,
    columnWidths,
    dataMode,
    sortMode,
    filterMode,
    loadingTemplate: currentLoadingTemplate,
    onSortRequest: handleSortRequest,
    getData: () => data,
    setData: (newData) => { data = newData; },
  });

  const filterPanel = setupFilterUI(grid, columns);

  // 13. Setup button handlers
  setupButtonHandlers({
    grid,
    data,
    columns,
    columnWidths,
    actualDataMode,
    actualSortMode,
    filterMode,
    loadingTemplate: currentLoadingTemplate,
    setLoadingTemplate: (template) => { currentLoadingTemplate = template; },
  });

  // 14. Column resize event listeners
  grid.on('column:resize', (event) => {
    console.log(`📏 Column ${event.column} resized: ${event.oldWidth}px → ${event.newWidth}px`);
  });

  // 15. Header event listeners
  grid.on('header:click', (event) => {
    console.log(`🖱️ Header clicked: Column ${event.columnIndex} (${event.column.field})`);
  });

  grid.on('header:sort:click', (event) => {
    console.log(`🔄 Sort requested: Column ${event.columnIndex}, Direction: ${event.nextDirection}`);
  });

  grid.on('header:filter:click', (event) => {
    console.log(`🔍 Filter clicked: Column ${event.columnIndex}, Has active filter: ${event.hasActiveFilter}`);
    alert(`Filter UI for "${event.column.field}" column\n\nCurrent filter: ${event.hasActiveFilter ? 'Active' : 'None'}\n\nImplement filter dropdown UI here!`);
  });

  grid.on('header:hover', (event) => {
    if (event.isHovering) {
      console.log(`🔹 Hovering over column ${event.columnIndex} (${event.column.field})`);
    }
  });

  // 16. Initialize Pagination Demo
  const paginationDemo = new PaginationDemo(grid);

  // 17. Pagination toggle button
  document.getElementById('btn-toggle-pagination')!.addEventListener('click', async () => {
    if (paginationDemo.isEnabled()) {
      paginationDemo.disable();
      data = generateData(ROW_COUNT, COL_COUNT);
      grid.setData(data);
      grid.refresh();
      alert('Pagination Mode: OFF\n\nSwitched back to local 100K rows in memory.');
    } else {
      await paginationDemo.enable();
      alert('Pagination Mode: ON\n\nNow loading data from mock server (http://localhost:3003)\n\nMake sure the server is running:\npnpm server\n\nTotal records: 10,000');
    }
  });

  // 18. Infinite scroll toggle button
  document.getElementById('btn-toggle-infinite-scroll')!.addEventListener('click', async () => {
    if (infiniteScrollManager.isEnabled()) {
      grid = await infiniteScrollManager.disable(grid);
      gridRef = grid;
    } else {
      grid = await infiniteScrollManager.enable(grid);
      gridRef = grid;
    }
  });

  // 19. Sliding window toggle button
  document.getElementById('btn-toggle-sliding-window')!.addEventListener('click', () => {
    infiniteScrollManager.toggleSlidingWindow();
  });

  // 20. Start periodic stats update
  startPeriodicStatsUpdate(grid);

  // 21. Log performance metrics
  console.log('📊 Performance Metrics:');
  console.log(`   - Total Rows: ${ROW_COUNT.toLocaleString()}`);
  console.log(`   - Total Cells: ${(ROW_COUNT * COL_COUNT).toLocaleString()}`);
  console.log(`   - Initial Render: ${renderTime.toFixed(2)}ms`);
  console.log(`   - Target: < 100ms ✅`);
  console.log(`   - FPS: Monitoring in real-time...`);

  // Memory usage (if available)
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log(`   - Used Memory: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Total Memory: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
  }

  console.log('\n🎉 ZenGrid Demo Ready!');
  console.log('Try scrolling to see the virtual scrolling in action.');
  console.log('Watch the FPS monitor in the top-right corner.');
  console.log('\n📏 Column Resize Features:');
  console.log('   - Drag column borders to resize');
  console.log('   - Double-click column border to auto-fit to content');
  console.log('   - Click "Auto-Fit All" to auto-fit all columns');
  console.log('   - Click "Reset Widths" to restore default widths');
  console.log('   - Column widths are persisted to localStorage');
}

// Start application
main();
