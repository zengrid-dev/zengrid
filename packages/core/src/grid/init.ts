import type { GridOptions, GridState } from '../types';
import type { EventEmitter } from '../events/event-emitter';
import type { GridEvents } from '../events/grid-events';
import { VirtualScroller } from '../rendering/virtual-scroller/virtual-scroller';
import { CellPool } from '../rendering/cell-pool/cell-pool';
import { CellPositioner } from '../rendering/cell-positioner/cell-positioner';
import { RendererRegistry } from '../rendering/renderers/renderer-registry';
import { RendererCache } from '../rendering/cache';
import { NumberRenderer } from '../rendering/renderers/number-renderer';
import { ImageRenderer } from '../rendering/renderers/image-renderer';
import { AdvancedCellRenderer } from '../rendering/renderers/advanced-cell-renderer';
import { CheckboxRenderer } from '../rendering/renderers/checkbox-renderer';
import { ProgressBarRenderer } from '../rendering/renderers/progress-bar-renderer';
import { LinkRenderer } from '../rendering/renderers/link-renderer';
import { ButtonRenderer } from '../rendering/renderers/button-renderer';
import { DateRenderer } from '../rendering/renderers/date-renderer';
import { SelectRenderer } from '../rendering/renderers/select-renderer';
import { ChipRenderer } from '../rendering/renderers/chip-renderer';
import { DropdownRenderer } from '../rendering/renderers/dropdown-renderer';
import { LoadingIndicator } from '../features/loading';
import type { DataAccessor } from '../data/data-accessor/data-accessor.interface';

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
  public scroller: VirtualScroller | null = null;
  public pool: CellPool | null = null;
  public positioner: CellPositioner | null = null;

  // Callbacks
  private getSortManager: () => any;
  private getCachedVisibleRows: () => number[] | null;
  private getDataAccessor: () => DataAccessor | null;

  constructor(
    container: HTMLElement,
    options: GridOptions,
    state: GridState,
    events: EventEmitter<GridEvents>,
    scrollContainer: HTMLElement | null,
    canvas: HTMLElement | null,
    callbacks: {
      getSortManager: () => any;
      getCachedVisibleRows: () => number[] | null;
      getDataAccessor: () => DataAccessor | null;
    }
  ) {
    this.container = container;
    this.options = options;
    this.state = state;
    this.events = events;
    this.scrollContainer = scrollContainer;
    this.canvas = canvas;
    this.getSortManager = callbacks.getSortManager;
    this.getCachedVisibleRows = callbacks.getCachedVisibleRows;
    this.getDataAccessor = callbacks.getDataAccessor;

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
    this.registry.register('select', new SelectRenderer());
    this.registry.register('chip', new ChipRenderer());
    this.registry.register('dropdown', new DropdownRenderer());

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

    // Initialize VirtualScroller
    this.scroller = new VirtualScroller({
      rowCount: this.options.rowCount,
      colCount: this.options.colCount,
      rowHeight: this.options.rowHeight,
      colWidth: this.options.colWidth,
      viewportWidth,
      viewportHeight,
      overscanRows: this.options.overscanRows ?? 3,
      overscanCols: this.options.overscanCols ?? 2,
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
      getData: (row: number, col: number) => {
        let dataRow = row;

        const cachedVisibleRows = this.getCachedVisibleRows();
        if (cachedVisibleRows && cachedVisibleRows.length > 0) {
          if (row >= cachedVisibleRows.length) return undefined;
          dataRow = cachedVisibleRows[row];
        }

        const sortManager = this.getSortManager();
        const indexMap = sortManager?.getIndexMap();
        const mappedRow = indexMap ? indexMap.toDataIndex(dataRow) : dataRow;

        return this.getDataAccessor()?.getValue(mappedRow, col);
      },
      getColumn: (col: number) => {
        return this.options.columns?.[col];
      },
      isSelected: (row: number, col: number) => {
        return this.state.selection.some(range =>
          row >= range.startRow && row <= range.endRow &&
          col >= range.startCol && col <= range.endCol
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
