import type { GridOptions, GridState, CellRef, VisibleRange } from '../types';
import { EventEmitter } from '../events/event-emitter';
import type { GridEvents } from '../events/grid-events';
import type { ColumnConstraints } from '../features/column-resize';
import { SpatialHitTester } from '../rendering/spatial-hit-tester';
import { FilterAutocomplete } from '../features/filtering/filter-autocomplete';
import { FilterOptimizer } from '../features/filtering/filter-optimizer';
import { SubstringFilter } from '../features/filtering/substring-filter';
import { FormulaCalculator } from '../features/formulas/formula-calculator';
import { AutofillManager } from '../features/autofill/autofill-manager';

// Import all modules
import { GridDOM } from './dom';
import { GridPagination } from './pagination';
import { GridData } from './data';
import { GridSort } from './sort';
import { GridFilter } from './filter';
import { GridScroll } from './scroll';
import { GridResize } from './resize';
import { GridInit } from './init';

/**
 * Grid - Main grid class that integrates all components
 *
 * Orchestrates modular components for high-performance virtual scrolling data grid.
 *
 * @example
 * ```typescript
 * const container = document.getElementById('grid-container');
 * const grid = new Grid(container, {
 *   rowCount: 100000,
 *   colCount: 10,
 *   rowHeight: 30,
 *   colWidth: 100,
 * });
 *
 * // Set data
 * const data = Array.from({ length: 100000 }, (_, i) =>
 *   Array.from({ length: 10 }, (_, j) => `Cell ${i},${j}`)
 * );
 * grid.setData(data);
 *
 * // Render
 * grid.render();
 * ```
 */
export class Grid {
  private container: HTMLElement;
  private options: GridOptions;
  private state: GridState;

  // Modules
  private dom: GridDOM;
  private pagination: GridPagination;
  private dataOps: GridData;
  private sortOps: GridSort;
  private filterOps: GridFilter;
  private scrollOps: GridScroll;
  private resizeOps: GridResize;
  private init: GridInit;

  // Advanced features using new data structures & algorithms
  public spatialHitTester: SpatialHitTester = new SpatialHitTester();
  public filterAutocomplete: FilterAutocomplete = new FilterAutocomplete();
  public filterOptimizer: FilterOptimizer = new FilterOptimizer();
  public substringFilter: SubstringFilter = new SubstringFilter();
  public formulaCalculator: FormulaCalculator = new FormulaCalculator();
  public autofillManager: AutofillManager = new AutofillManager();

  // Events
  private events: EventEmitter<GridEvents> = new EventEmitter();

  // DOM element references
  private canvas: HTMLElement | null = null;
  private scrollContainer: HTMLElement | null = null;
  private headerContainer: HTMLElement | null = null;

  // Lifecycle
  private isDestroyed = false;

  constructor(container: HTMLElement, options: GridOptions) {
    if (!container) {
      throw new Error('Container element is required');
    }

    this.container = container;
    this.container.classList.add('zg-grid');

    // Initialize state
    this.state = {
      data: [],
      selection: [],
      activeCell: null,
      sortState: [],
      filterState: [],
      scrollPosition: { top: 0, left: 0 },
      editingCell: null,
    };

    // Validate options
    if (!options.rowCount || options.rowCount <= 0) options.rowCount = 0;
    if (!options.colCount || options.colCount <= 0) options.colCount = 0;
    this.options = options;

    // Initialize DOM module
    this.dom = new GridDOM(this.container, this.options);

    // Setup DOM structure
    this.dom.setupDOM();
    this.canvas = this.dom.canvas;
    this.scrollContainer = this.dom.scrollContainer;
    this.headerContainer = this.dom.headerContainer;

    // Initialize init module (component initialization)
    this.init = new GridInit(
      this.container,
      this.options,
      this.state,
      this.events,
      this.scrollContainer,
      this.canvas,
      {
        getSortManager: () => this.sortOps.getSortManager(),
        getCachedVisibleRows: () => this.filterOps.cachedVisibleRows,
        getDataAccessor: () => this.dataOps.dataAccessor,
      }
    );
    this.init.setupLoadingListeners();

    // Initialize data module
    this.dataOps = new GridData(
      this.options,
      this.state,
      this.events,
      this.init.scroller,
      this.init.pool,
      this.init.cache
    );

    // Initialize sort module
    this.sortOps = new GridSort(
      this.options,
      this.state,
      this.events,
      this.dataOps.dataAccessor,
      this.init.cache,
      () => this.refresh(),
      () => this.clearCache()
    );

    // Initialize filter module
    this.filterOps = new GridFilter(
      this.options,
      this.state,
      this.events,
      this.dataOps.dataAccessor,
      {
        onRefresh: () => this.refresh(),
        onClearCache: () => this.clearCache(),
        updateScrollerAndPositioner: (rowCount: number) => {
          // This method is called by filter to update scroller when row count changes
          // We need to implement the logic that was in the original filter module
          console.log(`Filter: updating scroller with ${rowCount} effective rows`);
        },
      }
    );

    // Initialize scroll module
    this.scrollOps = new GridScroll(
      this.options,
      this.state,
      this.scrollContainer,
      this.canvas,
      this.init.scroller,
      this.init.positioner,
      this.init.pool,
      this.init.registry,
      this.init.cache,
      this.dataOps.dataAccessor,
      {
        syncHeaderScroll: (scrollLeft: number) => this.dom.syncHeaderScroll(scrollLeft),
        getSortManager: () => this.sortOps.getSortManager(),
        getCachedVisibleRows: () => this.filterOps.cachedVisibleRows,
      }
    );

    // Attach scroll event listener
    if (this.scrollContainer) {
      this.scrollContainer.addEventListener('scroll', this.scrollOps.handleScroll);
    }

    // Initialize resize module
    this.resizeOps = new GridResize(
      this.options,
      this.events,
      this.init.scroller,
      this.dataOps.dataAccessor,
      this.scrollContainer,
      {
        updateCanvasSize: () => this.dom.updateCanvasSize(
          this.scrollOps.getScroller()?.getTotalWidth() ?? 0,
          this.scrollOps.getScroller()?.getTotalHeight() ?? 0
        ),
        onRefresh: () => this.refresh(),
      }
    );

    // Initialize pagination module
    this.pagination = new GridPagination(this.options, this.events);
  }

