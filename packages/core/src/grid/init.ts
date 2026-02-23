import type { GridOptions, GridState } from '../types';
import type { EventEmitter } from '../events/event-emitter';
import type { GridEvents } from '../events/grid-events';
import { VirtualScroller } from '../rendering/virtual-scroller/virtual-scroller';
import { CellPool } from '../rendering/cell-pool/cell-pool';
import { CellPositioner } from '../rendering/cell-positioner/cell-positioner';
import { RendererRegistry } from '../rendering/renderers/renderer-registry';
import { RendererCache } from '../rendering/cache';
import { NumberRenderer } from '../rendering/renderers/number';
import { ImageRenderer } from '../rendering/renderers/image';
import { AdvancedCellRenderer } from '../rendering/renderers/advanced-cell';
import { CheckboxRenderer } from '../rendering/renderers/checkbox';
import { ProgressBarRenderer } from '../rendering/renderers/progress-bar';
import { LinkRenderer } from '../rendering/renderers/link';
import { ButtonRenderer } from '../rendering/renderers/button';
import { DateRenderer } from '../rendering/renderers/date';
import { SelectRenderer } from '../rendering/renderers/select';
import { ChipRenderer } from '../rendering/renderers/chip';
import { DropdownRenderer } from '../rendering/renderers/dropdown';
import { LoadingIndicator } from '../features/loading';
import type { DataAccessor } from '../data/data-accessor/data-accessor.interface';
import { RowHeightManager } from '../features/row-height';
import { SegmentTreeHeightProvider } from '../rendering/height-provider/segment-tree-height-provider';
import { ColumnModelWidthProvider } from '../rendering/width-provider/column-model-width-provider';

/**
 * GridInit - Handles component initialization and validation
 */
export class GridInit {
  private options: GridOptions;
  private state: GridState;
  private events: EventEmitter<GridEvents>;
  private scrollContainer: HTMLElement | null;
  private canvas: HTMLElement | null;
  private container: HTMLElement;

  public registry: RendererRegistry;
  public cache: RendererCache | null = null;
  public loadingIndicator: LoadingIndicator | null = null;
  public rowHeightManager: RowHeightManager | null = null;
  public scroller: VirtualScroller | null = null;
  public pool: CellPool | null = null;
  public positioner: CellPositioner | null = null;

  // Callbacks
  private getViewIndices: () => number[] | undefined;
  private getDataAccessor: () => DataAccessor | null;
  private getColumnModel: () => any;
  private mapRowToDataIndex: (row: number) => number | undefined;

  constructor(
    container: HTMLElement,
    options: GridOptions,
    state: GridState,
    events: EventEmitter<GridEvents>,
    scrollContainer: HTMLElement | null,
    canvas: HTMLElement | null,
    callbacks: {
      getViewIndices: () => number[] | undefined;
      getDataAccessor: () => DataAccessor | null;
      getColumnModel: () => any;
    }
  ) {
    this.container = container;
    this.options = options;
    this.state = state;
    this.events = events;
    this.scrollContainer = scrollContainer;
    this.canvas = canvas;
    this.getViewIndices = callbacks.getViewIndices;
    this.getDataAccessor = callbacks.getDataAccessor;
    this.getColumnModel = callbacks.getColumnModel;
    this.mapRowToDataIndex = this.createRowMapper();

    // Initialize renderer registry
    this.registry = new RendererRegistry();

    // Register built-in renderers
    this.registry.register('number', new NumberRenderer());
    this.registry.register('image', new ImageRenderer());
    this.registry.register('advanced', new AdvancedCellRenderer({ elements: [] }));

    // Register interactive renderers
    this.registry.register('checkbox', new CheckboxRenderer());
    this.registry.register('progress', new ProgressBarRenderer());
    this.registry.register('link', new LinkRenderer());
    this.registry.register('button', new ButtonRenderer());
    this.registry.register('date', new DateRenderer());
    this.registry.register('select', new SelectRenderer({ options: [{ value: '', label: '' }] }));
    this.registry.register('chip', new ChipRenderer());
    this.registry.register(
      'dropdown',
      new DropdownRenderer({ options: [{ value: '', label: '' }] })
    );

    // Initialize renderer cache
    if (this.options.rendererCache?.enabled !== false) {
      this.cache = new RendererCache(this.options.rendererCache);
    }

    // Initialize loading indicator
    if (this.options.loading?.enabled !== false) {
      this.loadingIndicator = new LoadingIndicator(this.options.loading);
    }
  }

  /**
   * Set up loading event listeners
   */
  setupLoadingListeners(): void {
    this.events.on('loading:start', (event) => {
      if (this.loadingIndicator && this.container) {
        this.loadingIndicator.show(this.container, {
          isLoading: true,
          message: event.message,
        });
      }
    });

    this.events.on('loading:end', () => {
      if (this.loadingIndicator) {
        this.loadingIndicator.hide();
      }
    });

    this.events.on('loading:progress', (event) => {
      if (this.loadingIndicator) {
        this.loadingIndicator.update({
          isLoading: true,
          progress: event.progress,
          message: event.message,
        });
      }
    });
  }

