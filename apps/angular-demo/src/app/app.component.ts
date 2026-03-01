import { Component, signal, computed, viewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ZenGridComponent } from '@zengrid/angular';
import type { ColumnDef, GridEvents } from '@zengrid/angular';
import {
  CheckboxRenderer,
  ProgressBarRenderer,
  ButtonRenderer,
  ChipRenderer,
  DateRenderer,
  DateRangeRenderer,
  NumberRenderer,
  DropdownRenderer,
  TextEditor,
  DateEditor,
  DateRangeEditor,
  applyTheme,
  getTheme,
  listThemes,
} from '@zengrid/core';

// --- Data Generation ---

const TASK_NAMES = [
  'Implement user authentication', 'Fix memory leak in worker', 'Add dark mode support',
  'Refactor payment service', 'Write API documentation', 'Optimize database queries',
  'Build notification system', 'Fix mobile layout issues', 'Add CSV export feature',
  'Implement rate limiting', 'Create onboarding flow', 'Fix timezone handling',
  'Add WebSocket support', 'Improve search relevance', 'Build admin dashboard',
  'Fix file upload timeout', 'Add two-factor auth', 'Implement caching layer',
  'Fix race condition in sync', 'Add audit logging', 'Build reporting module',
  'Fix CSS overflow bug', 'Implement SSO integration', 'Add batch processing',
  'Fix email template rendering', 'Implement undo/redo', 'Add real-time collaboration',
  'Fix scroll jank', 'Build plugin system', 'Add data validation layer',
  'Fix infinite re-render loop', 'Implement lazy loading', 'Add accessibility labels',
  'Fix CORS configuration', 'Build CI/CD pipeline', 'Add error boundary',
  'Fix date picker locale', 'Implement drag and drop', 'Add keyboard shortcuts',
  'Fix memory allocation issue', 'Build feature flag system', 'Add API versioning',
  'Fix broken pagination', 'Implement tree shaking', 'Add performance monitoring',
  'Fix flaky test suite', 'Build migration tool', 'Add input sanitization',
  'Fix deadlock in queue', 'Implement code splitting',
];

const STATUSES = ['Todo', 'In Progress', 'Review', 'Done', 'Blocked'] as const;
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const;
const ASSIGNEES = [
  'Alice Chen', 'Bob Martinez', 'Carol Wu', 'David Kim', 'Eva Patel',
  'Frank Liu', 'Grace Obi', 'Henry Park', 'Iris Nakamura', 'Jake Thompson',
  'Karen Singh', 'Leo Fernandez', 'Mia Johnson', 'Noah Garcia', 'Olivia Brown',
  'Paul Anderson', 'Quinn Davis', 'Rachel Lee', 'Sam Wilson', 'Tara Moore',
];
const TAGS_POOL = ['Frontend', 'Backend', 'UX', 'Bug', 'Feature', 'DevOps', 'Security', 'Docs'];

const STATUS_CHIP_COLORS: Record<string, { background: string; color: string }> = {
  'Todo': { background: '#e3f2fd', color: '#1565c0' },
  'In Progress': { background: '#fff3e0', color: '#e65100' },
  'Review': { background: '#f3e5f5', color: '#7b1fa2' },
  'Done': { background: '#e8f5e9', color: '#2e7d32' },
  'Blocked': { background: '#ffebee', color: '#c62828' },
};

function randomDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + Math.floor(Math.random() * offsetDays * 2) - offsetDays);
  return d.toISOString().slice(0, 10);
}

function generateProjectData(count: number): any[][] {
  const data: any[][] = [];
  for (let i = 0; i < count; i++) {
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    const priority = PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)];
    let progress: number;
    if (status === 'Done') progress = 100;
    else if (status === 'Todo') progress = 0;
    else if (status === 'Blocked') progress = Math.floor(Math.random() * 30);
    else progress = Math.floor(Math.random() * 90) + 10;

    const dueDate = randomDate(30);

    const sprintStart = new Date();
    sprintStart.setDate(sprintStart.getDate() + Math.floor(Math.random() * 14) - 7);
    const sprintEnd = new Date(sprintStart);
    sprintEnd.setDate(sprintEnd.getDate() + 14);
    const sprint = {
      start: sprintStart.toISOString().slice(0, 10),
      end: sprintEnd.toISOString().slice(0, 10),
    };

    const tagCount = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...TAGS_POOL].sort(() => Math.random() - 0.5);
    const tags = shuffled.slice(0, tagCount).map(t => ({ label: t }));

    data.push([
      status === 'Done',                                       // 0: complete
      `TASK-${String(i + 1).padStart(4, '0')}`,               // 1: id
      TASK_NAMES[i % TASK_NAMES.length],                       // 2: taskName
      [{ label: status, background: STATUS_CHIP_COLORS[status].background, color: STATUS_CHIP_COLORS[status].color }], // 3: status (chip array)
      priority,                                                // 4: priority
      ASSIGNEES[i % ASSIGNEES.length],                         // 5: assignee
      progress,                                                // 6: progress
      dueDate,                                                 // 7: dueDate
      sprint,                                                  // 8: sprint
      tags,                                                    // 9: tags
      Math.floor(Math.random() * 40) + 1,                     // 10: hours
      'Edit',                                                  // 11: actions
    ]);
  }
  return data;
}