  /**
   * Set grid data
   * @param data - 2D array of cell values
   */
  setData(data: any[][]): void {
    this.dataOps.setData(data);
    // Update scroller and positioner references after data is set
    this.scrollOps.updateReferences(
      this.scrollOps.getScroller(),
      this.scrollOps.getPositioner(),
      this.dataOps.dataAccessor
    );
    this.resizeOps.updateScroller(this.scrollOps.getScroller());
  }

  /**
   * Render the grid
   */
  render(): void {
    if (this.isDestroyed) {
      throw new Error('Cannot render destroyed grid');
    }

    // Ensure components are initialized
    if (!this.init.scroller || !this.init.pool || !this.init.positioner) {
      this.init.initializeComponents();
      // Update references after initialization
      this.scrollOps.updateReferences(this.init.scroller, this.init.positioner, this.dataOps.dataAccessor);
      this.resizeOps.updateScroller(this.init.scroller);

      // Initialize column resize if configured
      if (this.options.columnResize && this.headerContainer) {
        this.resizeOps.initializeColumnResize();
        this.resizeOps.attachColumnResize(this.headerContainer);
      }
    }

    // Check again after initialization attempt
    if (!this.init.scroller || !this.init.pool || !this.init.positioner) {
      throw new Error('Grid initialization failed. Viewport may have no dimensions.');
    }

    // Update canvas size
    this.dom.updateCanvasSize(this.init.scroller.getTotalWidth(), this.init.scroller.getTotalHeight());

    // Initial render at scroll position 0,0
    this.init.positioner.renderVisibleCells(
      this.state.scrollPosition.top,
      this.state.scrollPosition.left
    );
  }

  /**
   * Refresh all visible cells
   */
  refresh(): void {
    if (!this.init.positioner) return;
    this.init.positioner.refresh();
  }

  /**
   * Clear renderer cache
   */
  clearCache(): void {
    if (this.init.cache) {
      this.init.cache.clear();
    }
  }

  /**
   * Update specific cells
   */
  updateCells(cells: CellRef[]): void {
    if (!this.init.positioner) return;
    this.init.positioner.updateCells(cells);
  }

  /**
   * Scroll to a specific cell
   */
  scrollToCell(row: number, col: number): void {
    if (!this.init.scroller || !this.scrollContainer) return;
    const position = this.init.scroller.getCellPosition(row, col);
    this.scrollContainer.scrollTop = position.y;
    this.scrollContainer.scrollLeft = position.x;
  }

  /**
   * Get current scroll position
   */
  getScrollPosition(): { top: number; left: number } {
    return this.dataOps.getScrollPosition();
  }

  /**
   * Get visible range
   */
  getVisibleRange(): VisibleRange | null {
    return this.dataOps.getVisibleRange();
  }

  /**
   * Register a custom renderer
   */
  registerRenderer(name: string, renderer: any): void {
    this.init.registry.register(name, renderer);
  }

  /**
   * Update grid options
   */
  updateOptions(options: Partial<GridOptions>): void {
    this.options = { ...this.options, ...options };
    this.scrollOps.updateScroller();
    this.refresh();
  }

  /**
   * Get grid statistics
   */
  getStats() {
    return this.dataOps.getStats();
  }

