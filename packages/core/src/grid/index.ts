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
import { GridDrag } from './drag';
import { GridInit } from './init';
import { HeaderManager } from './header-manager';
import type { HeaderRenderer } from '../rendering/headers/header-renderer.interface';
import { ColumnModel } from '../features/columns/column-model';
import { ScrollModel } from '../features/viewport/scroll-model';
import { ViewportModel } from '../features/viewport/viewport-model';
import type { ViewportEvent } from '../features/viewport/types';

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

  // Reactive viewport models
  private scrollModel: ScrollModel;
  private viewportModel: ViewportModel;
  private viewportSubscription: (() => void) | null = null;

  // Infinite scrolling state
  private isLoadingMoreRows = false;
  private hasMoreRows = true;

  // Sliding window state (memory management)
  private virtualRowOffset = 0; // Number of rows pruned from the beginning
  private actualRowCount = 0;   // Total rows loaded (including pruned ones)

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
        getSortManager: () => this.sortOps.getSortManager(),
        getCachedVisibleRows: () => this.filterOps.cachedVisibleRows,
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
      // Create reactive column model
      this.columnModel = new ColumnModel(this.options.columns);

      // Pass column model to resize operations for reactive updates
      this.resizeOps.setColumnModel(this.columnModel);

      // Pass column model to drag operations
      this.dragOps.setColumnModel(this.columnModel);

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
          scrollSyncThrottle: 16,
        });
        this.headerManager.initialize();

        // Connect header sort clicks to grid sort functionality
        this.events.on('header:sort:click', (event) => {
          this.toggleSort(event.columnIndex);
        });
      }
    }
  }

  /**
   * Set grid data
   * @param data - 2D array of cell values
   */
  setData(data: any[][]): void {
    this.dataOps.setData(data);

    // Initialize actualRowCount if this is the first data load for infinite scrolling
    if (this.options.infiniteScrolling?.enabled && this.actualRowCount === 0) {
      this.actualRowCount = data.length;
    }

    // Initialize sort manager after data is set - PASS the dataAccessor!
    this.sortOps.initializeSortManager(data.length, this.dataOps.dataAccessor);

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

      // Connect reactive viewport models to VirtualScroller
      if (this.init.scroller) {
        this.init.scroller.setReactiveModels(this.scrollModel, this.viewportModel);
      }

      // Subscribe CellPositioner to ViewportModel for reactive rendering
      if (this.init.positioner) {
        this.init.positioner.subscribeToViewport(this.viewportModel);
      }

      // Setup infinite scrolling if enabled
      this.setupInfiniteScrolling();

      // Initialize column resize if configured
      if (this.options.columnResize && this.headerContainer) {
        this.resizeOps.initializeColumnResize();
        this.resizeOps.attachColumnResize(this.headerContainer);
      }

      // Initialize column drag if configured
      if (this.options.enableColumnDrag !== false && this.headerContainer && this.columnModel) {
        this.dragOps.initializeColumnDrag();
        this.dragOps.attachColumnDrag(this.headerContainer);
      }
    }

    // Check again after initialization attempt
    if (!this.init.scroller || !this.init.pool || !this.init.positioner) {
      throw new Error('Grid initialization failed. Viewport may have no dimensions.');
    }

    // Update canvas size
    this.dom.updateCanvasSize(this.init.scroller.getTotalWidth(), this.init.scroller.getTotalHeight());

    // Render headers if header manager is initialized
    if (this.headerManager) {
      this.headerManager.renderHeaders();

      // Attach column resize to the header managed by HeaderManager
      if (this.options.columnResize) {
        const headerContainer = this.headerManager.getHeaderCellsContainer();
        if (headerContainer) {
          this.resizeOps.attachColumnResize(headerContainer);
        }
      }

      // Attach column drag to the header managed by HeaderManager
      if (this.options.enableColumnDrag !== false && this.columnModel) {
        const headerContainer = this.headerManager.getHeaderCellsContainer();
        if (headerContainer) {
          this.dragOps.attachColumnDrag(headerContainer);
        }
      }
    }

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
   *
   * @param name - Unique name for the renderer
   * @param renderer - HeaderRenderer instance
   *
   * @example
   * ```typescript
   * grid.registerHeaderRenderer('myCustomHeader', new MyCustomHeaderRenderer());
   * ```
   */
  registerHeaderRenderer(name: string, renderer: HeaderRenderer): void {
    if (!this.headerManager) {
      throw new Error('Header manager not initialized. Columns must be defined.');
    }
    this.headerManager.registerRenderer(name, renderer);
  }

  /**
   * Update a specific header cell
   *
   * @param columnIndex - Index of the column to update
   */
  updateHeader(columnIndex: number): void {
    if (this.headerManager) {
      this.headerManager.updateHeader(columnIndex);
    }
  }

  /**
   * Update all header cells
   *
   * Call this after changing sort/filter state or column configurations.
   */
  updateAllHeaders(): void {
    if (this.headerManager) {
      this.headerManager.updateAllHeaders();
    }
  }

  /**
   * Refresh headers (destroy and re-render)
   *
   * Use this when columns configuration has changed.
   */
  refreshHeaders(): void {
    if (this.headerManager) {
      this.headerManager.refreshHeaders();
    }
  }

  /**
   * Setup infinite scrolling subscription
   * @private
   */
  private setupInfiniteScrolling(): void {
    const infiniteScrollConfig = this.options.infiniteScrolling;
    if (!infiniteScrollConfig?.enabled || !this.options.onLoadMoreRows) {
      return;
    }

    const threshold = infiniteScrollConfig.threshold ?? 20;

    // Subscribe to viewport changes
    this.viewportSubscription = this.viewportModel.subscribe({
      onChange: (event: ViewportEvent) => {
        this.handleViewportChangeForInfiniteScroll(event, threshold);
      },
    });
  }

  /**
   * Handle viewport change for infinite scrolling
   * @private
   */
  private handleViewportChangeForInfiniteScroll(event: ViewportEvent, threshold: number): void {
    // Only trigger on row changes or range changes
    if (event.type !== 'rows' && event.type !== 'range') {
      return;
    }

    const { newRange } = event;
    const totalRows = this.options.rowCount;

    // Check if we're approaching the bottom
    const isNearBottom = newRange.endRow >= totalRows - threshold;

    if (isNearBottom && !this.isLoadingMoreRows && this.hasMoreRows && this.options.onLoadMoreRows) {
      this.loadMoreRows();
    }
  }

  /**
   * Load more rows for infinite scrolling
   * @private
   */
  private async loadMoreRows(): Promise<void> {
    if (!this.options.onLoadMoreRows || this.isLoadingMoreRows) {
      return;
    }

    this.isLoadingMoreRows = true;

    try {
      const currentRowCount = this.options.rowCount;
      const newRows = await this.options.onLoadMoreRows(currentRowCount);

      if (!newRows || newRows.length === 0) {
        // No more data to load
        this.hasMoreRows = false;
        return;
      }

      // Append new rows to existing data
      const currentData = this.state.data;
      let updatedData = [...currentData, ...newRows];

      // Track actual total rows loaded (including pruned rows)
      this.actualRowCount += newRows.length;

      // Sliding Window: Prune old rows if enabled
      const slidingWindowConfig = this.options.infiniteScrolling;
      if (slidingWindowConfig?.enableSlidingWindow) {
        const windowSize = slidingWindowConfig.windowSize ?? 1000;
        const pruneThreshold = slidingWindowConfig.pruneThreshold ?? (windowSize + 200);

        if (updatedData.length > pruneThreshold) {
          // Calculate how many rows to remove
          const rowsToRemove = updatedData.length - windowSize;

          // Remove old rows from the beginning
          const prunedData = updatedData.slice(rowsToRemove);

          // Update virtual offset (how many rows we've removed)
          this.virtualRowOffset += rowsToRemove;

          console.log(`🗑️  Sliding Window: Pruned ${rowsToRemove} old rows from memory`);
          console.log(`   Virtual offset: ${this.virtualRowOffset}`);
          console.log(`   Memory rows: ${prunedData.length} (was ${updatedData.length})`);
          console.log(`   Actual total: ${this.actualRowCount} rows loaded so far`);

          // Notify user if callback provided
          if (slidingWindowConfig.onDataPruned) {
            slidingWindowConfig.onDataPruned(rowsToRemove, this.virtualRowOffset);
          }

          updatedData = prunedData;
        }
      }

      // Update row count
      this.options.rowCount = updatedData.length;

      // Update grid data
      this.setData(updatedData);

      // CRITICAL: Update scroller's row count for infinite scrolling
      if (this.init.scroller) {
        this.init.scroller.setRowCount(updatedData.length);
        console.log(`📊 Updated scroller row count to ${updatedData.length}`);
      }

      // Update canvas size to accommodate new rows
      if (this.init.scroller && this.canvas) {
        this.dom.updateCanvasSize(
          this.init.scroller.getTotalWidth(),
          this.init.scroller.getTotalHeight()
        );
      }

      // Refresh the viewport to show new data
      this.refresh();

      if (slidingWindowConfig?.enableSlidingWindow) {
        console.log(`✅ Infinite scroll: appended ${newRows.length} rows, memory: ${updatedData.length}, total loaded: ${this.actualRowCount}`);
      } else {
        console.log(`✅ Infinite scroll: appended ${newRows.length} rows, total now: ${updatedData.length}`);
      }
    } catch (error) {
      console.error('Error loading more rows:', error);
      this.hasMoreRows = false;
    } finally {
      this.isLoadingMoreRows = false;
    }
  }

  /**
   * Reset infinite scrolling state
   * Call this when you want to restart infinite scrolling from the beginning
   */
  resetInfiniteScrolling(): void {
    this.isLoadingMoreRows = false;
    this.hasMoreRows = true;
    this.virtualRowOffset = 0;
    this.actualRowCount = 0;
  }

  /**
   * Get sliding window statistics
   * Useful for debugging and monitoring memory usage
   */
  getSlidingWindowStats(): {
    virtualOffset: number;
    rowsInMemory: number;
    totalRowsLoaded: number;
    prunedRows: number;
  } {
    return {
      virtualOffset: this.virtualRowOffset,
      rowsInMemory: this.state.data.length,
      totalRowsLoaded: this.actualRowCount,
      prunedRows: this.virtualRowOffset,
    };
  }

  /**
   * Destroy the grid and clean up resources
   */
  destroy(): void {
    if (this.isDestroyed) return;

    // Unsubscribe from viewport changes (infinite scrolling)
    if (this.viewportSubscription) {
      this.viewportSubscription();
      this.viewportSubscription = null;
    }

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

    // Detach and destroy column drag
    this.dragOps.detachColumnDrag();
    this.dragOps.destroy();

    // Cleanup header manager
    if (this.headerManager) {
      this.headerManager.cleanup();
      this.headerManager = null;
    }

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
