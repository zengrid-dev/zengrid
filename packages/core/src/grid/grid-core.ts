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
import type { GridContext } from './grid-context';
import { createGridContext, installPlugins } from './grid-setup';
import {
  setupColumnModel,
  setupEditing,
  setupSelection,
  setupBridgeEvents,
  setupInfiniteScroll,
} from './grid-wiring';
import { createLifecycleMethods, type LifecycleMethods } from './grid-lifecycle';
import { createSortMethods, type SortMethods } from './grid-sort-methods';
import { createFilterMethods, type FilterMethods } from './grid-filter-methods';
import { createColumnMethods, type ColumnMethods } from './grid-column-methods';
import { createHeaderMethods, type HeaderMethods } from './grid-header-methods';
import type { GridStoreImpl } from '../reactive/store';
import type { GridApiImpl } from './grid-api';
import type { PluginHost } from './plugin-host';

export class Grid {
  private ctx: GridContext;
  private _lifecycle: LifecycleMethods;
  private _sort: SortMethods;
  private _filter: FilterMethods;
  private _columns: ColumnMethods;
  private _headers: HeaderMethods;

  constructor(container: HTMLElement, options: GridOptions) {
    this.ctx = createGridContext(container, options);
    installPlugins(this.ctx);

    this._sort = createSortMethods(this.ctx);
    this._filter = createFilterMethods(this.ctx);
    this._columns = createColumnMethods(this.ctx);
    this._headers = createHeaderMethods(this.ctx);
    this._lifecycle = createLifecycleMethods(this.ctx);

    setupColumnModel(this.ctx, { toggleSort: (col) => this._sort.toggleSort(col) });
    setupEditing(this.ctx);
    setupSelection(this.ctx);
    setupBridgeEvents(this.ctx);
    setupInfiniteScroll(this.ctx, { setData: (data) => this._lifecycle.setData(data) });
  }

  // --- Data ---
  setData(data: any[][]): void {
    this._lifecycle.setData(data);
  }
  getData(row: number, col: number): any {
    return this.ctx.dataOps.getData(row, col);
  }
  getDataMode(): 'frontend' | 'backend' {
    return this.ctx.dataOps.getDataMode();
  }

  // --- Render / Lifecycle ---
  render(): void {
    this._lifecycle.render();
  }
  refresh(): void {
    this.ctx.refresh();
  }
  clearCache(): void {
    this.ctx.clearCache();
  }
  updateCells(cells: CellRef[]): void {
    this._lifecycle.updateCells(cells);
  }
  destroy(): void {
    this._lifecycle.destroy();
  }

  // --- Scroll ---
  scrollToCell(row: number, col: number): void {
    if (!this.ctx.init.scroller || !this.ctx.scrollContainer) return;
    const position = this.ctx.init.scroller.getCellPosition(row, col);
    this.ctx.scrollContainer.scrollTop = position.y;
    this.ctx.scrollContainer.scrollLeft = position.x;
  }
  scrollThroughCells(
    cells: Array<{ row: number; col: number }>,
    options?: {
      delayMs?: number;
      smooth?: boolean;
      onCellReached?: (cell: { row: number; col: number }, index: number) => void;
    }
  ): { promise: Promise<void>; abort: () => void } {
    return this.ctx.scrollOps.scrollThroughCells(cells, options);
  }
  getScrollPosition(): { top: number; left: number } {
    return this.ctx.dataOps.getScrollPosition();
  }
  getVisibleRange(): VisibleRange | null {
    return this.ctx.dataOps.getVisibleRange();
  }

  // --- Sort ---
  sort(column: number, direction: 'asc' | 'desc' | null = 'asc'): void {
    this._sort.sort(column, direction);
  }
  toggleSort(column: number): void {
    this._sort.toggleSort(column);
  }
  getSortState(): SortState[] {
    return this._sort.getSortState();
  }
  getColumnSort(column: number) {
    return this._sort.getColumnSort(column);
  }
  getSortIcons(): { asc: string; desc: string } {
    return this._sort.getSortIcons();
  }
  getSortMode(): 'frontend' | 'backend' {
    return this._sort.getSortMode();
  }
  clearSort(): void {
    this._sort.clearSort();
  }
  setSortState(sortState: SortState[]): void {
    this._sort.setSortState(sortState);
  }

  // --- Filter ---
  setFilter(column: number, operator: string, value: any): void {
    this._filter.setFilter(column, operator, value);
  }
  setColumnFilter(
    column: number,
    conditions: Array<{ operator: string; value: any }>,
    logic: 'AND' | 'OR' = 'AND'
  ): void {
    this._filter.setColumnFilter(column, conditions, logic);
  }
  getFilterState(): FilterModel[] {
    return this._filter.getFilterState();
  }
  setFilterState(models: FilterModel[]): void {
    this._filter.setFilterState(models);
  }
  getFieldFilterState() {
    return this._filter.getFieldFilterState();
  }
  getFilterExports() {
    return this._filter.getFilterExports();
  }
  getFilterMode(): 'frontend' | 'backend' {
    return this._filter.getFilterMode();
  }
  clearFilters(): void {
    this._filter.clearFilters();
  }
  clearColumnFilter(column: number): void {
    this._filter.clearColumnFilter(column);
  }
  setQuickFilter(query: string, columns?: number[]): void {
    this._filter.setQuickFilter(query, columns);
  }
    clearQuickFilter(): void {
    this._filter.clearQuickFilter();
  }
  getQuickFilter(): { query: string; columns: number[] | null } {
    return this._filter.getQuickFilter();
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
    return {
      dataAccessor: this.ctx.dataOps.dataAccessor,
      options: this.ctx.options,
      viewIndices: viewIndices ?? null,
      columnModel: this.ctx.columnModel,
      selection: this.ctx.state.selection,
    };
  }

