import type {
  CellRef,
  VisibleRange,
  ColumnStateSnapshot,
  GridStateSnapshot,
  SortState,
  GridExportOptions,
  FilterModel,
  GridOptions,
} from '../types';
import type { ColumnConstraints } from '../features/column-resize';
import type { HeaderRenderer } from '../rendering/headers';
import type { GridPlugin } from '../reactive';
import type { GridEvents } from '../events';
import { exportDelimited } from './grid-export';
import type { SlimGridContext } from './grid-context';
import { createSlimContext, installAllPlugins } from './grid-setup';
import { createThemeMethods, type ThemeMethods } from './grid-theme-methods';
import type { ZenGridTheme, PartialTheme } from '../theming/theme.interface';
import { registerTheme, listThemes } from '../theming/theme-registry';
import type { GridStoreImpl } from '../reactive/store';
import type { GridApiImpl } from './grid-api';
import type { PluginHost } from './plugin-host';
import type { DataAccessor } from '../data/data-accessor';
import { ArrayAccessor } from '../data/data-accessor/array-accessor';
import type { ColumnModel } from '../features/columns/column-model';

export class Grid {
  private ctx: SlimGridContext;
  private _theme: ThemeMethods;
  private _dataAccessor: DataAccessor | null = null;
  private _rendered = false;
  private _eventUnsubs: Array<() => void> = [];

  constructor(container: HTMLElement, options: GridOptions) {
    this.ctx = createSlimContext(container, options);
    installAllPlugins(this.ctx);

    // Theme setup (uses container directly, no legacy deps)
    this._theme = createThemeMethods(this.ctx as any);
  }

  // --- Data ---

  setData(data: any[][]): void {
    this.ctx.store.exec('core:setData', data);
    this.ctx.state.data = data;
    this.ctx.options.rowCount = data.length;

    // Create data accessor
    this._dataAccessor = new ArrayAccessor(data);
    (this.ctx as any)._setDataAccessor?.(this._dataAccessor);

    // Re-init dependent plugins
    if (this.ctx.pluginHost.has('infinite-scroll'))
      this.ctx.store.exec('infiniteScroll:init', data.length);
    if (this.ctx.pluginHost.has('filter'))
      this.ctx.store.exec('filter:init', this.ctx.options.colCount, this._dataAccessor);
    if (this.ctx.pluginHost.has('sort'))
      this.ctx.store.exec('sort:init', data.length, this._dataAccessor);
  }

  getData(row: number, col: number): any {
    return this._dataAccessor?.getValue(row, col);
  }

  getDataMode(): 'frontend' | 'backend' {
    return this.ctx.options.onLoadMoreRows ? 'backend' : 'frontend';
  }

  // --- Render / Lifecycle ---

