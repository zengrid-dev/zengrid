import { Grid } from '../../../packages/core/src/grid/index';
import '../../../packages/core/src/styles.css';
import '../../../packages/core/src/features/loading/loading.styles.css';
import '../../../packages/core/src/features/column-resize/column-resize.styles.css';
import '../../../packages/core/src/features/column-drag/column-drag.styles.css';
import 'vanilla-calendar-pro/styles/index.css';
import { PaginationDemo } from './pagination-demo';
import {
  CheckboxRenderer,
  ProgressBarRenderer,
  LinkRenderer,
  ButtonRenderer,
  DateRenderer,
  DateRangeRenderer,
  SelectRenderer,
  ChipRenderer,
  DropdownRenderer,
  VanillaDateEditor,
  DateRangeEditor,
} from '../../../packages/core/src/index';

/**
 * FPS Monitor - Track frames per second during scrolling
 */
class FPSMonitor {
  private frames = 0;
  private lastTime = performance.now();
  private fps = 60;
  private element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
    this.start();
  }

  private start(): void {
    const tick = () => {
      this.frames++;
      const currentTime = performance.now();
      const delta = currentTime - this.lastTime;

      if (delta >= 1000) {
        this.fps = Math.round((this.frames * 1000) / delta);
        this.frames = 0;
        this.lastTime = currentTime;
        this.updateDisplay();
      }

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private updateDisplay(): void {
    this.element.textContent = `FPS: ${this.fps}`;

    // Color code based on performance
    this.element.classList.remove('low-fps', 'medium-fps');
    if (this.fps < 30) {
      this.element.classList.add('low-fps');
    } else if (this.fps < 50) {
      this.element.classList.add('medium-fps');
    }
  }

  getCurrentFPS(): number {
    return this.fps;
  }
}

/**
 * Generate test data - 100K rows x 18 columns (including new renderer showcase columns)
 */
const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'];
const priorities = ['Low', 'Medium', 'High', 'Critical'];
const categories = ['Category A', 'Category B', 'Category C', 'Category D'];
const tagOptions = ['Frontend', 'Backend', 'DevOps', 'Design', 'QA', 'Mobile'];

function generateData(rowCount: number, colCount: number): any[][] {
  console.time('Data Generation');

  const data: any[][] = [];

  for (let row = 0; row < rowCount; row++) {
    const rowData: any[] = [];
    for (let col = 0; col < colCount; col++) {
      switch (col) {
        case 0: // ID
          rowData.push(row + 1);
          break;
        case 1: // Name
          rowData.push(`${names[row % names.length]} #${row}`);
          break;
        case 2: // Department
          rowData.push(departments[row % departments.length]);
          break;

        // NEW RENDERER COLUMNS START HERE
        case 3: // Active (CheckboxRenderer)
          rowData.push(row % 2 === 0);
          break;
        case 4: // Progress (ProgressBarRenderer)
          rowData.push((row % 100) + 1);
          break;
        case 5: // Website (LinkRenderer)
          rowData.push(`https://example.com/user/${row}`);
          break;
        case 6: // Actions (ButtonRenderer) - value doesn't matter, button shows label
          rowData.push('Actions');
          break;
        case 7: // Created Date (DateRenderer)
          const baseDate = new Date('2020-01-01');
          const daysOffset = row % 1000;
          rowData.push(new Date(baseDate.getTime() + daysOffset * 24 * 60 * 60 * 1000));
          break;
        case 8: // Date Range (DateRangeRenderer)
          const startDate = new Date('2024-01-01');
          const startOffset = row % 365;
          const rangeStart = new Date(startDate.getTime() + startOffset * 24 * 60 * 60 * 1000);
          const duration = 7 + (row % 30); // 7 to 37 days duration
          const rangeEnd = new Date(rangeStart.getTime() + duration * 24 * 60 * 60 * 1000);
          rowData.push({ start: rangeStart, end: rangeEnd });
          break;
        case 9: // Priority (SelectRenderer)
          rowData.push(priorities[row % priorities.length]);
          break;
        case 10: // Tags (ChipRenderer) - array of chip objects with varied counts to test auto-height
          // Create variety: some rows with many tags (will wrap), some with few
          // Every 5th row gets 5-6 tags to demonstrate wrapping
          let tagCount;
          if (row % 5 === 0) {
            tagCount = 5 + (row % 2); // 5 or 6 tags
          } else if (row % 3 === 0) {
            tagCount = 3; // 3 tags
          } else {
            tagCount = 1 + (row % 2); // 1 or 2 tags
          }

          const chips = [];
          for (let i = 0; i < tagCount; i++) {
            const tagIdx = (row + i) % tagOptions.length;
            chips.push({
              label: tagOptions[tagIdx],
              value: tagOptions[tagIdx].toLowerCase(),
              color: ['#e3f2fd', '#f3e5f5', '#e8f5e9', '#fff3e0', '#fce4ec', '#e0f2f1'][tagIdx],
              textColor: '#000'
            });
          }
          rowData.push(chips);
          break;
        case 11: // Tags (duplicate for Fixed + Scroll column) - same as case 10
          // Reuse the same chip data to demonstrate different overflow modes
          const tagCount2 = row % 5 === 0 ? 5 + (row % 2) : (row % 3 === 0 ? 3 : 1 + (row % 2));
          const chips2 = [];
          for (let i = 0; i < tagCount2; i++) {
            const tagIdx = (row + i) % tagOptions.length;
            chips2.push({
              label: tagOptions[tagIdx],
              value: tagOptions[tagIdx].toLowerCase(),
              color: ['#e3f2fd', '#f3e5f5', '#e8f5e9', '#fff3e0', '#fce4ec', '#e0f2f1'][tagIdx],
              textColor: '#000'
            });
          }
          rowData.push(chips2);
          break;
        case 12: // Category (DropdownRenderer)
          rowData.push(categories[row % categories.length]);
          break;
        // NEW RENDERER COLUMNS END HERE

        case 13: // Salary
          rowData.push(50000 + (row % 100000));
          break;
        case 14: // Years
          rowData.push(1 + (row % 30));
          break;
        case 15: // Status
          rowData.push(row % 3 === 0 ? 'Active' : row % 3 === 1 ? 'On Leave' : 'Remote');
          break;
        case 16: // Email
          rowData.push(`user${row}@company.com`);
          break;
        case 17: // Phone
          rowData.push(`+1-555-${String(row).padStart(4, '0')}`);
          break;
        case 18: // Score
          rowData.push((row % 100) + 1);
          break;
        case 19: // Notes
          rowData.push(`Employee record for ID ${row + 1}`);
          break;
        default:
          rowData.push(`Cell ${row},${col}`);
      }
    }
    data.push(rowData);
  }

  console.timeEnd('Data Generation');
  return data;
}

/**
 * Generate random data
 */
function generateRandomData(rowCount: number, colCount: number): any[][] {
  const data: any[][] = [];
  for (let row = 0; row < rowCount; row++) {
    const rowData: any[] = [];
    for (let col = 0; col < colCount; col++) {
      rowData.push(Math.random() > 0.5 ? Math.floor(Math.random() * 10000) : `Rand ${Math.random().toFixed(4)}`);
    }
    data.push(rowData);
  }
  return data;
}

/**
 * Update statistics display
 */
function updateStats(grid: Grid, renderTime: number) {
  const stats = grid.getStats();

  document.getElementById('stat-rows')!.textContent = stats.rowCount.toLocaleString();
  document.getElementById('stat-visible')!.textContent = stats.visibleCells.toLocaleString();
  document.getElementById('stat-pooled')!.textContent = `${stats.poolStats.active}/${stats.poolStats.total}`;
  document.getElementById('stat-render')!.textContent = `${renderTime.toFixed(2)}ms`;

  // Update cache stats if available
  if (stats.cacheStats) {
    const cacheHitRate = (stats.cacheStats.hitRate * 100).toFixed(1);
    const cacheSize = `${stats.cacheStats.size}/${stats.cacheStats.capacity}`;
    document.getElementById('stat-cache')!.textContent = `${cacheHitRate}% (${cacheSize})`;
  }
}

/**
 * Main application
 */
function main() {
  const container = document.getElementById('grid-container');
  if (!container) {
    console.error('Grid container not found');
    return;
  }

  // Configuration
  const ROW_COUNT = 100_000;
  const COL_COUNT = 20; // Increased to 20: added Date Range column
  const ROW_HEIGHT = 32;

  console.log(`🚀 Initializing ZenGrid with ${ROW_COUNT.toLocaleString()} rows...`);

  // Generate initial data
  let data = generateData(ROW_COUNT, COL_COUNT);
  console.log(`✅ Generated ${(data.length * data[0].length).toLocaleString()} cells`);

  // Operation mode state - configure frontend/backend for each operation
  let dataMode: 'frontend' | 'backend' = 'frontend';  // Data loading mode
  let sortMode: 'frontend' | 'backend' = 'frontend';  // Sort mode
  let filterMode: 'frontend' | 'backend' = 'frontend'; // Filter mode

  // Loading template state
  let loadingTemplate: 'simple' | 'animated' | 'modern' | 'skeleton' | 'overlay' = 'modern';

  // Define columns with NEW rich HeaderConfig - showcasing all header features!
  const columns = [
    {
      field: 'id',
      header: {
        text: 'ID',
        type: 'sortable',
        leadingIcon: { content: '#️⃣', position: 'leading' },
        tooltip: { content: 'Employee ID - Click to sort' },
        className: 'header-id',
        sortIndicator: { show: true, ascIcon: '↑', descIcon: '↓', position: 'trailing' },
        interactive: true,
      },
      width: 80,
      renderer: 'number',
      sortable: true,
      minWidth: 50,
      maxWidth: 150,
    },
    {
      field: 'name',
      header: {
        text: 'Name',
        type: 'sortable',
        leadingIcon: { content: '👤', position: 'leading' },
        tooltip: { content: 'Employee Name - Click to sort' },
        sortIndicator: { show: true, position: 'trailing' },
        interactive: true,
      },
      width: 200,
      renderer: 'text',
      sortable: true,
      minWidth: 100,
      maxWidth: 400,
    },
    {
      field: 'department',
      header: {
        text: 'Department',
        type: 'filterable',
        leadingIcon: { content: '🏢', position: 'leading' },
        tooltip: { content: 'Department - Click to sort, use filter button to filter' },
        sortIndicator: { show: true, position: 'trailing' },
        filterIndicator: { show: true, icon: '▼', dropdownType: 'list' },
        interactive: true,
      },
      width: 150,
      renderer: 'text',
      sortable: true,
      minWidth: 100,
    },

    // ==================== NEW RENDERER SHOWCASE COLUMNS ====================
    {
      field: 'active',
      header: {
        text: 'Active',
        type: 'sortable',
        leadingIcon: { content: '✓', position: 'leading' },
        tooltip: { content: 'Active Status - CheckboxRenderer' },
        sortIndicator: { show: true, position: 'trailing' },
        interactive: true,
      },
      width: 100,
      renderer: new CheckboxRenderer({
        onChange: (value, params) => {
          console.log(`Checkbox changed: Row ${params.cell.row}, New value: ${value}`);
        }
      }),
      sortable: true,
      minWidth: 80,
    },
    {
      field: 'progress',
      header: {
        text: 'Progress',
        type: 'sortable',
        leadingIcon: { content: '📊', position: 'leading' },
        tooltip: { content: 'Progress (%) - ProgressBarRenderer' },
        sortIndicator: { show: true, position: 'trailing' },
        interactive: true,
      },
      width: 140,
      renderer: new ProgressBarRenderer({
        min: 0,
        max: 100,
        showValue: true,
        colors: [
          { threshold: 30, color: '#f44336' },   // Red for low
          { threshold: 70, color: '#ff9800' },   // Orange for medium
          { threshold: 100, color: '#4caf50' }   // Green for high
        ]
      }),
      sortable: true,
      minWidth: 100,
    },
    {
      field: 'website',
      header: {
        text: 'Website',
        type: 'text',
        leadingIcon: { content: '🔗', position: 'leading' },
        tooltip: { content: 'Website Link - LinkRenderer' },
      },
      width: 200,
      renderer: new LinkRenderer({
        label: (params) => `Visit ${params.cell.row}`,
        target: '_blank'
      }),
      sortable: true,
      minWidth: 150,
    },
    {
      field: 'actions',
      header: {
        text: 'Actions',
        type: 'text',
        leadingIcon: { content: '⚡', position: 'leading' },
        tooltip: { content: 'Actions - ButtonRenderer' },
      },
      width: 120,
      renderer: new ButtonRenderer({
        label: 'Delete',
        variant: 'danger',
        size: 'small',
        onClick: (params) => {
          console.log(`Delete button clicked for row ${params.cell.row}`);
          alert(`Delete action for:\nID: ${data[params.cell.row][0]}\nName: ${data[params.cell.row][1]}`);
        }
      }),
      sortable: false,
      minWidth: 100,
    },
    {
      field: 'createdAt',
      header: {
        text: 'Created',
        type: 'sortable',
        leadingIcon: { content: '📅', position: 'leading' },
        tooltip: { content: 'Created Date - Click to edit with DateEditor' },
        sortIndicator: { show: true, position: 'trailing' },
        interactive: true,
      },
      width: 120,
      renderer: new DateRenderer({
        format: 'MM/DD/YYYY',
        locale: 'en-US',
        onClick: (date, params) => {
          console.log(`📅 Date clicked: ${date} at row ${params.cell.row}`);
        }
      }),
      sortable: true,
      minWidth: 100,
      editable: true,
      editor: new VanillaDateEditor({
        format: 'DD/MM/YYYY',
        minDate: new Date('2020-01-01'),
        maxDate: new Date('2030-12-31'),
        required: true,
        placeholder: 'Select a date...',
        autoFocus: true,
        theme: 'light',
      }),
    },
    {
      field: 'dateRange',
      header: {
        text: 'Project Duration',
        type: 'sortable',
        leadingIcon: { content: '📆', position: 'leading' },
        tooltip: { content: 'Project Duration - Double-click to edit date range' },
        sortIndicator: { show: true, position: 'trailing' },
        interactive: true,
      },
      width: 300,
      renderer: new DateRangeRenderer({
        format: 'DD/MM/YYYY',
        showDuration: true,
        showCalendar: false,
        separator: ' → ',
        chipStyle: false,
        startColor: '#1976d2',
        endColor: '#7b1fa2',
        onClick: (range, params) => {
          if (range && range.start && range.end) {
            console.log(`📆 Date range clicked at row ${params.cell.row}: ${range.start.toLocaleDateString()} - ${range.end.toLocaleDateString()}`);
          }
        }
      }),
      sortable: true,
      minWidth: 250,
      maxWidth: 500,
      editable: true,
      editor: new DateRangeEditor({
        format: 'DD/MM/YYYY',
        minDate: new Date('2024-01-01'),
        maxDate: new Date('2025-12-31'),
        required: true,
        placeholder: 'Select project duration...',
        autoFocus: true,
        theme: 'light',
        allowSameDate: true,
      }),
    },
    {
      field: 'priority',
      header: {
        text: 'Priority',
        type: 'filterable',
        leadingIcon: { content: '🎯', position: 'leading' },
        tooltip: { content: 'Priority Level - SelectRenderer' },
        sortIndicator: { show: true, position: 'trailing' },
        interactive: true,
      },
      width: 140,
      renderer: new SelectRenderer({
        options: [
          { label: 'Low', value: 'Low' },
          { label: 'Medium', value: 'Medium' },
          { label: 'High', value: 'High' },
          { label: 'Critical', value: 'Critical' }
        ],
        onChange: (value, params) => {
          console.log(`Priority changed: Row ${params.cell.row}, New value: ${value}`);
        }
      }),
      sortable: true,
      minWidth: 100,
    },
    {
      field: 'tags',
      header: {
        text: 'Tags (Fixed + Scroll)',
        type: 'text',
        leadingIcon: { content: '📜', position: 'leading' },
        tooltip: { content: 'Tags with SCROLL mode - Row stays 32px, scroll horizontally to see all' },
      },
      width: 250,
      renderer: new ChipRenderer({
        overflowMode: 'scroll', // Row stays fixed, scroll within cell
        removable: true,
        showOverflowTooltip: true,
        onRemove: (chip, params) => {
          console.log(`Tag removed: "${chip.label}" from row ${params.cell.row}`);
        },
        onClick: (chip, params) => {
          console.log(`Tag clicked: "${chip.label}" on row ${params.cell.row}`);
        }
      }),
      sortable: false,
      minWidth: 180,
      autoHeight: false, // Fixed height - cell scrolls internally!
      overflow: { mode: 'scroll' }, // Enable cell-level scrolling
    },
    {
      field: 'tags2', // Unique field name (maps to same data via getData)
      header: {
        text: 'Tags (Fixed + Scroll)',
        type: 'text',
        leadingIcon: { content: '📜', position: 'leading' },
        tooltip: { content: 'Tags with SCROLL mode - Row stays 32px, scroll horizontally to see all' },
      },
      width: 250,
      renderer: new ChipRenderer({
        overflowMode: 'scroll', // Row stays fixed, scroll within cell
        removable: true,
        showOverflowTooltip: true,
        onRemove: (chip, params) => {
          console.log(`Tag removed: "${chip.label}" from row ${params.cell.row}`);
        },
        onClick: (chip, params) => {
          console.log(`Tag clicked: "${chip.label}" on row ${params.cell.row}`);
        }
      }),
      sortable: false,
      minWidth: 180,
      autoHeight: false, // Fixed height - cell scrolls internally!
      overflow: { mode: 'scroll' }, // Enable cell-level scrolling
    },
    {
      field: 'category',
      header: {
        text: 'Category',
        type: 'filterable',
        leadingIcon: { content: '📂', position: 'leading' },
        tooltip: { content: 'Category - DropdownRenderer' },
        sortIndicator: { show: true, position: 'trailing' },
        interactive: true,
      },
      width: 160,
      renderer: new DropdownRenderer({
        options: [
          { label: 'Category A', value: 'Category A' },
          { label: 'Category B', value: 'Category B' },
          { label: 'Category C', value: 'Category C' },
          { label: 'Category D', value: 'Category D' }
        ],
        searchable: true,
        onChange: (value, params) => {
          console.log(`Category changed: Row ${params.cell.row}, New value: ${value}`);
        }
      }),
      sortable: true,
      minWidth: 120,
    },
    // ==================== END NEW RENDERER SHOWCASE COLUMNS ====================

    {
      field: 'salary',
      header: {
        text: 'Salary',
        type: 'sortable',
        leadingIcon: { content: '💰', position: 'leading' },
        tooltip: { content: 'Annual Salary - Click to sort' },
        sortIndicator: { show: true, position: 'trailing' },
        interactive: true,
      },
      width: 120,
      renderer: 'number',
      sortable: true,
      minWidth: 80,
      maxWidth: 200,
    },
    {
      field: 'years',
      header: {
        text: 'Years',
        type: 'sortable',
        leadingIcon: { content: '📅', position: 'leading' },
        tooltip: { content: 'Years of service - Click to sort' },
        sortIndicator: { show: true, position: 'trailing' },
        interactive: true,
      },
      width: 80,
      renderer: 'number',
      sortable: true,
      minWidth: 60,
    },
    {
      field: 'status',
      header: {
        text: 'Status',
        type: 'filterable',
        leadingIcon: { content: '●', position: 'leading' },
        tooltip: { content: 'Employment Status - Sortable and Filterable' },
        sortIndicator: { show: true, position: 'trailing' },
        filterIndicator: { show: true, icon: '▼', dropdownType: 'list' },
        interactive: true,
      },
      width: 100,
      renderer: 'text',
      sortable: true,
      minWidth: 80,
    },
    {
      field: 'email',
      header: {
        text: 'Email',
        type: 'sortable',
        leadingIcon: { content: '📧', position: 'leading' },
        tooltip: { content: 'Email Address - Click to sort' },
        sortIndicator: { show: true, position: 'trailing' },
        interactive: true,
      },
      width: 220,
      renderer: 'text',
      sortable: true,
      minWidth: 150,
      maxWidth: 350,
    },
    {
      field: 'phone',
      header: {
        text: 'Phone',
        type: 'text',
        leadingIcon: { content: '📱', position: 'leading' },
        tooltip: { content: 'Phone Number' },
      },
      width: 140,
      renderer: 'text',
      sortable: true,
      minWidth: 100,
    },
    {
      field: 'score',
      header: {
        text: 'Score',
        type: 'sortable',
        leadingIcon: { content: '⭐', position: 'leading' },
        tooltip: { content: 'Performance Score (1-100) - Click to sort' },
        sortIndicator: { show: true, position: 'trailing' },
        interactive: true,
      },
      width: 80,
      renderer: 'number',
      sortable: true,
      minWidth: 60,
    },
    {
      field: 'notes',
      header: {
        text: 'Notes',
        type: 'text',
        leadingIcon: { content: '📝', position: 'leading' },
        tooltip: { content: 'Additional Notes' },
      },
      width: 300,
      renderer: 'text',
      sortable: true,
      minWidth: 150,
      maxWidth: 500,
    },
  ];

  // Extract column widths for a variable width provider
  const columnWidths = columns.map(col => col.width);

  // Conditional sort handler - delegates based on the current sortMode
  async function handleSortRequest(sortState: any[]): Promise<void> {
    // In frontend mode, this handler won't be called (auto mode detects undefined handler)
    // In backend mode, perform server-side sorting
    if (sortMode !== 'backend') return;

    console.log('🔄 Backend sort requested:', sortState);

    if (sortState.length === 0) {
      // No sort - restore original order
      data = generateData(ROW_COUNT, COL_COUNT);
      grid.setData(data);
      grid.refresh();
      return;
    }

    const { column, direction } = sortState[0];

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Perform sorting on the data
    const sortedData = [...data].sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];

      if (aVal === bVal) return 0;

      let result = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        result = aVal - bVal;
      } else {
        result = String(aVal).localeCompare(String(bVal));
      }

      return direction === 'asc' ? result : -result;
    });

    // Update data and refresh grid
    data = sortedData;
    grid.setData(data);
    grid.refresh();

    console.log('✅ Backend sort completed');
  }

  // Create grid with variable column widths
  console.time('Grid Initialization');
  let gridRef: Grid | null = null; // Forward reference for scroll handler
  let grid = new Grid(container, {
    rowCount: ROW_COUNT,
    colCount: COL_COUNT,
    rowHeight: ROW_HEIGHT,
    colWidth: columnWidths, // Use array for variable widths
    columns,
    enableSelection: true,
    enableMultiSelection: true,
    enableKeyboardNavigation: true,
    overscanRows: 5,
    overscanCols: 2,
    // Enable content-aware row height mode - only columns marked with autoHeight will be measured
    rowHeightMode: 'content-aware',
    rowHeightConfig: {
      defaultHeight: ROW_HEIGHT,
      minHeight: 30,
      maxHeight: 150,
      debounceMs: 16,
    },
    // Enable renderer cache for performance
    rendererCache: {
      enabled: true,
      capacity: 1000,
      trackStats: true,
    },
    // Configurable sort icons (defaults: asc='▲', desc='▼')
    // Uncomment to customize:
    // sortIcons: {
    //   asc: '↑',
    //   desc: '↓',
    // },
    // Operation Modes - unified pattern for frontend/backend operations
    dataMode: dataMode,
    sortMode: sortMode,
    filterMode: filterMode,
    // Backend handlers (only used when respective mode is 'backend' or 'auto')
    onSortRequest: sortMode === 'backend' ? handleSortRequest : undefined,
    // Loading indicator configuration
    loading: {
      enabled: true,
      template: loadingTemplate,
      message: 'Loading data...',
      minDisplayTime: 500, // Show for at least 500 ms to prevent flashing
      position: 'center',
      showOverlay: true,
      overlayOpacity: 0.5,
    },
    // Column Resize Configuration
    enableColumnResize: true,
    columnResize: {
      resizeZoneWidth: 6,        // Detection zone width
      defaultMinWidth: 30,        // Global minimum
      defaultMaxWidth: 600,       // Global maximum
      autoFitSampleSize: 100,     // Sample 100 rows for auto-fit
      autoFitPadding: 16,         // Add 16 px padding to auto-fit
      showHandles: true,          // Show visual resize handles
      showPreview: true,          // Show preview line during drag
    },
    // Sync scroll - update resize handle positions
    onScroll: (scrollTop, scrollLeft) => {
      // Update resize handle positions on scroll
      if (gridRef) {
        gridRef.updateColumnResizeHandles();
      }
    },
    // Column width persistence
    onColumnWidthsChange: (widths) => {
      console.log('💾 Column widths changed:', widths);
      localStorage.setItem('zengrid-column-widths', JSON.stringify(widths));
      // Headers are auto-updated by HeaderManager via column:resize event
    },
  });
  gridRef = grid; // Set the reference for the scroll handler
  console.timeEnd('Grid Initialization');

  // Set data
  console.time('Set Data');
  grid.setData(data);
  console.timeEnd('Set Data');

  // Initial render (this initializes the resize manager)
  console.time('Initial Render');
  const renderStart = performance.now();
  grid.render();
  const renderTime = performance.now() - renderStart;
  console.timeEnd('Initial Render');

  // Column resize is now automatically attached to the HeaderManager's header container
  // No manual attachment needed - the Grid class handles this in render()
  console.log('✅ Column resize automatically integrated with new header system');

  console.log(`✅ Initial render took ${renderTime.toFixed(2)}ms`);

  // Update stats
  updateStats(grid, renderTime);

  // Update mode indicator
  const modeIndicator = document.getElementById('mode-indicator')!;
  const actualDataMode = grid.getDataMode();
  const actualSortMode = grid.getSortMode();
  modeIndicator.textContent = `Data: ${actualDataMode.toUpperCase()}, Sort: ${actualSortMode.toUpperCase()}, Filter: ${filterMode.toUpperCase()}`;
  console.log(`📋 Operation Modes - Data: ${actualDataMode}, Sort: ${actualSortMode}, Filter: ${filterMode}`);

  // Initialize FPS monitor
  const fpsElement = document.getElementById('fps-monitor')!;
  const fpsMonitor = new FPSMonitor(fpsElement);

  // Column resize event listeners
  grid.on('column:resize', (event) => {
    console.log(`📏 Column ${event.column} resized: ${event.oldWidth}px → ${event.newWidth}px`);
  });

  // Header event listeners - demonstrating new header system
  grid.on('header:click', (event) => {
    console.log(`🖱️ Header clicked: Column ${event.columnIndex} (${event.column.field})`);
  });

  grid.on('header:sort:click', (event) => {
    console.log(`🔄 Sort requested: Column ${event.columnIndex}, Direction: ${event.nextDirection}`);
    // The grid handles sort automatically, this is just for logging
  });

  grid.on('header:filter:click', (event) => {
    console.log(`🔍 Filter clicked: Column ${event.columnIndex}, Has active filter: ${event.hasActiveFilter}`);
    // TODO: Show filter dropdown UI here
    alert(`Filter UI for "${event.column.field}" column\n\nCurrent filter: ${event.hasActiveFilter ? 'Active' : 'None'}\n\nImplement filter dropdown UI here!`);
  });

  grid.on('header:hover', (event) => {
    if (event.isHovering) {
      console.log(`🔹 Hovering over column ${event.columnIndex} (${event.column.field})`);
    }
  });

  // Initialize Pagination Demo
  const paginationDemo = new PaginationDemo(grid);

  // Pagination toggle button
  document.getElementById('btn-toggle-pagination')!.addEventListener('click', async () => {
    if (paginationDemo.isEnabled()) {
      paginationDemo.disable();
      // Reload local data
      data = generateData(ROW_COUNT, COL_COUNT);
      grid.setData(data);
      grid.refresh();
      alert('Pagination Mode: OFF\n\nSwitched back to local 100K rows in memory.');
    } else {
      await paginationDemo.enable();
      alert('Pagination Mode: ON\n\nNow loading data from mock server (http://localhost:3003)\n\nMake sure the server is running:\npnpm server\n\nTotal records: 10,000');
    }
  });

  // Button handlers
  document.getElementById('btn-refresh')!.addEventListener('click', () => {
    console.log('🔄 Refreshing grid...');
    const start = performance.now();
    grid.refresh();
    const time = performance.now() - start;
    console.log(`✅ Refresh took ${time.toFixed(2)}ms`);
    updateStats(grid, time);
  });

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

  document.getElementById('btn-scroll-top')!.addEventListener('click', () => {
    grid.scrollToCell(0, 0);
  });

  document.getElementById('btn-scroll-bottom')!.addEventListener('click', () => {
    grid.scrollToCell(ROW_COUNT - 1, 0);
  });

  document.getElementById('btn-scroll-middle')!.addEventListener('click', () => {
    grid.scrollToCell(Math.floor(ROW_COUNT / 2), 0);
  });

  // Auto-height demo button - demonstrates TWO overflow modes side-by-side
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
    // Column 9 = "Tags (Auto-Height)" - will expand
    // Column 10 = "Tags (Fixed + Scroll)" - stays 32px
    const demoRows = [0, 5, 10, 15, 20, 25, 30, 35, 40];
    const cells = demoRows.map(row => ({ row, col: 9 })); // Focus on Auto-Height column

    console.log('📏 Scrolling through demo rows using scrollThroughCells API...');
    console.log('   Compare the TWO Tags columns side-by-side!');

    // Use the new scrollThroughCells API with smooth animation
    const { promise } = grid.scrollThroughCells(cells, {
      delayMs: 1500,       // 1.5 seconds between each cell for comparison
      smooth: true,        // Use smooth scrolling
      onCellReached: (cell, index) => {
        const row = cell.row;
        const tagCount = row % 5 === 0 ? '5-6 tags' : (row % 3 === 0 ? '3 tags' : '1-2 tags');
        console.log(`   → Row ${row}: ${tagCount}`);
        console.log(`      Left (Auto-Height): ${row % 5 === 0 ? 'TALL ROW (expanded)' : 'Normal height'}`);
        console.log(`      Right (Fixed+Scroll): ALWAYS 32px (scroll horizontally)`);
      }
    });

    // Wait for the scroll sequence to complete
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

  // Mode toggle button - shows current modes and explains how to change
  const modeBtnElement = document.getElementById('btn-toggle-sort-mode')!;
  modeBtnElement.textContent = `Modes: ${actualDataMode.charAt(0).toUpperCase() + actualDataMode.slice(1)}`;
  modeBtnElement.addEventListener('click', () => {
    const modes = `
📋 Current Operation Modes:
━━━━━━━━━━━━━━━━━━━━━━━
Data:   ${actualDataMode.toUpperCase()}
Sort:   ${actualSortMode.toUpperCase()}
Filter: ${filterMode.toUpperCase()}

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
    loadingTemplate = (e.target as HTMLSelectElement).value as any;
    console.log(`🎨 Loading template changed to: ${loadingTemplate}`);

    // Update the loading indicator template immediately
    if ((grid as any).loadingIndicator) {
      (grid as any).loadingIndicator.updateConfig({
        template: loadingTemplate,
      });
    }
  });

  // Simulate load button - demonstrates loading indicator
  document.getElementById('btn-simulate-load')!.addEventListener('click', async () => {
    console.log('🔄 Simulating data load...');

    // Step 1: Clear the grid
    grid.setData([]);
    grid.refresh();
    console.log('📭 Grid cleared');

    // Step 2: Show loading indicator
    (grid as any).events.emit('loading:start', {
      timestamp: Date.now(),
      message: `Loading with ${loadingTemplate} template...`,
    });

    // Step 3: Simulate async operation (e.g., API call)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Reload the data
    console.log('📥 Reloading data...');
    grid.setData(data);
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

  // Infinite Scrolling Demo State
  let infiniteScrollEnabled = false;
  let slidingWindowEnabled = false;
  let totalRowsLoaded = 0;

  // Infinite Scrolling Demo Button
  document.getElementById('btn-toggle-infinite-scroll')!.addEventListener('click', async () => {
    if (infiniteScrollEnabled) {
      // Disable infinite scrolling - reload with full dataset
      console.log('🔄 Disabling infinite scrolling...');
      infiniteScrollEnabled = false;
      data = generateData(ROW_COUNT, COL_COUNT);

      // Destroy and recreate grid
      grid.destroy();

      // Clear the container and recreate the grid
      container.innerHTML = '';

      grid = new Grid(container, {
        rowCount: ROW_COUNT,
        colCount: COL_COUNT,
        rowHeight: ROW_HEIGHT,
        colWidth: columnWidths,
        columns,
        enableSelection: true,
        enableMultiSelection: true,
        enableKeyboardNavigation: true,
        overscanRows: 5,
        overscanCols: 2,
        rendererCache: {
          enabled: true,
          capacity: 1000,
          trackStats: true,
        },
        dataMode: dataMode,
        sortMode: sortMode,
        filterMode: filterMode,
        onSortRequest: sortMode === 'backend' ? handleSortRequest : undefined,
        loading: {
          enabled: true,
          template: loadingTemplate,
          message: 'Loading data...',
          minDisplayTime: 500,
          position: 'center',
          showOverlay: true,
          overlayOpacity: 0.5,
        },
        enableColumnResize: true,
        columnResize: {
          resizeZoneWidth: 6,
          defaultMinWidth: 30,
          defaultMaxWidth: 600,
          autoFitSampleSize: 100,
          autoFitPadding: 16,
          showHandles: true,
          showPreview: true,
        },
        onScroll: (scrollTop, scrollLeft) => {
          if (grid) {
            grid.updateColumnResizeHandles();
          }
        },
        onColumnWidthsChange: (widths) => {
          console.log('💾 Column widths changed:', widths);
          localStorage.setItem('zengrid-column-widths', JSON.stringify(widths));
        },
      });

      grid.setData(data);
      grid.render();

      totalRowsLoaded = ROW_COUNT;

      alert('Infinite Scrolling: OFF\n\nSwitched back to standard mode with 100K rows.');
      console.log(`✅ Infinite scrolling disabled. Total rows: ${totalRowsLoaded}`);
    } else {
      // Enable infinite scrolling - start with smaller dataset
      console.log('🔄 Enabling infinite scrolling...');
      infiniteScrollEnabled = true;

      const INITIAL_ROWS = 100;

      // Fetch initial data from server
      try {
        console.log('📥 Fetching initial data from server...');
        const response = await fetch(
          `http://localhost:3003/api/employees?page=1&pageSize=${INITIAL_ROWS}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Convert server data to grid format
        data = result.data.map((emp: any) => [
          emp.id,
          emp.name,
          emp.department,
          emp.salary,
          emp.years,
          emp.status,
          emp.email,
          emp.phone,
          emp.score,
          emp.notes,
        ]);

        totalRowsLoaded = data.length;

        console.log(`✅ Fetched ${data.length} initial rows from server`);
        console.log(`   Total available: ${result.pagination.totalRecords.toLocaleString()}`);
      } catch (error) {
        console.error('❌ Failed to fetch initial data from server:', error);
        console.error('   Falling back to local data generation');
        alert('Failed to fetch data from server.\n\nMake sure the server is running:\nnpm run server\n\nFalling back to local data generation...');

        // Fallback to local data
        data = generateData(INITIAL_ROWS, COL_COUNT);
        totalRowsLoaded = INITIAL_ROWS;
      }

      // Destroy and recreate grid with infinite scrolling
      grid.destroy();

      // Clear the container
      container.innerHTML = '';

      grid = new Grid(container, {
        rowCount: INITIAL_ROWS,
        colCount: COL_COUNT,
        rowHeight: ROW_HEIGHT,
        colWidth: columnWidths,
        columns,
        enableSelection: true,
        enableMultiSelection: true,
        enableKeyboardNavigation: true,
        overscanRows: 5,
        overscanCols: 2,
        rendererCache: {
          enabled: true,
          capacity: 1000,
          trackStats: true,
        },
        dataMode: dataMode,
        sortMode: sortMode,
        filterMode: filterMode,
        onSortRequest: sortMode === 'backend' ? handleSortRequest : undefined,
        loading: {
          enabled: true,
          template: loadingTemplate,
          message: 'Loading data...',
          minDisplayTime: 500,
          position: 'center',
          showOverlay: true,
          overlayOpacity: 0.5,
        },
        enableColumnResize: true,
        columnResize: {
          resizeZoneWidth: 6,
          defaultMinWidth: 30,
          defaultMaxWidth: 600,
          autoFitSampleSize: 100,
          autoFitPadding: 16,
          showHandles: true,
          showPreview: true,
        },
        onScroll: (scrollTop, scrollLeft) => {
          if (grid) {
            grid.updateColumnResizeHandles();
          }
        },
        onColumnWidthsChange: (widths) => {
          console.log('💾 Column widths changed:', widths);
          localStorage.setItem('zengrid-column-widths', JSON.stringify(widths));
        },
        // Infinite scrolling configuration
        infiniteScrolling: {
          enabled: true,
          threshold: 20,
          initialRowCount: INITIAL_ROWS,

          // Sliding Window (Memory Management)
          enableSlidingWindow: slidingWindowEnabled,
          windowSize: 500,      // Keep max 500 rows in memory
          pruneThreshold: 600,  // Start pruning at 600 rows
          onDataPruned: (prunedRowCount, virtualOffset) => {
            console.log(`🗑️  Pruned ${prunedRowCount} old rows`);
            console.log(`   Virtual offset now: ${virtualOffset}`);
            console.log(`   Memory saved: ~${(prunedRowCount * 0.01).toFixed(2)} MB`);

            // Update stats display
            const stats = grid.getSlidingWindowStats?.();
            if (stats) {
              console.log(`📊 Sliding Window Stats:`);
              console.log(`   Rows in memory: ${stats.rowsInMemory}`);
              console.log(`   Total loaded: ${stats.totalRowsLoaded}`);
              console.log(`   Pruned: ${stats.prunedRows}`);
            }
          },
        },
        // Data loading callback - Fetch from server
        onLoadMoreRows: async (currentRowCount) => {
          console.log(`📥 Loading more rows from server... (current: ${currentRowCount})`);

          try {
            const BATCH_SIZE = 100;
            const page = Math.floor(currentRowCount / BATCH_SIZE) + 1;

            // Fetch from server
            const response = await fetch(
              `http://localhost:3003/api/employees?page=${page}&pageSize=${BATCH_SIZE}`
            );

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            console.log(`✅ Server returned ${result.data.length} rows`);
            console.log(`   Page: ${result.pagination.page}/${result.pagination.totalPages}`);
            console.log(`   Has more: ${result.pagination.hasNextPage}`);

            // Check if we've reached the end
            if (!result.pagination.hasNextPage || result.data.length === 0) {
              console.log('✅ Reached end of data from server');
              totalRowsLoaded += result.data.length;

              // Convert server data to grid format (array of arrays)
              const newRows = result.data.map((emp: any) => [
                emp.id,
                emp.name,
                emp.department,
                emp.salary,
                emp.years,
                emp.status,
                emp.email,
                emp.phone,
                emp.score,
                emp.notes,
              ]);

              return newRows;
            }

            totalRowsLoaded += result.data.length;

            // Convert server data to grid format (array of arrays)
            const newRows = result.data.map((emp: any) => [
              emp.id,
              emp.name,
              emp.department,
              emp.salary,
              emp.years,
              emp.status,
              emp.email,
              emp.phone,
              emp.score,
              emp.notes,
            ]);

            console.log(`✅ Loaded ${newRows.length} more rows (total: ${totalRowsLoaded})`);
            return newRows;
          } catch (error) {
            console.error('❌ Failed to load data from server:', error);
            console.error('   Make sure the server is running: npm run server');
            alert('Failed to load data from server.\n\nMake sure the server is running:\nnpm run server\n\nOr use the local data mode instead.');
            return []; // Stop loading on error
          }
        },
      });

      grid.setData(data);
      grid.render();

      alert('Infinite Scrolling: ON\n\n✅ Fetching data from server (http://localhost:3003)\n\nStarting with 100 rows.\nScroll to bottom to load more data (100 rows at a time).\n\nTotal available: 10,000 rows from server.\n\n💡 Make sure server is running: npm run server');
      console.log(`✅ Infinite scrolling enabled. Initial rows: ${totalRowsLoaded}`);
    }
  });

  // Sliding Window Toggle Button
  document.getElementById('btn-toggle-sliding-window')!.addEventListener('click', () => {
    slidingWindowEnabled = !slidingWindowEnabled;
    const btn = document.getElementById('btn-toggle-sliding-window')!;
    btn.textContent = slidingWindowEnabled ? '🪟 Sliding Window: ON' : '🪟 Sliding Window: OFF';
    btn.style.background = slidingWindowEnabled ? '#27ae60' : '#16a085';

    if (slidingWindowEnabled) {
      alert(
        '🪟 Sliding Window: ON\n\n' +
        '✅ Memory-efficient mode enabled!\n\n' +
        'Configuration:\n' +
        '• Max rows in memory: 500\n' +
        '• Prune threshold: 600 rows\n' +
        '• Old rows are automatically removed\n\n' +
        '💡 Enable infinite scrolling and watch the console to see pruning in action!'
      );
    } else {
      alert(
        '🪟 Sliding Window: OFF\n\n' +
        '⚠️ Memory will grow indefinitely\n\n' +
        'All loaded rows stay in memory.\n' +
        'Good for: Small datasets or when you need to scroll back to the beginning.'
      );
    }

    console.log(`🪟 Sliding window ${slidingWindowEnabled ? 'ENABLED' : 'DISABLED'}`);
    if (slidingWindowEnabled) {
      console.log('   When infinite scrolling loads > 600 rows:');
      console.log('   • Old rows will be pruned');
      console.log('   • Memory stays at ~500 rows');
      console.log('   • Performance remains stable');
    }
  });

  // Periodic stats update
  setInterval(() => {
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

  // Log performance metrics
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

  // ==================== SIDEBAR MENU ====================
  setupSidebarMenu();

  // ==================== FILTER UI ====================
  setupFilterUI(grid, columns);
}

/**
 * Setup Sidebar Menu - Collapsible categories and sidebar toggle
 */
function setupSidebarMenu() {
  // Category collapse/expand
  const categoryHeaders = document.querySelectorAll('.category-header');

  categoryHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const category = header.getAttribute('data-category');
      const content = document.querySelector(`[data-content="${category}"]`);

      if (content && header) {
        // Toggle collapsed state
        header.classList.toggle('collapsed');
        content.classList.toggle('collapsed');
      }
    });
  });

  // Sidebar toggle
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');

      // Update button title (icon stays the same)
      if (sidebar.classList.contains('collapsed')) {
        sidebarToggle.title = 'Show Sidebar';
      } else {
        sidebarToggle.title = 'Hide Sidebar';
      }
    });
  }

  console.log('✅ Sidebar menu initialized with collapsible categories and sidebar toggle');
}