// --- Component ---

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ZenGridComponent, FormsModule],
  template: `
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-icon">&#9638;</span>
        <span class="logo-text">ZenGrid</span>
      </div>
      <nav class="sidebar-nav">
        <a class="nav-item active">
          <span class="nav-icon">&#9776;</span>
          <span>Projects</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">&#9733;</span>
          <span>Favorites</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">&#128100;</span>
          <span>Team</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">&#9881;</span>
          <span>Settings</span>
        </a>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-version">Angular Demo</div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Header -->
      <header class="main-header">
        <div>
          <h1 class="main-title">Project Board</h1>
          <p class="main-subtitle">Track and manage all project tasks</p>
        </div>
        <div class="header-right">
          <label class="theme-label">Theme</label>
          <select class="theme-select" [ngModel]="selectedTheme()" (ngModelChange)="onThemeChange($event)">
            @for (t of themeNames; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </div>
      </header>

      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon stat-icon-total">&#9744;</div>
          <div class="stat-info">
            <div class="stat-value">{{ totalTasks() }}</div>
            <div class="stat-label">Total Tasks</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-progress">&#9654;</div>
          <div class="stat-info">
            <div class="stat-value">{{ inProgressCount() }}</div>
            <div class="stat-label">In Progress</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-done">&#10003;</div>
          <div class="stat-info">
            <div class="stat-value">{{ completedCount() }}</div>
            <div class="stat-label">Completed</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-overdue">&#9888;</div>
          <div class="stat-info">
            <div class="stat-value">{{ overdueCount() }}</div>
            <div class="stat-label">Overdue</div>
          </div>
        </div>
      </div>

      <!-- Controls Row -->
      <div class="controls-row">
        <input
          class="quick-filter"
          type="text"
          placeholder="Quick filter..."
          [ngModel]="filterQuery()"
          (ngModelChange)="onFilterChange($event)"
        />
        <div class="controls-right">
          <button class="btn btn-primary" (click)="addTasks()">+ Add 50 Tasks</button>
          <button class="btn btn-secondary" (click)="exportCSV()">Export CSV</button>
          <span class="row-count-badge">{{ rowCount() }} rows</span>
        </div>
      </div>

      <!-- Grid -->
      <div class="grid-container" #gridShell>
        <zen-grid
          #zenGrid
          [rowCount]="rowCount()"
          [colCount]="columns.length"
          [columns]="columns"
          [data]="gridData()"
          [rowHeight]="36"
          [enableSelection]="true"
          [selectionType]="'row'"
          [enableColumnResize]="true"
          [enableColumnDrag]="true"
          [enableKeyboardNavigation]="true"
          [sortMode]="'frontend'"
          [filterMode]="'frontend'"
          [pagination]="paginationConfig"
        />
      </div>
    </main>
  `,
  styles: [`
    :host {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* --- Sidebar --- */
    .sidebar {
      width: 240px;
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
      color: #cbd5e1;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 20px 28px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .logo-icon {
      font-size: 1.5rem;
      color: #818cf8;
    }
    .logo-text {
      font-size: 1.15rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: 0.5px;
    }
    .sidebar-nav {
      flex: 1;
      padding: 16px 0;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 24px;
      font-size: 0.9rem;
      color: #94a3b8;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      text-decoration: none;
    }
    .nav-item:hover { background: rgba(255,255,255,0.05); color: #e2e8f0; }
    .nav-item.active { background: rgba(129,140,248,0.12); color: #818cf8; font-weight: 600; }
    .nav-icon { font-size: 1.1rem; width: 22px; text-align: center; }
    .sidebar-footer {
      padding: 16px 24px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .sidebar-version { font-size: 0.75rem; color: #64748b; }

    /* --- Main Content --- */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      background: #f8fafc;
      padding: 24px 32px;
      gap: 20px;
      overflow: hidden;
    }

    /* --- Header --- */
    .main-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }
    .main-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    .main-subtitle {
      font-size: 0.85rem;
      color: #64748b;
      margin: 4px 0 0;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .theme-label {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 500;
    }
    .theme-select {
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.8rem;
      background: #fff;
      color: #334155;
      cursor: pointer;
    }

    /* --- Stat Cards --- */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .stat-card {
      background: #fff;
      border-radius: 10px;
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .stat-icon {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
    }
    .stat-icon-total { background: linear-gradient(135deg, #818cf8, #6366f1); color: #fff; }
    .stat-icon-progress { background: linear-gradient(135deg, #fb923c, #f97316); color: #fff; }
    .stat-icon-done { background: linear-gradient(135deg, #4ade80, #22c55e); color: #fff; }
    .stat-icon-overdue { background: linear-gradient(135deg, #f87171, #ef4444); color: #fff; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.35rem; font-weight: 700; color: #1e293b; }
    .stat-label { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }

    /* --- Controls Row --- */
    .controls-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .quick-filter {
      flex: 0 1 280px;
      padding: 8px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.85rem;
      background: #fff;
      color: #334155;
      outline: none;
      transition: border-color 0.15s;
    }
    .quick-filter:focus { border-color: #818cf8; }
    .controls-right {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    }
    .btn {
      padding: 7px 16px;
      border: none;
      border-radius: 7px;
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
    }
    .btn:active { transform: scale(0.97); }
    .btn-primary {
      background: #6366f1;
      color: #fff;
    }
    .btn-primary:hover { background: #4f46e5; }
    .btn-secondary {
      background: #fff;
      color: #334155;
      border: 1px solid #e2e8f0;
    }
    .btn-secondary:hover { background: #f1f5f9; }
    .row-count-badge {
      font-size: 0.78rem;
      color: #64748b;
      background: #f1f5f9;
      padding: 5px 10px;
      border-radius: 6px;
    }

    /* --- Grid Container --- */
    .grid-container {
      flex: 1;
      min-height: 0;
      border-radius: 10px;
      overflow: hidden;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
    }
  `],
})
export class AppComponent {
  readonly zenGrid = viewChild<ZenGridComponent>('zenGrid');
  readonly gridShell = viewChild<any>('gridShell');

