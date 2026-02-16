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

import { GridDOM } from './dom';
import { GridPagination } from './pagination';
import { GridData } from './data';
import { GridSort } from './sort';
import { GridFilter } from './filter';
import { GridScroll } from './scroll';
import { GridResize } from './resize';
import { GridDrag } from './drag';
import { GridInit } from './init';
import { HeaderManager } from './header-manager';
import { GridEditing } from './grid-editing';
import { GridInfiniteScroll } from './grid-infinite-scroll';
import type { HeaderRenderer } from '../rendering/headers/header-renderer.interface';
import { ColumnModel } from '../features/columns/column-model';
import { ScrollModel } from '../features/viewport/scroll-model';
import { ViewportModel } from '../features/viewport/viewport-model';

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
  private dragOps: GridDrag;
  private init: GridInit;
  private headerManager: HeaderManager | null = null;
  private columnModel: ColumnModel | null = null;
  private editingOps: GridEditing | null = null;
  private infiniteScrollOps: GridInfiniteScroll | null = null;

  // Reactive viewport models
  private scrollModel: ScrollModel;
  private viewportModel: ViewportModel;

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

  // Lifecycle
  private isDestroyed = false;

  constructor(container: HTMLElement, options: GridOptions) {
    if (!container) {
      throw new Error('Container element is required');
    }

    this.container = container;
    this.container.classList.add('zg-grid');

    // Initialize reactive viewport models
    this.scrollModel = new ScrollModel();
    this.viewportModel = new ViewportModel();

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
        getColumnModel: () => this.columnModel,
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
        getSortManager: () => this.sortOps.getSortManager(),
        getCachedVisibleRows: () => this.filterOps.cachedVisibleRows,
        getColumnModel: () => this.columnModel,
        emitEvent: (event: string, payload: any) => this.events.emit(event as any, payload),
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

    // Initialize drag module
    this.dragOps = new GridDrag(
      this.options,
      this.events,
      this.scrollContainer
    );

    // Initialize pagination module
    this.pagination = new GridPagination(this.options, this.events);

    // Initialize column model and header manager if columns are defined
    if (this.options.columns && this.options.columns.length > 0) {
      this.columnModel = new ColumnModel(this.options.columns);
      this.resizeOps.setColumnModel(this.columnModel);
      this.dragOps.setColumnModel(this.columnModel);

      this.columnModel.subscribeAll({
        onChange: (event) => {
          if (event.type === 'width' || event.type === 'reorder') {
            if (this.init.scroller) {
              this.dom.updateCanvasSize(
                this.init.scroller.getTotalWidth(),
                this.init.scroller.getTotalHeight()
              );
            }

            if (this.init.positioner) {
              this.init.positioner.refresh();
            }

            if (event.type === 'reorder') {
              this.resizeOps.updateColumnResizeHandles();
            }
          }
        },
      });

      const headerContainer = this.dom.createHeaderContainer();
      if (headerContainer) {
        this.headerManager = new HeaderManager({
          columnModel: this.columnModel,
          container: headerContainer,
          eventEmitter: this.events,
          getSortState: () => this.state.sortState,
          getFilterState: () => this.state.filterState,
          headerHeight: 40,
          enableScrollSync: true,
        });
        this.headerManager.initialize();

        this.resizeOps.setHeaderManager(this.headerManager);

        this.events.on('header:sort:click', (event) => {
          this.toggleSort(event.columnIndex);
        });
      }
    }

    // Initialize editing module
    this.editingOps = new GridEditing(
      this.container,
      this.scrollContainer,
      this.options,
      this.state,
      this.events,
      {
        getValue: (row: number, col: number) => {
          return this.dataOps.dataAccessor?.getValue(row, col);
        },
        setValue: (row: number, col: number, value: any) => {
          if (this.state.data && this.state.data[row]) {
            this.state.data[row][col] = value;
          }
        },
        getColumn: (col: number) => {
          return this.options.columns?.[col];
        },
        getCellElement: (row: number, col: number) => {
          const cellsContainer = this.canvas?.querySelector('.zg-cells') as HTMLElement;
          if (!cellsContainer) return null;
          return cellsContainer.querySelector(`.zg-cell[data-row="${row}"][data-col="${col}"]`) as HTMLElement;
        },
        getPositioner: () => this.init.positioner,
      }
    );
    this.editingOps.initialize();

    // Initialize infinite scrolling module
    this.infiniteScrollOps = new GridInfiniteScroll(
      this.options,
      this.state,
      this.viewportModel,
      {
        setData: (data: any[][]) => this.setData(data),
        refresh: () => this.refresh(),
        getScroller: () => this.init.scroller,
        getDOM: () => this.dom,
      }
    );
  }

  /**
   * Set grid data
   */
  setData(data: any[][]): void {
    this.dataOps.setData(data);

    if (this.infiniteScrollOps) {
      this.infiniteScrollOps.initializeRowCount(data.length);
    }

    this.sortOps.initializeSortManager(data.length, this.dataOps.dataAccessor);

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

    if (!this.init.scroller || !this.init.pool || !this.init.positioner) {
      this.init.initializeComponents();
      this.scrollOps.updateReferences(this.init.scroller, this.init.positioner, this.dataOps.dataAccessor);
      this.resizeOps.updateScroller(this.init.scroller);

      if (this.init.scroller) {
        this.init.scroller.setReactiveModels(this.scrollModel, this.viewportModel);
      }

      if (this.init.positioner) {
        this.init.positioner.subscribeToViewport(this.viewportModel);
      }

      if (this.infiniteScrollOps) {
        this.infiniteScrollOps.setup();
      }

      if (this.options.columnResize) {
        this.resizeOps.initializeColumnResize();
      }

      if (this.options.enableColumnDrag !== false && this.columnModel) {
        this.dragOps.initializeColumnDrag();
      }
    }

    if (!this.init.scroller || !this.init.pool || !this.init.positioner) {
      throw new Error('Grid initialization failed. Viewport may have no dimensions.');
    }

    this.dom.updateCanvasSize(this.init.scroller.getTotalWidth(), this.init.scroller.getTotalHeight());

    if (this.headerManager) {
      this.headerManager.renderHeaders();

      if (this.options.columnResize) {
        const headerContainer = this.headerManager.getHeaderCellsContainer();
        if (headerContainer) {
          this.resizeOps.attachColumnResize(headerContainer);
        }
      }

      if (this.options.enableColumnDrag !== false && this.columnModel) {
        const headerContainer = this.headerManager.getHeaderCellsContainer();
        if (headerContainer) {
          this.dragOps.attachColumnDrag(headerContainer);
        }
      }
    }

    this.init.positioner.renderVisibleCells(
      this.state.scrollPosition.top,
      this.state.scrollPosition.left
    );

    // Auto-fit columns on load if enabled
    if (this.options.columnResize?.autoFitOnLoad) {
      this.resizeOps.autoFitAllColumns();
    }
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
   * Scroll through multiple cells sequentially with smooth animation
   */
  scrollThroughCells(
    cells: Array<{ row: number; col: number }>,
    options?: {
      delayMs?: number;
      smooth?: boolean;
      onCellReached?: (cell: { row: number; col: number }, index: number) => void;
    }
  ): { promise: Promise<void>; abort: () => void } {
    return this.scrollOps.scrollThroughCells(cells, options);
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
    return false;
  }

  // Column drag operations
  attachColumnDrag(headerElement: HTMLElement): void {
    this.dragOps.attachColumnDrag(headerElement);
  }

  detachColumnDrag(): void {
    this.dragOps.detachColumnDrag();
  }

  isDragging(): boolean {
    return this.dragOps.isDragging();
  }

  // Event subscriptions
  on<K extends keyof GridEvents>(event: K, handler: (payload: GridEvents[K]) => void): void {
    this.events.on(event, handler);
  }

  off<K extends keyof GridEvents>(event: K, handler: (payload: GridEvents[K]) => void): void {
    this.events.off(event, handler);
  }

  /**
   * Register a custom header renderer
   */
  registerHeaderRenderer(name: string, renderer: HeaderRenderer): void {
    if (!this.headerManager) {
      throw new Error('Header manager not initialized. Columns must be defined.');
    }
    this.headerManager.registerRenderer(name, renderer);
  }

  /**
   * Update a specific header cell
   */
  updateHeader(columnIndex: number): void {
    if (this.headerManager) {
      this.headerManager.updateHeader(columnIndex);
    }
  }

  /**
   * Update all header cells
   */
  updateAllHeaders(): void {
    if (this.headerManager) {
      this.headerManager.updateAllHeaders();
    }
  }

  /**
   * Refresh headers (destroy and re-render)
   */
  refreshHeaders(): void {
    if (this.headerManager) {
      this.headerManager.refreshHeaders();
    }
  }

  /**
   * Reset infinite scrolling state
   */
  resetInfiniteScrolling(): void {
    if (this.infiniteScrollOps) {
      this.infiniteScrollOps.reset();
    }
  }

  /**
   * Get sliding window statistics
   */
  getSlidingWindowStats(): {
    virtualOffset: number;
    rowsInMemory: number;
    totalRowsLoaded: number;
    prunedRows: number;
  } {
    if (this.infiniteScrollOps) {
      return this.infiniteScrollOps.getStats();
    }
    return {
      virtualOffset: 0,
      rowsInMemory: this.state.data.length,
      totalRowsLoaded: 0,
      prunedRows: 0,
    };
  }

  /**
   * Destroy the grid and clean up resources
   */
  destroy(): void {
    if (this.isDestroyed) return;

    if (this.infiniteScrollOps) {
      this.infiniteScrollOps.cleanup();
    }

    this.scrollOps.destroy();

    if (this.scrollContainer) {
      this.scrollContainer.removeEventListener('scroll', this.scrollOps.handleScroll);
    }

    if (this.init.positioner) {
      this.init.positioner.destroy();
    }

    if (this.init.pool) {
      this.init.pool.clear();
    }

    this.resizeOps.detachColumnResize();

    this.dragOps.detachColumnDrag();
    this.dragOps.destroy();

    if (this.headerManager) {
      this.headerManager.cleanup();
      this.headerManager = null;
    }

    if (this.editingOps) {
      this.editingOps.cleanup();
      this.editingOps = null;
    }

    this.container.innerHTML = '';
    this.container.classList.remove('zg-grid');

    this.canvas = null;
    this.scrollContainer = null;

    this.state.data = [];
    this.state.selection = [];

    this.isDestroyed = true;
  }
}