/**
 * Setup Filter UI
 */
function setupFilterUI(grid: Grid, columns: any[]) {
  const filterPanel = document.getElementById('filter-panel')!;
  const filterRowsContainer = document.getElementById('filter-rows')!;
  const btnToggleFilter = document.getElementById('btn-toggle-filter')!;
  const btnAddFilter = document.getElementById('btn-add-filter')!;
  const btnApplyFilters = document.getElementById('btn-apply-filters')!;
  const btnClearFilters = document.getElementById('btn-clear-filters')!;
  const filterPreview = document.getElementById('filter-preview')!;
  const filterPreviewContent = document.getElementById('filter-preview-content')!;
  const filterWarning = document.getElementById('filter-warning')!;
  const filterWarningContent = document.getElementById('filter-warning-content')!;

  // Operator definitions
  const operators = [
    { value: 'equals', label: 'Equals (=)', requiresValue: true },
    { value: 'notEquals', label: 'Not Equals (≠)', requiresValue: true },
    { value: 'greaterThan', label: 'Greater Than (>)', requiresValue: true },
    { value: 'greaterThanOrEqual', label: 'Greater Than Or Equal (≥)', requiresValue: true },
    { value: 'lessThan', label: 'Less Than (<)', requiresValue: true },
    { value: 'lessThanOrEqual', label: 'Less Than Or Equal (≤)', requiresValue: true },
    { value: 'contains', label: 'Contains', requiresValue: true },
    { value: 'notContains', label: 'Does Not Contain', requiresValue: true },
    { value: 'startsWith', label: 'Starts With', requiresValue: true },
    { value: 'endsWith', label: 'Ends With', requiresValue: true },
    { value: 'blank', label: 'Is Empty', requiresValue: false },
    { value: 'notBlank', label: 'Is Not Empty', requiresValue: false },
  ];

  let filterCounter = 0;
  const activeFilters: Map<number, { column: number; operator: string; value: any; logicToNext?: 'AND' | 'OR' }> = new Map();

  // Toggle filter panel
  btnToggleFilter.addEventListener('click', () => {
    filterPanel.classList.toggle('expanded');
    const isExpanded = filterPanel.classList.contains('expanded');
    btnToggleFilter.textContent = isExpanded ? '🔽 Hide Filters' : '🔍 Filters';

    // No need to call updateViewport() - autoResize handles it automatically!
  });

  // Add logic connector between filters
  function addLogicConnector(filterId: number) {
    const connector = document.createElement('div');
    connector.className = 'logic-connector';
    connector.dataset.connectorId = String(filterId);

    const line1 = document.createElement('div');
    line1.className = 'logic-line';

    const toggle = document.createElement('div');
    toggle.className = 'logic-toggle';
    toggle.innerHTML = `
      <input type="radio" id="logic-and-${filterId}" name="logic-${filterId}" value="AND" checked>
      <label for="logic-and-${filterId}">AND</label>
      <input type="radio" id="logic-or-${filterId}" name="logic-${filterId}" value="OR">
      <label for="logic-or-${filterId}">OR</label>
    `;

    const line2 = document.createElement('div');
    line2.className = 'logic-line';

    connector.appendChild(line1);
    connector.appendChild(toggle);
    connector.appendChild(line2);

    // Add event listener to update filter logic
    toggle.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const logic = (radio as HTMLInputElement).value as 'AND' | 'OR';
        const filter = activeFilters.get(filterId);
        if (filter) {
          filter.logicToNext = logic;
        }
      });
    });

    return connector;
  }

  // Add filter row
  function addFilterRow() {
    const filterId = filterCounter++;

    // Add logic connector before this row (except for first row)
    if (filterId > 0) {
      const prevFilterId = filterId - 1;
      const connector = addLogicConnector(prevFilterId);
      filterRowsContainer.appendChild(connector);
    }

    const filterRow = document.createElement('div');
    filterRow.className = 'filter-row';
    filterRow.dataset.filterId = String(filterId);

    // Add filter row index badge
    const indexBadge = document.createElement('div');
    indexBadge.className = 'filter-row-index';
    indexBadge.textContent = String(filterId + 1);
    filterRow.appendChild(indexBadge);

    // Column select
    const columnSelect = document.createElement('select');
    columnSelect.innerHTML = columns.map((col, idx) =>
      `<option value="${idx}">${col.header}</option>`
    ).join('');

    // Operator select
    const operatorSelect = document.createElement('select');
    operatorSelect.innerHTML = operators.map(op =>
      `<option value="${op.value}">${op.label}</option>`
    ).join('');

    // Value input
    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.placeholder = 'Enter value...';

    // Update value input visibility based on the operator
    const updateValueInput = () => {
      const selectedOp = operators.find(op => op.value === operatorSelect.value);
      if (selectedOp && !selectedOp.requiresValue) {
        valueInput.disabled = true;
        valueInput.placeholder = 'No value needed';
        valueInput.value = '';
      } else {
        valueInput.disabled = false;
        valueInput.placeholder = 'Enter value...';
      }
    };

    operatorSelect.addEventListener('change', updateValueInput);
    updateValueInput();

    // Remove button
    const removeButton = document.createElement('button');
    removeButton.textContent = '✕';
    removeButton.addEventListener('click', () => {
      // Remove the logic connector before this row if it exists
      const connector = filterRowsContainer.querySelector(`[data-connector-id="${filterId - 1}"]`);
      if (connector) {
        connector.remove();
      }
      // Remove the logic connector after this row if it exists
      const nextConnector = filterRowsContainer.querySelector(`[data-connector-id="${filterId}"]`);
      if (nextConnector) {
        nextConnector.remove();
      }
      filterRow.remove();
      activeFilters.delete(filterId);
    });

    // Store filter data
    const storeFilter = () => {
      const selectedOp = operators.find(op => op.value === operatorSelect.value);
      let value = valueInput.value;

      // Type conversion based on column
      const colIndex = parseInt(columnSelect.value);
      const column = columns[colIndex];

      // Auto-convert numbers for number columns
      if (column.renderer === 'number' && value && !isNaN(Number(value))) {
        value = Number(value);
      }

      activeFilters.set(filterId, {
        column: colIndex,
        operator: operatorSelect.value,
        value: selectedOp && selectedOp.requiresValue ? value : undefined,
        logicToNext: 'AND', // Default to AND
      });
    };

    columnSelect.addEventListener('change', storeFilter);
    operatorSelect.addEventListener('change', storeFilter);
    valueInput.addEventListener('input', storeFilter);

    // Initial store
    storeFilter();

    filterRow.appendChild(columnSelect);
    filterRow.appendChild(operatorSelect);
    filterRow.appendChild(valueInput);
    filterRow.appendChild(removeButton);

    filterRowsContainer.appendChild(filterRow);
  }

  // Add an initial filter row
  addFilterRow();

  btnAddFilter.addEventListener('click', () => {
    addFilterRow();
  });

  // Apply filters with advanced per-condition logic
  btnApplyFilters.addEventListener('click', () => {
    console.log('🔍 Applying filters with advanced logic...');

    // Clear existing filters
    grid.clearFilters();

    // Convert activeFilters to array and sort by ID to maintain order
    const filterArray = Array.from(activeFilters.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([id, filter]) => ({ id, ...filter }));

    if (filterArray.length === 0) {
      console.log('   No filters to apply');
      filterPreview.style.display = 'none';
      return;
    }

    // Group consecutive conditions by column with their logic
    const columnGroups = new Map<number, Array<{ operator: string; value: any; logic?: 'AND' | 'OR' }>>();

    for (let i = 0; i < filterArray.length; i++) {
      const filter = filterArray[i];
      const column = filter.column;

      if (!columnGroups.has(column)) {
        columnGroups.set(column, []);
      }

      columnGroups.get(column)!.push({
        operator: filter.operator,
        value: filter.value,
        logic: filter.logicToNext,
      });
    }

    // Detect impossible filter combinations
    const warnings: string[] = [];

    for (let i = 0; i < filterArray.length - 1; i++) {
      const current = filterArray[i];
      const next = filterArray[i + 1];
      const logic = current.logicToNext || 'AND';

      // Check for same column
      if (current.column === next.column) {
        const columnName = columns[current.column]?.header || `Column ${current.column}`;

        // Case 1: Same column, equals operator, different values, AND logic
        if (
          current.operator === 'equals' &&
          next.operator === 'equals' &&
          current.value !== next.value &&
          logic === 'AND'
        ) {
          warnings.push(
            `<strong>${columnName}</strong> cannot equal both <strong>${current.value}</strong> AND <strong>${next.value}</strong>. ` +
            `<br/>💡 <strong>Suggestion:</strong> Change the logic between these conditions to <strong>OR</strong> to show rows where ${columnName} is either value.`
          );
        }

        // Case 2: Contradictory range (e.g., > 100 AND < 50)
        if (
          (current.operator === 'greaterThan' || current.operator === 'greaterThanOrEqual') &&
          (next.operator === 'lessThan' || next.operator === 'lessThanOrEqual') &&
          logic === 'AND' &&
          Number(current.value) > Number(next.value)
        ) {
          warnings.push(
            `<strong>${columnName}</strong> cannot be greater than <strong>${current.value}</strong> AND less than <strong>${next.value}</strong>. ` +
            `<br/>💡 <strong>Suggestion:</strong> Check your values—the range is inverted.`
          );
        }

        // Case 3: Same condition repeated with AND (redundant)
        if (
          current.operator === next.operator &&
          current.value === next.value &&
          logic === 'AND'
        ) {
          warnings.push(
            `<strong>${columnName}</strong> has a duplicate condition: <strong>${current.operator} ${current.value}</strong>. ` +
            `<br/>💡 <strong>Suggestion:</strong> Remove one of the duplicate filters.`
          );
        }
      }
    }

    // Show warnings if any
    if (warnings.length > 0) {
      filterWarningContent.innerHTML = warnings.map(w => `<div style="margin-bottom: 0.75rem;">${w}</div>`).join('');
      filterWarning.style.display = 'block';
      console.warn('⚠️ Impossible filter combinations detected:');
      warnings.forEach((w, i) => console.warn(`   ${i + 1}. ${w.replace(/<[^>]*>/g, '')}`));
    } else {
      filterWarning.style.display = 'none';
    }

    // Build preview showing the actual filter chain
    console.log('📊 Filter Chain:');
    let previewHTML = '<div style="margin-bottom: 0.5rem;"><strong>Filter Chain:</strong></div>';
    let previewText = '';

    for (let i = 0; i < filterArray.length; i++) {
      const filter = filterArray[i];
      const columnName = columns[filter.column]?.header || `Column ${filter.column}`;
      const operatorLabel = operators.find(op => op.value === filter.operator)?.label || filter.operator;
      const valueStr = filter.value !== undefined ? String(filter.value) : '';

      const conditionText = `${columnName} ${operatorLabel} ${valueStr}`;
      console.log(`   ${i + 1}. ${conditionText}`);

      previewText += conditionText;
      previewHTML += `<div style="margin-left: 1rem;">${conditionText}</div>`;

      if (i < filterArray.length - 1) {
        const logic = filter.logicToNext || 'AND';
        console.log(`      ${logic}`);
        previewHTML += `<div style="margin-left: 2rem; font-weight: 600; color: #0c5460;">${logic}</div>`;
        previewText += ` ${logic} `;
      }
    }

    filterPreviewContent.innerHTML = previewHTML;
    filterPreview.style.display = 'block';

    // Apply filters: group consecutive same-column conditions with consistent logic
    const appliedColumns = new Set<number>();

    for (const [column, conditions] of columnGroups) {
      if (appliedColumns.has(column)) continue;

      // Determine the dominant logic for this column (use first logic found)
      const logic = conditions.find(c => c.logic)?.logic || 'AND';

      console.log(`   Applying ${conditions.length} condition(s) on column ${column} with ${logic} logic`);

      // Remove logic property before passing to setColumnFilter
      const cleanConditions = conditions.map(({ logic, ...rest }) => rest);

      (grid as any).filterManager.setColumnFilter(column, cleanConditions, logic);
      appliedColumns.add(column);
    }

    // Trigger the same refresh logic as setFilter
    if ((grid as any).filterManager) {
      (grid as any).state.filterState = (grid as any).filterManager.getFilterState();

      // Get visible rows and update the cache
      (grid as any).cachedVisibleRows = (grid as any).filterManager.getVisibleRows((grid as any).options.rowCount);
      console.log(`🔍 Filter applied: ${(grid as any).cachedVisibleRows.length} of ${(grid as any).options.rowCount} rows visible`);

      // Re-apply sort if active
      if ((grid as any).sortManager && (grid as any).state.sortState.length > 0) {
        console.log('🔄 Re-applying sort to filtered rows...');
        const currentSort = (grid as any).state.sortState;
        const SortManager = (grid as any).sortManager.constructor;
        (grid as any).sortManager = new SortManager({
          rowCount: (grid as any).cachedVisibleRows.length,
          getValue: (row: number, col: number) => {
            const dataRow = (grid as any).cachedVisibleRows[row];
            return (grid as any).dataAccessor?.getValue(dataRow, col);
          },
          sortMode: (grid as any).options.sortMode,
          onSortRequest: (grid as any).options.onSortRequest,
          events: (grid as any).events,
        });
        (grid as any).sortManager.setSortState(currentSort);
      }

      // Refresh the grid
      grid.refresh();

      // Emit filter:export event
      const fieldState = (grid as any).filterManager.getFieldFilterState();
      if (fieldState) {
        const exports = (grid as any).filterManager.getFilterExport();
        if (exports) {
          (grid as any).events.emit('filter:export', exports);
        }
      }
    }

    console.log(`✅ Applied filters on ${filtersByColumn.size} column(s)`);
  });

  // Clear all filters
  btnClearFilters.addEventListener('click', () => {
    console.log('🗑️ Clearing all filters...');
    grid.clearFilters();
    filterRowsContainer.innerHTML = '';
    activeFilters.clear();
    filterCounter = 0;
    addFilterRow();
    updateFilterExports(null);
    filterPreview.style.display = 'none';
    filterWarning.style.display = 'none';
    console.log('✅ All filters cleared');
  });

  // Listen to filter:export event
  grid.on('filter:export', (event) => {
    console.log('📤 Filter Export Event:', event);
    updateFilterExports(event);
  });

  // Update export displays
  function updateFilterExports(event: any) {
    const exportRest = document.getElementById('export-rest')!;
    const exportGraphQL = document.getElementById('export-graphql')!;
    const exportSQL = document.getElementById('export-sql')!;

    if (!event || !event.rest || !event.graphql || !event.sql) {
      exportRest.textContent = 'No filters applied';
      exportGraphQL.textContent = 'No filters applied';
      exportSQL.textContent = 'No filters applied';
      return;
    }

    // REST
    const restQuery = event.rest.queryString || 'No filters';
    exportRest.textContent = restQuery.startsWith('?')
      ? `/api/users${restQuery}`
      : restQuery;

    // GraphQL
    exportGraphQL.textContent = JSON.stringify(event.graphql.where, null, 2);

    // SQL
    const sqlText = event.sql.whereClause
      ? `SELECT * FROM users WHERE ${event.sql.whereClause}\n\nParams: ${JSON.stringify(event.sql.positionalParams)}`
      : 'No filters';
    exportSQL.textContent = sqlText;
  }
}

// Start application
main();