  /**
   * Initialize core components (VirtualScroller, CellPool, CellPositioner)
   */
  initializeComponents(): void {
    if (!this.scrollContainer || !this.canvas) return;

    const viewportWidth = this.scrollContainer.clientWidth;
    const viewportHeight = this.scrollContainer.clientHeight;

    // Initialize row height system if needed
    const rowHeightMode = this.options.rowHeightMode ?? 'fixed';
    let heightProvider;

    if (rowHeightMode !== 'fixed') {
      // Use SegmentTreeHeightProvider for dynamic heights
      const defaultHeight = Array.isArray(this.options.rowHeight)
        ? this.options.rowHeight[0]
        : this.options.rowHeight;

      heightProvider = new SegmentTreeHeightProvider(this.options.rowCount, defaultHeight);

      // Initialize RowHeightManager
      this.rowHeightManager = new RowHeightManager({
        mode: rowHeightMode,
        config: {
          defaultHeight,
          minHeight: this.options.rowHeightConfig?.minHeight,
          maxHeight: this.options.rowHeightConfig?.maxHeight,
          heightAffectingColumns: this.options.rowHeightConfig?.heightAffectingColumns,
          measureTiming: this.options.rowHeightConfig?.measureTiming,
          measureBatchSize: this.options.rowHeightConfig?.measureBatchSize,
          debounceMs: this.options.rowHeightConfig?.debounceMs,
          cacheHeights: this.options.rowHeightConfig?.cacheHeights,
        },
        heightProvider,
        columns: this.options.columns ?? [],
        onHeightUpdate: (_updates) => {
          // Update canvas height when row heights change
          if (this.canvas && this.scroller) {
            const newTotalHeight = this.scroller.getTotalHeight();
            this.canvas.style.height = `${newTotalHeight}px`;
          }

          // CellPositioner now handles re-positioning internally via RAF
          // No need for manual invalidation or re-rendering
        },
      });
    }

    // Use ColumnModelWidthProvider adapter when ColumnModel exists (single source of truth).
    // Otherwise fall back to options.colWidth for legacy mode.
    const columnModel = this.getColumnModel();
    const widthProvider = columnModel ? new ColumnModelWidthProvider(columnModel) : undefined;

    const visibleColCount = columnModel ? columnModel.getVisibleCount() : this.options.colCount;

    // Initialize VirtualScroller
    this.scroller = new VirtualScroller({
      rowCount: this.options.rowCount,
      colCount: visibleColCount,
      rowHeight: this.options.rowHeight,
      colWidth: this.options.colWidth,
      widthProvider, // Adapter reads from ColumnModel; undefined falls back to colWidth
      viewportWidth,
      viewportHeight,
      heightProvider, // Pass dynamic height provider if available
      // Increased defaults to prevent blank areas during fast scrolling
      overscanRows: this.options.overscanRows ?? 10,
      overscanCols: this.options.overscanCols ?? 5,
    });

    // Update canvas size
    this.canvas.style.width = `${this.scroller.getTotalWidth()}px`;
    this.canvas.style.height = `${this.scroller.getTotalHeight()}px`;

    // Initialize CellPool
    const cellsContainer = this.canvas.querySelector('.zg-cells') as HTMLElement;
    this.pool = new CellPool({
      container: cellsContainer,
      initialSize: 100,
      maxSize: 500,
    });

    // Initialize CellPositioner
    this.positioner = new CellPositioner({
      scroller: this.scroller,
      pool: this.pool,
      registry: this.registry,
      cache: this.cache ?? undefined,
      rowHeightManager: this.rowHeightManager ?? undefined,
      getData: (row: number, col: number) => {
        const mappedRow = this.mapRowToDataIndex(row);
        if (mappedRow === undefined || mappedRow < 0) return undefined;

        // Map visual column index to data column index
        // When columns are reordered, col is the visual position, not the data position
        const columnModel = this.getColumnModel();
        let dataCol = col;
        if (columnModel) {
          const orderedColumns = columnModel.getVisibleColumnsInOrder();
          if (orderedColumns && orderedColumns[col]) {
            // Use stable dataIndex instead of parsing column ID
            dataCol = orderedColumns[col].dataIndex;
          }
        }

        return this.getDataAccessor()?.getValue(mappedRow, dataCol);
      },
      getColumn: (col: number) => {
        // Map visual column index to column definition
        // When columns are reordered, col is the visual position
        const columnModel = this.getColumnModel();
        if (columnModel) {
          const orderedColumns = columnModel.getVisibleColumnsInOrder();
          if (orderedColumns && orderedColumns[col]) {
            return orderedColumns[col].definition;
          }
        }
        // Fallback to original index if no column model
        return this.options.columns?.[col];
      },
      isSelected: (row: number, col: number) => {
        return this.state.selection.some(
          (range) =>
            row >= range.startRow &&
            row <= range.endRow &&
            col >= range.startCol &&
            col <= range.endCol
        );
      },
      isActive: (row: number, col: number) => {
        return this.state.activeCell?.row === row && this.state.activeCell?.col === col;
      },
      isEditing: (row: number, col: number) => {
        return this.state.editingCell?.row === row && this.state.editingCell?.col === col;
      },
    });
  }

  private createRowMapper(): (row: number) => number | undefined {
    return (row: number) => {
      const viewIndices = this.getViewIndices();
      if (viewIndices) {
        return viewIndices[row];
      }
      return row;
    };
  }

  /**
   * Validate and normalize grid options
   */
  validateOptions(options: GridOptions): GridOptions {
    const validated = { ...options };

    if (!Number.isFinite(validated.rowCount) || validated.rowCount < 0) {
      validated.rowCount = 0;
    }

    if (!Number.isFinite(validated.colCount) || validated.colCount < 0) {
      validated.colCount = 0;
    }

    return validated;
  }

  /**
   * Update references (called when scrollContainer/canvas change)
   */
  updateReferences(scrollContainer: HTMLElement | null, canvas: HTMLElement | null): void {
    this.scrollContainer = scrollContainer;
    this.canvas = canvas;
  }
}