  // --- Pagination ---
  goToPage(page: number): void {
    this.ctx.pagination.goToPage(page);
  }
  nextPage(): void {
    this.ctx.pagination.nextPage();
  }
  previousPage(): void {
    this.ctx.pagination.previousPage();
  }
  firstPage(): void {
    this.ctx.pagination.firstPage();
  }
  lastPage(): void {
    this.ctx.pagination.lastPage();
  }
  setPageSize(pageSize: number): void {
    this.ctx.pagination.setPageSize(pageSize);
  }
  getCurrentPage(): number {
    return this.ctx.pagination.getCurrentPage();
  }
  getPageSize(): number {
    return this.ctx.pagination.getPageSize();
  }
  getTotalPages(): number {
    return this.ctx.pagination.getTotalPages();
  }

  // --- Column Resize / Drag ---
  attachColumnResize(headerElement: HTMLElement): void {
    this._columns.attachColumnResize(headerElement);
  }
  detachColumnResize(): void {
    this._columns.detachColumnResize();
  }
  resizeColumn(col: number, width: number): void {
    this._columns.resizeColumn(col, width);
  }
  autoFitColumn(col: number): void {
    this._columns.autoFitColumn(col);
  }
  autoFitAllColumns(): void {
    this._columns.autoFitAllColumns();
  }
  setColumnConstraints(col: number, constraints: ColumnConstraints): void {
    this._columns.setColumnConstraints(col, constraints);
  }
  updateColumnResizeHandles(): void {
    this._columns.updateColumnResizeHandles();
  }
  attachColumnDrag(headerElement: HTMLElement): void {
    this._columns.attachColumnDrag(headerElement);
  }
  detachColumnDrag(): void {
    this._columns.detachColumnDrag();
  }
  isDragging(): boolean {
    return this._columns.isDragging();
  }

  // --- Options / Stats ---
  registerRenderer(name: string, renderer: any): void {
    this.ctx.init.registry.register(name, renderer);
  }
  updateOptions(options: Partial<GridOptions>): void {
    this.ctx.options = { ...this.ctx.options, ...options };
    this.ctx.scrollOps.updateScroller();
    this.ctx.refresh();
  }
  getStats() {
    return this.ctx.dataOps.getStats();
  }
  getDimensions(): { width: number; height: number } {
    return this.ctx.dataOps.getDimensions();
  }
  getColumnPosition(col: number): { x: number; width: number } {
    return this.ctx.dataOps.getColumnPosition(col);
  }

  // --- State Persistence ---
  getColumnState(): ColumnStateSnapshot[] {
    return this._columns.getColumnState();
  }
  applyColumnState(
    state: ColumnStateSnapshot[],
    options?: { applyWidth?: boolean; applyVisibility?: boolean; applyOrder?: boolean }
  ): void {
    this._columns.applyColumnState(state, options);
  }
  getStateSnapshot(): GridStateSnapshot {
    return this._columns.getStateSnapshot(this._sort, this._filter);
  }
  applyStateSnapshot(snapshot: GridStateSnapshot): void {
    this._columns.applyStateSnapshot(snapshot, this._sort, this._filter);
  }

  // --- Headers ---
  registerHeaderRenderer(name: string, renderer: HeaderRenderer): void {
    this._headers.registerHeaderRenderer(name, renderer);
  }
  updateHeader(columnIndex: number): void {
    this._headers.updateHeader(columnIndex);
  }
  updateAllHeaders(): void {
    this._headers.updateAllHeaders();
  }
  refreshHeaders(): void {
    this._headers.refreshHeaders();
  }

  // --- Infinite Scroll ---
  resetInfiniteScrolling(): void {
    if (this.ctx.pluginHost.has('infinite-scroll')) this.ctx.store.exec('infiniteScroll:reset');
  }
  getSlidingWindowStats() {
    if (this.ctx.pluginHost.has('infinite-scroll'))
      return this.ctx.store.get('infiniteScroll.stats');
    return {
      virtualOffset: 0,
      rowsInMemory: this.ctx.state.data.length,
      totalRowsLoaded: 0,
      prunedRows: 0,
    };
  }

  // --- Events ---
  on<K extends keyof GridEvents>(event: K, handler: (payload: GridEvents[K]) => void): void {
    this.ctx.events.on(event, handler);
  }
  off<K extends keyof GridEvents>(event: K, handler: (payload: GridEvents[K]) => void): void {
    this.ctx.events.off(event, handler);
  }

  // --- Plugin System ---
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