  readonly selectedTheme = signal('light');
  readonly filterQuery = signal('');
  readonly themeNames = listThemes();

  private _data = signal(generateProjectData(500));

  readonly rowCount = computed(() => this._data().length);
  readonly gridData = computed(() => this._data());

  readonly totalTasks = computed(() => this._data().length);
  readonly inProgressCount = computed(() => this._data().filter(r => (r[3] as any[])[0]?.label === 'In Progress').length);
  readonly completedCount = computed(() => this._data().filter(r => r[0] === true).length);
  readonly overdueCount = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this._data().filter(r => r[7] < today && r[0] !== true).length;
  });

  readonly paginationConfig = {
    enabled: true,
    pageSize: 50,
    pageSizeOptions: [25, 50, 100],
  };

  readonly columns: ColumnDef[] = [
    {
      field: 'complete',
      header: { text: '✓', type: 'text' },
      width: 50,
      renderer: new CheckboxRenderer({
        onChange: (value, params) => {
          const d = this._data();
          d[params.cell.row][0] = value;
          this._data.set([...d]);
        },
      }),
      sortable: false,
      minWidth: 40,
    },
    {
      field: 'id',
      header: { text: '#', type: 'sortable', sortIndicator: { show: true, position: 'trailing' }, interactive: true },
      width: 60,
      sortable: true,
    },
    {
      field: 'taskName',
      header: { text: 'Task', type: 'sortable', sortIndicator: { show: true, position: 'trailing' }, interactive: true },
      width: 240,
      sortable: true,
      editable: true,
      editor: new TextEditor({ maxLength: 200 }),
    },
    {
      field: 'status',
      header: { text: 'Status', type: 'sortable', sortIndicator: { show: true, position: 'trailing' }, interactive: true },
      width: 130,
      renderer: new ChipRenderer({ overflowMode: 'scroll' }),
      sortable: true,
    },
    {
      field: 'priority',
      header: { text: 'Priority', type: 'sortable', sortIndicator: { show: true, position: 'trailing' }, interactive: true },
      width: 120,
      renderer: new DropdownRenderer({
        options: [
          { label: 'Critical', value: 'Critical' },
          { label: 'High', value: 'High' },
          { label: 'Medium', value: 'Medium' },
          { label: 'Low', value: 'Low' },
        ],
        onChange: (value, params) => {
          const d = this._data();
          d[params.cell.row][4] = value;
          this._data.set([...d]);
        },
      }),
      sortable: true,
    },
    {
      field: 'assignee',
      header: { text: 'Assignee', type: 'sortable', sortIndicator: { show: true, position: 'trailing' }, interactive: true },
      width: 140,
      sortable: true,
    },
    {
      field: 'progress',
      header: { text: 'Progress', type: 'sortable', sortIndicator: { show: true, position: 'trailing' }, interactive: true },
      width: 160,
      renderer: new ProgressBarRenderer({
        min: 0,
        max: 100,
        showValue: true,
        colorThresholds: [
          { value: 30, color: '#ef4444' },
          { value: 70, color: '#f59e0b' },
          { value: 100, color: '#22c55e' },
        ],
      }),
      sortable: true,
    },
    {
      field: 'dueDate',
      header: { text: 'Due Date', type: 'sortable', sortIndicator: { show: true, position: 'trailing' }, interactive: true },
      width: 140,
      renderer: new DateRenderer({ format: 'MM/DD/YYYY' }),
      sortable: true,
      editable: true,
      editor: new DateEditor({
        format: 'MM/DD/YYYY',
        minDate: new Date('2024-01-01'),
        maxDate: new Date('2028-12-31'),
        required: true,
        autoFocus: true,
        theme: 'light',
        useCalendarPopup: true,
      }),
    },
    {
      field: 'sprint',
      header: { text: 'Sprint', type: 'text' },
      width: 280,
      renderer: new DateRangeRenderer({
        format: 'MM/DD/YYYY',
        showDuration: true,
        separator: ' → ',
        chipStyle: false,
      }),
      sortable: false,
      editable: true,
      editor: new DateRangeEditor({
        format: 'MM/DD/YYYY',
        minDate: new Date('2024-01-01'),
        maxDate: new Date('2028-12-31'),
        required: true,
        autoFocus: true,
        theme: 'light',
        allowSameDate: false,
      }),
    },
    {
      field: 'tags',
      header: { text: 'Tags', type: 'text' },
      width: 200,
      renderer: new ChipRenderer({
        overflowMode: 'scroll',
        showOverflowTooltip: true,
      }),
      sortable: false,
      overflow: { mode: 'scroll' },
    },
    {
      field: 'hours',
      header: { text: 'Hours', type: 'sortable', sortIndicator: { show: true, position: 'trailing' }, interactive: true },
      width: 90,
      renderer: new NumberRenderer({ minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      sortable: true,
    },
    {
      field: 'actions',
      header: { text: '', type: 'text' },
      width: 100,
      renderer: new ButtonRenderer({
        label: 'Edit',
        variant: 'primary',
        size: 'small',
        onClick: (params) => {
          console.log('Edit row', params.cell.row, this._data()[params.cell.row]);
        },
      }),
      sortable: false,
    },
  ];

  onThemeChange(themeName: string): void {
    this.selectedTheme.set(themeName);
    const theme = getTheme(themeName);
    if (!theme) return;
    const shell = (this.gridShell() as any)?.nativeElement ?? document.querySelector('.grid-container');
    if (shell) {
      applyTheme(shell, theme);
    }
  }

  onFilterChange(query: string): void {
    this.filterQuery.set(query);
    const grid = this.zenGrid();
    if (grid) {
      grid.setQuickFilter(query);
    }
  }

  addTasks(): void {
    const newTasks = generateProjectData(50);
    const startIdx = this._data().length;
    for (let i = 0; i < newTasks.length; i++) {
      newTasks[i][1] = `TASK-${String(startIdx + i + 1).padStart(4, '0')}`;
    }
    this._data.set([...this._data(), ...newTasks]);
  }

  exportCSV(): void {
    const grid = this.zenGrid();
    if (grid) {
      const csv = grid.exportCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project-tasks.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  }
}