  render(): void {
    if (this.ctx.isDestroyed) throw new Error('Cannot render destroyed grid');

    if (!this._rendered) {
      // Read container dimensions BEFORE DOM mutations to avoid forced reflow
      const containerWidth = this.ctx.container.clientWidth;
      const containerHeight = this.ctx.container.clientHeight;

      // Setup DOM
      this.ctx.store.exec('dom:setup');

      // Setup column model
      this.ctx.store.exec('column:setup');

      // Get the column model reference for late-binding
      const colApi = this.ctx.gridApi.getMethod('column', 'getModel');
      const columnModel: ColumnModel | null = colApi ? colApi() : null;
      (this.ctx as any)._setColumnModel?.(columnModel);

      // Initialize rendering (VirtualScroller, CellPool, CellPositioner)
      this.ctx.store.exec('rendering:initialize', containerWidth, containerHeight);

      // Attach scroll plugin
      const scrollContainer = this.ctx.store.get('dom.scrollContainer') as HTMLElement | null;
      if (scrollContainer) {
        if (this.ctx.pluginHost.has('scroll'))
          this.ctx.store.exec('scroll:attach', scrollContainer);
        if (this.ctx.pluginHost.has('resize'))
          this.ctx.store.exec('resize:attach', scrollContainer, containerWidth, containerHeight);

      }

      // Initialize column resize
      if (this.ctx.options.columnResize) {
        this.ctx.store.exec('column:initResize');
      }

      // Initialize column drag
      if (this.ctx.options.enableColumnDrag !== false && columnModel) {
        this.ctx.store.exec('column:initDrag');
      }

      // Initialize and render headers
      if (columnModel) {
        this.ctx.store.exec('header:initialize');
        this.ctx.store.exec('header:render');

        // Attach resize/drag to header
        const headerApi = this.ctx.gridApi.getMethod('header', 'getHeaderCellsContainer');
        const hc: HTMLElement | null = headerApi ? headerApi() : null;
        if (hc) {
          if (this.ctx.options.columnResize) this.ctx.store.exec('column:attachResize', hc);
          if (this.ctx.options.enableColumnDrag !== false) this.ctx.store.exec('column:attachDrag', hc);
        }
      }

      // Setup selection
      if (this.ctx.pluginHost.has('selection') && scrollContainer) {
        this.ctx.store.exec('selection:attach', {
          container: scrollContainer,
          selectionType: this.ctx.options.selectionType ?? 'cell',
          enableMultiSelection: !!this.ctx.options.enableMultiSelection,
          rowCount: () => this.ctx.options.rowCount,
          getDataValue: (row: number, col: number) => this._dataAccessor?.getValue(row, col),
          getViewIndices: () => this.ctx.store.get('rows.viewIndices') as number[] | undefined,
          onCellClick: this.ctx.options.onCellClick,
          onCellDoubleClick: this.ctx.options.onCellDoubleClick,
          onCellContextMenu: this.ctx.options.onCellContextMenu,
        });

        // Sync selection state
        this._eventUnsubs.push(
          this.ctx.events.on('selection:change', (payload: any) => {
            this.ctx.state.selection = payload.ranges ?? [];
            if (payload.isSelected) (this.ctx as any)._setSelectionChecker?.(payload.isSelected);
            if (this.ctx.options.onSelectionChange) this.ctx.options.onSelectionChange(this.ctx.state.selection);
            this.ctx.store.exec('rendering:refreshSelectionClasses');
            this.updateHeaderCheckbox();
          })
        );
      }

      // Sort header click bridge
      this._eventUnsubs.push(
        this.ctx.events.on('header:sort:click', (event: any) => {
          let dataCol = event.columnIndex;
          if (columnModel) {
            const orderedColumns = columnModel.getVisibleColumnsInOrder();
            if (orderedColumns[event.columnIndex]) dataCol = orderedColumns[event.columnIndex].dataIndex;
          }
          this.toggleSort(dataCol);
        })
      );

      // Checkbox header bridge
      this._eventUnsubs.push(
        this.ctx.events.on('header:checkbox:change', (event: any) => {
          if (!this.ctx.pluginHost.has('selection')) return;
          if (event.action === 'select-all') this.ctx.store.exec('selection:selectAll', this.ctx.options.rowCount);
          else this.ctx.store.exec('selection:clear');
        })
      );

      // Viewport resize bridge
      this._eventUnsubs.push(
        this.ctx.events.on('viewport:resized' as any, () => {
          this.ctx.store.exec('rendering:updateScroller');
          this.ctx.store.exec('rendering:refresh');
        })
      );

      // Scroll -> viewport plugin bridge
      this._eventUnsubs.push(
        this.ctx.events.on('scroll', (payload: any) => {
          if (this.ctx.pluginHost.has('viewport') && payload.visibleRange) {
            this.ctx.store.exec('viewport:updateRange', payload.visibleRange);
          }
        })
      );

      // Filter UI
      if (this.ctx.pluginHost.has('filter-ui')) {
        this.ctx.store.exec('filterUI:attach', this.ctx.container, this.ctx.events);
      }

      // Infinite scroll setup
      if (this.ctx.pluginHost.has('infinite-scroll')) {
        this.ctx.store.exec('infiniteScroll:setup');
      }

      // Setup editing
      this.setupEditing();

      this._rendered = true;
    }

    // Render visible cells
    this.ctx.store.exec('rendering:updateCanvasSize');
    this.ctx.store.exec('rendering:renderCells', this.ctx.state.scrollPosition.top, this.ctx.state.scrollPosition.left);

    // Auto-fit columns on load
    if (this.ctx.options.columnResize?.autoFitOnLoad) {
      this.ctx.store.exec('column:autoFitAll');
    }

    // Update viewport range
    const renderingApi = this.ctx.gridApi.getMethod('rendering', 'getVisibleRange');
    if (this.ctx.pluginHost.has('viewport') && renderingApi) {
      const initialRange = renderingApi();
      if (initialRange) this.ctx.store.exec('viewport:updateRange', initialRange);
    }

    // Update pagination
    if (this.ctx.pluginHost.has('pagination')) {
      this.ctx.store.exec('pagination:update');
    }
  }

