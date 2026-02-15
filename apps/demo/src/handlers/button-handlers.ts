import { Grid } from '../../../../packages/core/src/grid/index';
import { ROW_COUNT, COL_COUNT } from '../config/constants';
import { generateRandomData } from '../data/generators';
import { updateStats } from '../ui/stats-updater';

export interface ButtonHandlersContext {
  grid: Grid;
  data: any[][];
  columns: any[];
  columnWidths: number[];
  actualDataMode: 'frontend' | 'backend';
  actualSortMode: 'frontend' | 'backend';
  filterMode: 'frontend' | 'backend';
  loadingTemplate: 'simple' | 'animated' | 'modern' | 'skeleton' | 'overlay';
  setLoadingTemplate: (template: any) => void;
}

export function setupButtonHandlers(context: ButtonHandlersContext) {
  const { grid, columns } = context;

  // Refresh button
  document.getElementById('btn-refresh')!.addEventListener('click', () => {
    console.log('🔄 Refreshing grid...');
    const start = performance.now();
    grid.refresh();
    const time = performance.now() - start;
    console.log(`✅ Refresh took ${time.toFixed(2)}ms`);
    updateStats(grid, time);
  });

  // Random data button
  document.getElementById('btn-random')!.addEventListener('click', () => {
    console.log('🎲 Generating random data...');
    const randomData = generateRandomData(ROW_COUNT, COL_COUNT);
    const start = performance.now();
    grid.setData(randomData);
    grid.refresh();
    const time = performance.now() - start;
    console.log(`✅ Random data set in ${time.toFixed(2)}ms`);
    updateStats(grid, time);
  });

  // Scroll buttons
  document.getElementById('btn-scroll-top')!.addEventListener('click', () => {
    grid.scrollToCell(0, 0);
  });

  document.getElementById('btn-scroll-bottom')!.addEventListener('click', () => {
    grid.scrollToCell(ROW_COUNT - 1, 0);
  });

  document.getElementById('btn-scroll-middle')!.addEventListener('click', () => {
    grid.scrollToCell(Math.floor(ROW_COUNT / 2), 0);
  });

  // Auto-height demo button
  document.getElementById('btn-demo-autoheight')!.addEventListener('click', async () => {
    console.log('📏 Two Overflow Modes Demo: Auto-Height vs Fixed+Scroll...');

    const message = `
📏 TWO OVERFLOW MODES DEMO

Compare TWO ways to handle overflow content:

📦 MODE 1: Auto-Height (WRAP)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Column: "Tags (Auto-Height)"
• Row EXPANDS to fit all content
• Content wraps to multiple lines
• autoHeight: true
• overflowMode: 'wrap'
• Best for: Variable content that needs full visibility

📜 MODE 2: Fixed + Scroll
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Column: "Tags (Fixed + Scroll)"
• Row stays FIXED at 32px
• Scroll HORIZONTALLY within cell to see all
• autoHeight: false
• overflowMode: 'scroll'
• Best for: Consistent row heights, optional overflow

✨ What You'll See:
━━━━━━━━━━━━━━━━━━━━━
Row 0, 5, 10, 15, 20... have 5-6 tags:
• Left column: Row expands (tall)
• Right column: Row stays 32px (scroll to see)

🎯 Performance:
━━━━━━━━━━━━━━━━━━━━━
• 100K rows
• 60+ FPS scrolling
• Choose mode based on UX needs!

Using new scrollThroughCells() API...
    `.trim();

    alert(message);
    console.log(message);

    // Define the cells to scroll through (row, col)
    const demoRows = [0, 5, 10, 15, 20, 25, 30, 35, 40];
    const cells = demoRows.map(row => ({ row, col: 9 }));

    console.log('📏 Scrolling through demo rows using scrollThroughCells API...');
    console.log('   Compare the TWO Tags columns side-by-side!');

    const { promise } = grid.scrollThroughCells(cells, {
      delayMs: 1500,
      smooth: true,
      onCellReached: (cell, index) => {
        const row = cell.row;
        const tagCount = row % 5 === 0 ? '5-6 tags' : (row % 3 === 0 ? '3 tags' : '1-2 tags');
        console.log(`   → Row ${row}: ${tagCount}`);
        console.log(`      Left (Auto-Height): ${row % 5 === 0 ? 'TALL ROW (expanded)' : 'Normal height'}`);
        console.log(`      Right (Fixed+Scroll): ALWAYS 32px (scroll horizontally)`);
      }
    });

    await promise;

    console.log('✅ Two Overflow Modes Demo complete!');
    console.log('   📦 Left column: Rows expand to fit content');
    console.log('   📜 Right column: Rows stay fixed, scroll within cell');
    console.log('   🎯 FPS should stay above 60!');
  });

  // Column resize buttons
  document.getElementById('btn-auto-fit-all')!.addEventListener('click', () => {
    console.log('↔️ Auto-fitting all columns...');
    const start = performance.now();
    grid.autoFitAllColumns();
    const time = performance.now() - start;
    console.log(`✅ Auto-fit completed in ${time.toFixed(2)}ms`);
  });

  document.getElementById('btn-reset-widths')!.addEventListener('click', () => {
    console.log('⟲ Resetting column widths to defaults...');
    const defaultWidths = columns.map(col => col.width);
    defaultWidths.forEach((width, col) => {
      grid.resizeColumn(col, width);
    });
    localStorage.removeItem('zengrid-column-widths');
    console.log('✅ Column widths reset to defaults');
  });

  // Mode toggle button
  const modeBtnElement = document.getElementById('btn-toggle-sort-mode')!;
  modeBtnElement.textContent = `Modes: ${context.actualDataMode.charAt(0).toUpperCase() + context.actualDataMode.slice(1)}`;
  modeBtnElement.addEventListener('click', () => {
    const modes = `
📋 Current Operation Modes:
━━━━━━━━━━━━━━━━━━━━━━━
Data:   ${context.actualDataMode.toUpperCase()}
Sort:   ${context.actualSortMode.toUpperCase()}
Filter: ${context.filterMode.toUpperCase()}

ℹ️  To change modes:
1. Edit src/main.ts (lines 163-165)
2. Change variable values:
   - dataMode: 'frontend' | 'backend'
   - sortMode: 'frontend' | 'backend'
   - filterMode: 'frontend' | 'backend'
3. Refresh the page

📖 Mode Descriptions:

FRONTEND MODE:
• Data: All loaded in memory
• Sort: Fast in-memory using IndexMap
• Filter: In-memory filtering
• Best for: Datasets that fit in memory

BACKEND MODE:
• Data: Loaded on-demand
• Sort: Server-side sorting
• Filter: Server-side filtering
• Best for: Large datasets, pagination
    `.trim();

    console.log(modes);
    alert(modes);
  });

  // Loading template selector
  const loadingTemplateSelect = document.getElementById('loading-template-select') as HTMLSelectElement;
  loadingTemplateSelect.addEventListener('change', (e) => {
    const newTemplate = (e.target as HTMLSelectElement).value as any;
    context.setLoadingTemplate(newTemplate);
    console.log(`🎨 Loading template changed to: ${newTemplate}`);

    // Update the loading indicator template immediately
    if ((grid as any).loadingIndicator) {
      (grid as any).loadingIndicator.updateConfig({
        template: newTemplate,
      });
    }
  });

  // Simulate load button
  document.getElementById('btn-simulate-load')!.addEventListener('click', async () => {
    console.log('🔄 Simulating data load...');

    // Step 1: Clear the grid
    grid.setData([]);
    grid.refresh();
    console.log('📭 Grid cleared');

    // Step 2: Show loading indicator
    (grid as any).events.emit('loading:start', {
      timestamp: Date.now(),
      message: `Loading with ${context.loadingTemplate} template...`,
    });

    // Step 3: Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Reload the data
    console.log('📥 Reloading data...');
    grid.setData(context.data);
    grid.refresh();

    // Step 5: Complete the load
    (grid as any).events.emit('loading:end', {
      timestamp: Date.now(),
      duration: 2000,
    });

    // Update stats
    const renderTime = performance.now();
    updateStats(grid, renderTime);

    console.log('✅ Simulated load complete - data restored');
  });
}
