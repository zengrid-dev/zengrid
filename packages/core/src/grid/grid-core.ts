import type {
  GridOptions,
  GridState,
  CellRef,
  VisibleRange,
  ColumnStateSnapshot,
  GridStateSnapshot,
  SortState,
  GridExportOptions,
  FilterModel,
} from '../types';
import { EventEmitter } from '../events/event-emitter';
import type { GridEvents } from '../events/grid-events';
import type { ColumnConstraints } from '../features/column-resize';
import { SpatialHitTester } from '../rendering/spatial-hit-tester';
import { FilterAutocomplete } from '../features/filtering/filter-autocomplete';
import { FilterOptimizer } from '../features/filtering/filter-optimizer';
import { SubstringFilter } from '../features/filtering/substring-filter';
import { FormulaCalculator } from '../features/formulas/formula-calculator';
import { AutofillManager } from '../features/autofill/autofill-manager';
import { CSVExporter } from '../features/export';

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
import { GridSelection } from './selection';
import { GridFilterUI } from './filter-ui';
import type { HeaderRenderer } from '../rendering/headers/header-renderer.interface';
import { ColumnModel } from '../features/columns/column-model';
import { ColumnVisibilityPlugin } from '../features/columns/plugins/column-visibility';
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
  private selectionOps: GridSelection | null = null;
  private filterUI: GridFilterUI | null = null;

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
          if (this.init.scroller) {
            this.init.scroller.setRowCount(rowCount);
            this.dom.updateCanvasSize(
              this.init.scroller.getTotalWidth(),
              this.init.scroller.getTotalHeight()
            );
          }
          if (this.init.positioner) {
            this.init.positioner.refresh();
          }
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
          if (event.type === 'width' || event.type === 'reorder' || event.type === 'visibility') {
            if (event.type === 'visibility' && this.init.scroller) {
              const visibleCount = this.columnModel?.getVisibleCount() ?? this.options.colCount;
              this.scrollOps.updateVisibleColumnCount(visibleCount);
            }

            if (this.init.scroller) {
              this.dom.updateCanvasSize(
                this.init.scroller.getTotalWidth(),
                this.init.scroller.getTotalHeight()
              );
            }

            if (this.init.positioner) {
              this.init.positioner.refresh();
            }

            if (event.type === 'reorder' || event.type === 'visibility') {
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
          let dataCol = event.columnIndex;
          if (this.columnModel) {
            const orderedColumns = this.columnModel.getVisibleColumnsInOrder();
            if (orderedColumns[event.columnIndex]) {
              dataCol = orderedColumns[event.columnIndex].dataIndex;
            }
          }
          this.toggleSort(dataCol);
        });

        this.events.on('header:checkbox:change', (event) => {
          if (!this.selectionOps) return;
          if (event.action === 'select-all') {
            this.selectionOps.selectAllRows(this.options.rowCount);
          } else {
            this.selectionOps.clearSelection();
          }
        });

        this.filterUI = new GridFilterUI({
          container: this.container,
          events: this.events,
          getFilterState: () => this.state.filterState,
          setColumnFilter: (column, conditions, logic) =>
            this.filterOps.setColumnFilter(column, conditions, logic ?? 'AND'),
          clearColumnFilter: (column) => this.filterOps.clearColumnFilter(column),
          getColumnDef: (dataCol) => this.options.columns?.[dataCol],
          mapVisualToDataCol: (visualCol) => {
            if (this.columnModel) {
              const orderedColumns = this.columnModel.getVisibleColumnsInOrder();
              if (orderedColumns[visualCol]) {
                return orderedColumns[visualCol].dataIndex;
              }
            }
            return visualCol;
          },
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
          let dataCol = col;
          if (this.columnModel) {
            const orderedColumns = this.columnModel.getVisibleColumnsInOrder();
            if (orderedColumns[col]) {
              dataCol = orderedColumns[col].dataIndex;
            }
          }
          return this.dataOps.dataAccessor?.getValue(row, dataCol);
        },
        setValue: (row: number, col: number, value: any) => {
          let dataCol = col;
          if (this.columnModel) {
            const orderedColumns = this.columnModel.getVisibleColumnsInOrder();
            if (orderedColumns[col]) {
              dataCol = orderedColumns[col].dataIndex;
            }
          }
          if (this.state.data && this.state.data[row]) {
            this.state.data[row][dataCol] = value;
          }
        },
        getColumn: (col: number) => {
          if (this.columnModel) {
            const orderedColumns = this.columnModel.getVisibleColumnsInOrder();
            if (orderedColumns[col]) {
              return orderedColumns[col].definition;
            }
          }
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

    // Initialize selection module
    this.selectionOps = new GridSelection(
      this.container,
      this.options,
      this.state,
      this.events,
      this.scrollContainer,
      {
        onRefresh: () => this.refresh(),
        getValue: (row: number, col: number) => {
          return this.dataOps.dataAccessor?.getValue(row, col);
        },
        mapRowToDataIndex: (row: number) => {
          const mapping = this.getVisibleRowMapping();
          if (mapping) return mapping[row];
          return row;
        },
      }
    );
    this.selectionOps.initialize();

    this.events.on('filter:afterFilter', () => {
      if (this.selectionOps && this.state.selection.length > 0) {
        this.selectionOps.clearSelection();
      }
    });

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

    // Initialize filter manager and update accessor
    this.filterOps.updateDataAccessor(this.dataOps.dataAccessor);
    this.filterOps.initializeFilterManager(this.options.colCount);
    this.filterOps.reapplyFilters();

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

  setSortState(sortState: SortState[]): void {
    this.sortOps.setSortState(sortState);
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

  setFilterState(models: FilterModel[]): void {
    this.filterOps.setFilterState(models);
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

  clearColumnFilter(column: number): void {
    this.filterOps.clearColumnFilter(column);
  }

  // Quick filter (global search)
  setQuickFilter(query: string, columns?: number[]): void {
    this.filterOps.setQuickFilter(query, columns);
  }

  clearQuickFilter(): void {
    this.filterOps.clearQuickFilter();
  }

  getQuickFilter(): { query: string; columns: number[] | null } {
    return this.filterOps.getQuickFilter();
  }

  // Data operations
  getDataMode(): 'frontend' | 'backend' {
    return this.dataOps.getDataMode();
  }

  getData(row: number, col: number): any {
    return this.dataOps.getData(row, col);
  }

  // Export operations
  exportCSV(options: GridExportOptions = {}): string {
    return this.exportDelimited(',', options);
  }

  exportTSV(options: GridExportOptions = {}): string {
    return this.exportDelimited('\t', options);
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

  // =========================
  // State Persistence
  // =========================

  /**
   * Get current column state snapshot
   */
  getColumnState(): ColumnStateSnapshot[] {
    if (!this.columnModel) return [];

    return this.columnModel.getColumns().map(col => ({
      id: col.id,
      field: col.field,
      width: col.width,
      visible: col.visible,
      order: col.order,
    }));
  }

  /**
   * Apply column state snapshot
   */
  applyColumnState(
    state: ColumnStateSnapshot[],
    options?: {
      applyWidth?: boolean;
      applyVisibility?: boolean;
      applyOrder?: boolean;
    }
  ): void {
    if (!this.columnModel || !state || state.length === 0) return;

    const applyWidth = options?.applyWidth !== false;
    const applyVisibility = options?.applyVisibility !== false;
    const applyOrder = options?.applyOrder !== false;

    const byId = new Map<string, ColumnStateSnapshot>();
    const byField = new Map<string, ColumnStateSnapshot>();

    state.forEach((snapshot) => {
      if (snapshot.id) {
        byId.set(snapshot.id, snapshot);
      }
      if (snapshot.field) {
        byField.set(snapshot.field, snapshot);
      }
    });

    const visibility = new ColumnVisibilityPlugin(this.columnModel);

    this.columnModel.batchUpdate(() => {
      for (const col of this.columnModel!.getColumns()) {
        const snapshot = byId.get(col.id) ?? (col.field ? byField.get(col.field) : undefined);
        if (!snapshot) continue;

        if (applyWidth && snapshot.width !== undefined) {
          this.columnModel!.setWidth(col.id, snapshot.width);
        }

        if (applyVisibility && snapshot.visible !== undefined) {
          if (snapshot.visible) {
            visibility.show(col.id);
          } else {
            visibility.hide(col.id);
          }
        }

        if (applyOrder && snapshot.order !== undefined) {
          const current = this.columnModel!.getColumn(col.id);
          if (current && current.order !== snapshot.order) {
            this.columnModel!.updateState(col.id, { order: snapshot.order }, {
              type: 'reorder',
              columnId: col.id,
              oldValue: current.order,
              newValue: snapshot.order,
              state: { ...current, order: snapshot.order },
            });
          }
        }
      }
    });
  }

  /**
   * Get full grid state snapshot (columns + sort + filters)
   */
  getStateSnapshot(): GridStateSnapshot {
    return {
      columns: this.getColumnState(),
      sortState: this.getSortState(),
      filterState: this.getFilterState(),
    };
  }

  /**
   * Apply full grid state snapshot
   */
  applyStateSnapshot(snapshot: GridStateSnapshot): void {
    if (!snapshot) return;

    if (snapshot.columns && snapshot.columns.length > 0) {
      this.applyColumnState(snapshot.columns);
    }

    if (snapshot.sortState) {
      this.setSortState(snapshot.sortState);
    }

    if (snapshot.filterState) {
      this.filterOps.setFilterState(snapshot.filterState);
    }
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

  // =========================
  // Export Helpers
  // =========================

  private exportDelimited(delimiter: string, options: GridExportOptions): string {
    if (!this.dataOps.dataAccessor) return '';

    const rows = this.resolveExportRows(options.rows);
    const { columns, headers } = this.resolveExportColumns(options.columns);

    const exporter = new CSVExporter({
      getValue: (row: number, col: number) => this.dataOps.dataAccessor!.getValue(row, col),
      rowCount: this.options.rowCount,
      colCount: this.options.colCount,
      getColumnHeader: (col: number) => this.getColumnHeader(col),
    });

    return exporter.export({
      rows,
      columns,
      headers,
      includeHeaders: options.includeHeaders ?? true,
      delimiter,
    });
  }

  private resolveExportRows(
    rows: GridExportOptions['rows']
  ): number[] {
    if (Array.isArray(rows)) {
      return rows;
    }

    if (rows === 'filtered') {
      return this.getVisibleRowMapping() ?? this.range(0, this.options.rowCount - 1);
    }

    if (rows === 'selected') {
      const selected = new Set<number>();
      const rowMap = this.getVisibleRowMapping();
      for (const range of this.state.selection) {
        for (let row = range.startRow; row <= range.endRow; row++) {
          const mappedRow = rowMap ? rowMap[row] : row;
          if (mappedRow !== undefined) {
            selected.add(mappedRow);
          }
        }
      }
      return Array.from(selected).sort((a, b) => a - b);
    }

    return this.range(0, this.options.rowCount - 1);
  }

  private getVisibleRowMapping(): number[] | null {
    const indexMap = this.sortOps.getSortManager()?.getIndexMap() ?? null;
    const visibleRows = this.filterOps.cachedVisibleRows ?? null;

    if (indexMap && visibleRows) {
      const visibleSet = new Set<number>(visibleRows);
      return indexMap.indices.filter(index => visibleSet.has(index));
    }

    if (indexMap) {
      return Array.from(indexMap.indices);
    }

    if (visibleRows) {
      return visibleRows;
    }

    return null;
  }

  private resolveExportColumns(
    columns: GridExportOptions['columns']
  ): { columns: number[]; headers?: string[] } {
    if (Array.isArray(columns)) {
      return { columns };
    }

    if (columns === 'visible' && this.columnModel) {
      const visible = this.columnModel.getVisibleColumnsInOrder();
      return {
        columns: visible.map(col => col.dataIndex),
        headers: visible.map(col => this.getColumnHeader(col.dataIndex)),
      };
    }

    return {
      columns: this.range(0, this.options.colCount - 1),
    };
  }

  private getColumnHeader(col: number): string {
    const column = this.options.columns?.[col];
    if (!column) return `Column ${col}`;

    if (typeof column.header === 'string') {
      return column.header;
    }

    return column.header?.text ?? column.field ?? `Column ${col}`;
  }

  private range(start: number, end: number): number[] {
    if (end < start) return [];
    const out: number[] = [];
    for (let i = start; i <= end; i++) {
      out.push(i);
    }
    return out;
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

    if (this.selectionOps) {
      this.selectionOps.destroy();
      this.selectionOps = null;
    }

    if (this.filterUI) {
      this.filterUI.destroy();
      this.filterUI = null;
    }

    this.resizeOps.destroy();

    this.container.innerHTML = '';
    this.container.classList.remove('zg-grid');

    this.canvas = null;
    this.scrollContainer = null;

    this.state.data = [];
    this.state.selection = [];

    this.isDestroyed = true;
  }
}