  /**
   * Get total grid dimensions
   */
  getDimensions(): { width: number; height: number } {
    return this.dataOps.getDimensions();
  }

  /**
   * Get column position
   */
  getColumnPosition(col: number): { x: number; width: number } {
    return this.dataOps.getColumnPosition(col);
  }

  // Sort operations
  sort(column: number, direction: 'asc' | 'desc' | null = 'asc'): void {
    this.sortOps.sort(column, direction);
  }

  toggleSort(column: number): void {
    this.sortOps.toggleSort(column);
  }

  getSortState() {
    return this.sortOps.getSortState();
  }

  getColumnSort(column: number) {
    return this.sortOps.getColumnSort(column);
  }

  getSortIcons(): { asc: string; desc: string } {
    return this.sortOps.getSortIcons();
  }

  getSortMode(): 'frontend' | 'backend' {
    return this.sortOps.getSortMode();
  }

  clearSort(): void {
    this.sortOps.clearSort();
  }

  // Filter operations
  setFilter(column: number, operator: string, value: any): void {
    this.filterOps.setFilter(column, operator, value);
  }

  setColumnFilter(
    column: number,
    conditions: Array<{ operator: string; value: any }>,
    logic: 'AND' | 'OR' = 'AND'
  ): void {
    this.filterOps.setColumnFilter(column, conditions, logic);
  }

  getFilterState() {
    return this.filterOps.getFilterState();
  }

  getFieldFilterState() {
    return this.filterOps.getFieldFilterState();
  }

  getFilterExports() {
    return this.filterOps.getFilterExports();
  }

  getFilterMode(): 'frontend' | 'backend' {
    return this.filterOps.getFilterMode();
  }

  clearFilters(): void {
    this.filterOps.clearFilter();
  }

  // Data operations
  getDataMode(): 'frontend' | 'backend' {
    return this.dataOps.getDataMode();
  }

  getData(row: number, col: number): any {
    return this.dataOps.getData(row, col);
  }

  // Pagination operations
  goToPage(page: number): void {
    this.pagination.goToPage(page);
  }

  nextPage(): void {
    this.pagination.nextPage();
  }

  previousPage(): void {
    this.pagination.previousPage();
  }

  firstPage(): void {
    this.pagination.firstPage();
  }

  lastPage(): void {
    this.pagination.lastPage();
  }

  setPageSize(pageSize: number): void {
    this.pagination.setPageSize(pageSize);
  }

  getCurrentPage(): number {
    return this.pagination.getCurrentPage();
  }

  getPageSize(): number {
    return this.pagination.getPageSize();
  }

  getTotalPages(): number {
    return this.pagination.getTotalPages();
  }

  // Column resize operations
  attachColumnResize(headerElement: HTMLElement): void {
    this.resizeOps.attachColumnResize(headerElement);
  }

  detachColumnResize(): void {
    this.resizeOps.detachColumnResize();
  }

  updateColumnResizeHandles(): void {
    this.resizeOps.updateColumnResizeHandles();
  }

  resizeColumn(col: number, width: number): void {
    this.resizeOps.resizeColumn(col, width);
  }

  autoFitColumn(col: number): void {
    this.resizeOps.autoFitColumn(col);
  }

  autoFitAllColumns(): void {
    this.resizeOps.autoFitAllColumns();
  }

  setColumnConstraints(col: number, constraints: ColumnConstraints): void {
    this.resizeOps.setColumnConstraints(col, constraints);
  }

  isResizing(): boolean {
    // TODO: Implement isResizing in GridResize module
    return false;
  }

  // Event subscriptions
  on<K extends keyof GridEvents>(event: K, handler: (payload: GridEvents[K]) => void): void {
    this.events.on(event, handler);
  }

  off<K extends keyof GridEvents>(event: K, handler: (payload: GridEvents[K]) => void): void {
    this.events.off(event, handler);
  }

  /**
   * Destroy the grid and clean up resources
   */
  destroy(): void {
    if (this.isDestroyed) return;

    // Destroy scroll module
    this.scrollOps.destroy();

    // Remove scroll event listener
    if (this.scrollContainer) {
      this.scrollContainer.removeEventListener('scroll', this.scrollOps.handleScroll);
    }

    // Destroy positioner
    if (this.init.positioner) {
      this.init.positioner.destroy();
    }

    // Clear pool
    if (this.init.pool) {
      this.init.pool.clear();
    }

    // Detach column resize
    this.resizeOps.detachColumnResize();

    // Clear DOM
    this.container.innerHTML = '';
    this.container.classList.remove('zg-grid');

    // Clear references
    this.canvas = null;
    this.scrollContainer = null;
    this.headerContainer = null;

    // Clear state
    this.state.data = [];
    this.state.selection = [];

    this.isDestroyed = true;
  }
}