  private setupEditing(): void {
    const scrollContainer = this.ctx.store.get('dom.scrollContainer') as HTMLElement | null;
    if (!scrollContainer) return;

    // Dblclick to start editing
    scrollContainer.addEventListener('dblclick', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const cell = target.closest('.zg-cell[data-row][data-col]') as HTMLElement;
      if (!cell) return;

      const row = parseInt(cell.dataset['row'] || '0', 10);
      const col = parseInt(cell.dataset['col'] || '0', 10);
      const column = this.ctx.options.columns?.[col];
      if (column?.editable && column.editor) {
        event.preventDefault();
        event.stopPropagation();
        this.ctx.store.exec('editing:startEdit', { row, col });
      }
    });

    // Enter key to start editing
    this.ctx.container.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        const activeCell = this.ctx.state.activeCell;
        if (activeCell && !this.ctx.state.editingCell) {
          const column = this.ctx.options.columns?.[activeCell.col];
          if (column?.editable && column.editor) {
            event.preventDefault();
            event.stopPropagation();
            this.ctx.store.exec('editing:startEdit', activeCell);
          }
        }
      }
    });
  }

  private updateHeaderCheckbox(): void {
    const checkbox = this.ctx.container.querySelector('.zg-header-checkbox-input') as HTMLInputElement | null;
    if (!checkbox) return;
    if (this.ctx.options.selectionType && this.ctx.options.selectionType !== 'row') {
      checkbox.indeterminate = false;
      checkbox.checked = false;
      return;
    }
    const rowCount = this.ctx.options.rowCount;
    const hasSelection = this.ctx.state.selection.length > 0;
    const hasFullRange = this.ctx.state.selection.some(
      (range) => range.startRow <= 0 && range.endRow >= rowCount - 1
    );
    checkbox.checked = hasFullRange;
    checkbox.indeterminate = hasSelection && !hasFullRange;
  }

  refresh(): void {
    this.ctx.store.exec('rendering:refresh');
  }

  clearCache(): void {
    this.ctx.store.exec('rendering:clearCache');
  }

  updateCells(cells: CellRef[]): void {
    this.ctx.store.exec('rendering:updateCells', cells);
  }

  destroy(): void {
    if (this.ctx.isDestroyed) return;
    for (const unsub of this._eventUnsubs) unsub();
    this._eventUnsubs.length = 0;
    this._theme.destroyAutoTheme();
    this.ctx.pluginHost.destroy();
    this.ctx.container.innerHTML = '';
    this.ctx.container.classList.remove('zg-grid');
    this.ctx.state.data = [];
    this.ctx.state.selection = [];
    this.ctx.isDestroyed = true;
  }

  // --- Scroll ---

  scrollToCell(row: number, col: number): void {
    const api = this.ctx.gridApi.getMethod('rendering', 'getCellPosition');
    const scrollContainer = this.ctx.store.get('dom.scrollContainer') as HTMLElement | null;
    if (!api || !scrollContainer) return;
    const position = api(row, col);
    scrollContainer.scrollTop = position.y;
    scrollContainer.scrollLeft = position.x;
  }

  scrollThroughCells(
    cells: Array<{ row: number; col: number }>,
    options?: { delayMs?: number; smooth?: boolean; onCellReached?: (cell: { row: number; col: number }, index: number) => void }
  ): { promise: Promise<void>; abort: () => void } {
    const getPosition = this.ctx.gridApi.getMethod('rendering', 'getCellPosition');
    const scrollContainer = this.ctx.store.get('dom.scrollContainer') as HTMLElement | null;
    const { delayMs = 1000, smooth = true, onCellReached } = options ?? {};

    let currentIndex = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let aborted = false;

    const abort = () => { aborted = true; if (timeoutId !== null) clearTimeout(timeoutId); };
    const promise = new Promise<void>((resolve) => {
      const next = () => {
        if (aborted || currentIndex >= cells.length) { resolve(); return; }
        const cell = cells[currentIndex];
        if (scrollContainer && getPosition) {
          const pos = getPosition(cell.row, cell.col);
          if (smooth) scrollContainer.scrollTo({ top: pos.y, left: pos.x, behavior: 'smooth' });
          else { scrollContainer.scrollTop = pos.y; scrollContainer.scrollLeft = pos.x; }
        }
        if (onCellReached) onCellReached(cell, currentIndex);
        currentIndex++;
        if (currentIndex < cells.length) timeoutId = setTimeout(next, delayMs);
        else resolve();
      };
      next();
    });
    return { promise, abort };
  }

  getScrollPosition(): { top: number; left: number } {
    return { ...this.ctx.state.scrollPosition };
  }

  getVisibleRange(): VisibleRange | null {
    const api = this.ctx.gridApi.getMethod('rendering', 'getVisibleRange');
    return api ? api() : null;
  }

  // --- Sort ---

  sort(column: number, direction: 'asc' | 'desc' | null = 'asc'): void {
    if (!this.ctx.pluginHost.has('sort')) return;
    if (direction === null) this.ctx.store.exec('sort:clear');
    else this.ctx.store.exec('sort:apply', [{ column, direction }]);
    this.syncAfterPipeline();
  }

  toggleSort(column: number): void {
    if (!this.ctx.pluginHost.has('sort')) return;
    this.ctx.store.exec('sort:toggle', column);
    this.syncAfterPipeline();
  }

  getSortState(): SortState[] {
    if (!this.ctx.pluginHost.has('sort')) return [];
    return this.ctx.store.get('sort.state') as SortState[];
  }

  getColumnSort(column: number) {
    if (!this.ctx.pluginHost.has('sort')) return null;
    const api = this.ctx.gridApi.getMethod('sort', 'getColumnSort');
    return api ? api(column) : null;
  }

  getSortIcons(): { asc: string; desc: string } {
    return {
      asc: this.ctx.options.sortIcons?.asc ?? '▲',
      desc: this.ctx.options.sortIcons?.desc ?? '▼',
    };
  }

  getSortMode(): 'frontend' | 'backend' {
    const mode = this.ctx.options.sortMode ?? 'frontend';
    if (mode === 'auto') return this.ctx.options.onSortRequest ? 'backend' : 'frontend';
    return mode;
  }

  clearSort(): void {
    if (!this.ctx.pluginHost.has('sort')) return;
    this.ctx.store.exec('sort:clear');
    this.syncAfterPipeline();
  }

  setSortState(sortState: SortState[]): void {
    if (!this.ctx.pluginHost.has('sort')) return;
    this.ctx.store.exec('sort:apply', sortState);
    this.syncAfterPipeline();
  }

  // --- Filter ---

  setFilter(column: number, operator: string, value: any): void {
    if (!this.ctx.pluginHost.has('filter')) return;
    this.ctx.store.exec('filter:setColumn', column, [{ operator, value }], 'AND');
    this.syncAfterPipeline();
  }

  setColumnFilter(column: number, conditions: Array<{ operator: string; value: any }>, logic: 'AND' | 'OR' = 'AND'): void {
    if (!this.ctx.pluginHost.has('filter')) return;
    this.ctx.store.exec('filter:setColumn', column, conditions, logic);
    this.syncAfterPipeline();
  }

  getFilterState(): FilterModel[] {
    if (!this.ctx.pluginHost.has('filter')) return [];
    return this.ctx.store.get('filter.state') as FilterModel[];
  }

  setFilterState(models: FilterModel[]): void {
    if (!this.ctx.pluginHost.has('filter')) return;
    this.ctx.store.exec('filter:setState', models);
    this.syncAfterPipeline();
  }

  getFieldFilterState() {
    if (!this.ctx.pluginHost.has('filter')) return null;
    const api = this.ctx.gridApi.getMethod('filter', 'getFieldFilterState');
    return api ? api() : null;
  }

  getFilterExports() {
    if (!this.ctx.pluginHost.has('filter')) return null;
    const api = this.ctx.gridApi.getMethod('filter', 'getFilterExports');
    return api ? api() : null;
  }

  getFilterMode(): 'frontend' | 'backend' {
    const mode = this.ctx.options.filterMode ?? 'frontend';
    if (mode === 'auto') return this.ctx.options.onFilterRequest ? 'backend' : 'frontend';
    return mode;
  }

  clearFilters(): void {
    if (!this.ctx.pluginHost.has('filter')) return;
    this.ctx.store.exec('filter:clear');
    this.syncAfterPipeline();
  }

  clearColumnFilter(column: number): void {
    if (!this.ctx.pluginHost.has('filter')) return;
    this.ctx.store.exec('filter:clearColumn', column);
    this.syncAfterPipeline();
  }

  setQuickFilter(query: string, columns?: number[]): void {
    if (!this.ctx.pluginHost.has('filter')) return;
    this.ctx.store.exec('filter:setQuickFilter', query, columns);
    this.syncAfterPipeline();
  }

  clearQuickFilter(): void {
    if (!this.ctx.pluginHost.has('filter')) return;
    this.ctx.store.exec('filter:clearQuickFilter');
    this.syncAfterPipeline();
  }

  getQuickFilter(): { query: string; columns: number[] | null } {
    if (!this.ctx.pluginHost.has('filter')) return { query: '', columns: null };
    return this.ctx.store.get('filter.quickFilter') as { query: string; columns: number[] | null };
  }

  private syncAfterPipeline(): void {
    const viewIndices = this.ctx.store.get('rows.viewIndices') as number[] | undefined;
    const visibleCount = viewIndices ? viewIndices.length : this.ctx.options.rowCount;
    this.ctx.store.exec('rendering:setRowCount', visibleCount);
    this.ctx.store.exec('rendering:updateCanvasSize');
    this.ctx.store.exec('rendering:clearCache');
    this.ctx.store.exec('rendering:refresh');
  }

  // --- Export ---

  exportCSV(options: GridExportOptions = {}): string {
    return exportDelimited(',', options, this.getExportDeps());
  }

  exportTSV(options: GridExportOptions = {}): string {
    return exportDelimited('\t', options, this.getExportDeps());
  }

  private getExportDeps() {
    const viewIndices = this.ctx.store.get('rows.viewIndices') as number[] | undefined;
    const getModel = this.ctx.gridApi.getMethod('column', 'getModel');
    return {
      dataAccessor: this._dataAccessor,
      options: this.ctx.options,
      viewIndices: viewIndices ?? null,
      columnModel: getModel ? getModel() : null,
      selection: this.ctx.state.selection,
    };
  }

  // --- Pagination ---

  goToPage(page: number): void {
    if (this.ctx.pluginHost.has('pagination')) this.ctx.store.exec('pagination:goToPage', page);
  }

  nextPage(): void {
    if (this.ctx.pluginHost.has('pagination')) this.ctx.store.exec('pagination:nextPage');
  }

  previousPage(): void {
    if (this.ctx.pluginHost.has('pagination')) this.ctx.store.exec('pagination:previousPage');
  }

  firstPage(): void {
    if (this.ctx.pluginHost.has('pagination')) this.ctx.store.exec('pagination:firstPage');
  }

  lastPage(): void {
    if (this.ctx.pluginHost.has('pagination')) this.ctx.store.exec('pagination:lastPage');
  }

  setPageSize(pageSize: number): void {
    if (this.ctx.pluginHost.has('pagination')) this.ctx.store.exec('pagination:setPageSize', pageSize);
  }

  getCurrentPage(): number {
    return (this.ctx.pluginHost.has('pagination') ? this.ctx.store.get('pagination.currentPage') : 0) as number;
  }

  getPageSize(): number {
    return (this.ctx.pluginHost.has('pagination') ? this.ctx.store.get('pagination.pageSize') : 100) as number;
  }

  getTotalPages(): number {
    const api = this.ctx.gridApi.getMethod('pagination', 'getTotalPages');
    return api ? api() : 0;
  }

  // --- Column Resize / Drag ---

  attachColumnResize(headerElement: HTMLElement): void {
    this.ctx.store.exec('column:attachResize', headerElement);
  }

  detachColumnResize(): void {
    this.ctx.store.exec('column:detachResize');
  }

  resizeColumn(col: number, width: number): void {
    this.ctx.store.exec('column:resizeColumn', col, width);
  }

  autoFitColumn(col: number): void {
    this.ctx.store.exec('column:autoFit', col);
  }

  autoFitAllColumns(): void {
    this.ctx.store.exec('column:autoFitAll');
  }

  setColumnConstraints(col: number, constraints: ColumnConstraints): void {
    this.ctx.store.exec('column:setConstraints', col, constraints);
  }

  updateColumnResizeHandles(): void {
    this.ctx.store.exec('column:updateResizeHandles');
  }

  attachColumnDrag(headerElement: HTMLElement): void {
    this.ctx.store.exec('column:attachDrag', headerElement);
  }

  detachColumnDrag(): void {
    this.ctx.store.exec('column:detachDrag');
  }

  isDragging(): boolean {
    const api = this.ctx.gridApi.getMethod('column', 'isDragging');
    return api ? api() : false;
  }

  // --- Options / Stats ---

  registerRenderer(name: string, renderer: any): void {
    this.ctx.store.exec('rendering:registerRenderer', name, renderer);
  }

  updateOptions(options: Partial<GridOptions>): void {
    this.ctx.options = { ...this.ctx.options, ...options };
    this.ctx.store.exec('rendering:updateScroller');
    this.ctx.store.exec('rendering:refresh');
  }

  getStats() {
    const api = this.ctx.gridApi.getMethod('rendering', 'getStats');
    return api ? api() : null;
  }

  getDimensions(): { width: number; height: number } {
    const api = this.ctx.gridApi.getMethod('rendering', 'getDimensions');
    return api ? api() : { width: 0, height: 0 };
  }

  getColumnPosition(col: number): { x: number; width: number } {
    const api = this.ctx.gridApi.getMethod('rendering', 'getColumnPosition');
    return api ? api(col) : { x: 0, width: 0 };
  }

  // --- State Persistence ---

  getColumnState(): ColumnStateSnapshot[] {
    const api = this.ctx.gridApi.getMethod('column', 'getState');
    return api ? api() : [];
  }

  applyColumnState(state: ColumnStateSnapshot[], options?: { applyWidth?: boolean; applyVisibility?: boolean; applyOrder?: boolean }): void {
    this.ctx.store.exec('column:applyState', state, options);
  }

  getStateSnapshot(): GridStateSnapshot {
    const api = this.ctx.gridApi.getMethod('column', 'getStateSnapshot');
    return api
      ? api(() => this.getSortState(), () => this.getFilterState())
      : { columns: [], sortState: [], filterState: [] };
  }

  applyStateSnapshot(snapshot: GridStateSnapshot): void {
    const api = this.ctx.gridApi.getMethod('column', 'applyStateSnapshot');
    if (api) {
      api(
        snapshot,
        (s: SortState[]) => this.setSortState(s),
        (m: FilterModel[]) => this.setFilterState(m)
      );
    }
  }

  // --- Headers ---

  registerHeaderRenderer(name: string, renderer: HeaderRenderer): void {
    this.ctx.store.exec('header:registerRenderer', name, renderer);
  }

  updateHeader(columnIndex: number): void {
    this.ctx.store.exec('header:update', columnIndex);
  }

  updateAllHeaders(): void {
    this.ctx.store.exec('header:updateAll');
  }

  refreshHeaders(): void {
    this.ctx.store.exec('header:refresh');
  }

  // --- Infinite Scroll ---

  resetInfiniteScrolling(): void {
    if (this.ctx.pluginHost.has('infinite-scroll')) this.ctx.store.exec('infiniteScroll:reset');
  }

  getSlidingWindowStats() {
    if (this.ctx.pluginHost.has('infinite-scroll'))
      return this.ctx.store.get('infiniteScroll.stats');
    return { virtualOffset: 0, rowsInMemory: this.ctx.state.data.length, totalRowsLoaded: 0, prunedRows: 0 };
  }

  // --- Theme ---

  setTheme(nameOrObject: string | ZenGridTheme): void {
    this._theme.setTheme(nameOrObject);
  }

  getTheme(): ZenGridTheme {
    return this._theme.getTheme();
  }

  getThemeName(): string {
    return this._theme.getThemeName();
  }

  updateTheme(partial: PartialTheme): void {
    this._theme.updateTheme(partial);
  }

  resetTheme(): void {
    this._theme.resetTheme();
  }

  static registerTheme(theme: ZenGridTheme): void {
    registerTheme(theme);
  }

  static getAvailableThemes(): string[] {
    return listThemes();
  }

  // --- Events ---

  on<K extends keyof GridEvents>(event: K, handler: (payload: GridEvents[K]) => void): void {
    this.ctx.events.on(event, handler);
  }

  off<K extends keyof GridEvents>(event: K, handler: (payload: GridEvents[K]) => void): void {
    this.ctx.events.off(event, handler);
  }

  // --- Plugin System ---

  getContainer(): HTMLElement {
    return this.ctx.container;
  }

  getStore(): GridStoreImpl {
    return this.ctx.store;
  }

  getPluginHost(): PluginHost {
    return this.ctx.pluginHost;
  }

  getGridApi(): GridApiImpl {
    return this.ctx.gridApi;
  }

  usePlugin(plugin: GridPlugin): void {
    this.ctx.pluginHost.use(plugin);
  }
}
