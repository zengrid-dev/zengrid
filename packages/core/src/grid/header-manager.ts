/**
 * HeaderManager - Manages grid header lifecycle and rendering
 *
 * Extends BaseCoordinator to provide proper lifecycle management for headers.
 * Coordinates between HeaderRendererRegistry, DOM, and grid state.
 *
 * @example
 * ```typescript
 * const headerManager = new HeaderManager({
 *   columns: gridColumns,
 *   container: headerContainer,
 *   eventEmitter: gridEvents,
 *   getColumnWidths: () => columnWidths,
 *   getSortState: () => sortState,
 *   getFilterState: () => filterState,
 * });
 *
 * headerManager.initialize();
 * headerManager.renderHeaders();
 * // ... later
 * headerManager.cleanup();
 * ```
 */

import { BaseCoordinator } from '@zengrid/shared';
import type { StateSubscriber } from '@zengrid/shared';
import type { ColumnDef, SortState, FilterModel } from '../types';
import type { EventEmitter } from '../events/event-emitter';
import type { GridEvents } from '../events/grid-events';
import { HeaderRendererRegistry } from '../rendering/headers/header-registry';
import { resolveHeaderConfig } from '../rendering/headers/header-config-resolver';
import type {
  HeaderRenderer,
  HeaderRenderParams,
} from '../rendering/headers/header-renderer.interface';
import {
  TextHeaderRenderer,
  SortableHeaderRenderer,
  FilterableHeaderRenderer,
  CheckboxHeaderRenderer,
  IconHeaderRenderer,
} from '../rendering/headers/renderers';
import type { ColumnModel } from '../features/columns/column-model';
import type { ColumnEvent } from '../features/columns/types';

/**
 * Configuration for HeaderManager
 */
export interface HeaderManagerConfig {
  /** Reactive column model */
  columnModel: ColumnModel;

  /** Header container element */
  container: HTMLElement;

  /** Event emitter for grid events */
  eventEmitter: EventEmitter<GridEvents>;

  /** Get current sort state */
  getSortState?: () => SortState[];

  /** Get current filter state */
  getFilterState?: () => FilterModel[];

  /** Header height in pixels (default: 40) */
  headerHeight?: number;

  /** Enable horizontal scroll sync (default: true) */
  enableScrollSync?: boolean;
}

/**
 * Header cell metadata
 */
interface HeaderCellMetadata {
  element: HTMLElement;
  renderer: HeaderRenderer;
  columnId: string;
  columnIndex: number;
  lastParams?: HeaderRenderParams;
}

/**
 * HeaderManager - Manages grid header lifecycle
 *
 * Responsibilities:
 * - Initialize and register default header renderers
 * - Render header cells using appropriate renderers
 * - Update headers on state changes (sort, filter, resize)
 * - Handle header events (click, hover, context menu)
 * - Sync horizontal scroll with grid body
 * - Cleanup on destroy
 */
export class HeaderManager extends BaseCoordinator {
  private config: HeaderManagerConfig;
  private registry: HeaderRendererRegistry;
  private headerCells: Map<string, HeaderCellMetadata> = new Map();
  private headerCellsContainer: HTMLElement | null = null;

  // Reactive subscription cleanup
  private columnSubscription: (() => void) | null = null;

  // Event listener references for cleanup
  private boundHandlers = {
    sortChange: this.handleSortChange.bind(this),
    filterChange: this.handleFilterChange.bind(this),
    scroll: this.handleScroll.bind(this),
  };

  constructor(config: HeaderManagerConfig) {
    super();
    this.config = config;
    this.registry = new HeaderRendererRegistry();
  }

  /**
   * Initialize the header manager
   */
  protected onInitialize(): void {
    // Register default renderers
    this.registerDefaultRenderers();

    // Setup event listeners
    this.setupEventListeners();

    // Subscribe to column model changes (reactive!)
    this.subscribeToColumnChanges();
  }

  /**
   * Cleanup the header manager
   */
  protected onCleanup(): void {
    // Remove event listeners
    this.removeEventListeners();

    // Unsubscribe from column model
    if (this.columnSubscription) {
      this.columnSubscription();
      this.columnSubscription = null;
    }

    // Destroy all header cells
    this.destroyHeaders();

    // Clear references
    this.headerCells.clear();
    this.headerCellsContainer = null;
  }

  /**
   * Register a custom header renderer
   */
  registerRenderer(name: string, renderer: HeaderRenderer): void {
    this.registry.register(name, () => renderer);
  }

  /**
   * Render all headers
   */
  renderHeaders(): void {
    this.assertInitialized();

    // Clear existing headers
    this.destroyHeaders();

    // Create header cells container if not exists
    if (!this.headerCellsContainer) {
      this.createHeaderCellsContainer();
    }

    // Get visible columns in order from column model
    const columns = this.config.columnModel.getColumns()
      .filter(col => col.visible)
      .sort((a, b) => a.order - b.order);

    // Render each column header
    columns.forEach((columnState, visualIndex) => {
      this.renderHeaderCell(
        columnState.definition,
        columnState.id,
        visualIndex,
        columnState.actualWidth
      );
    });
  }

  /**
   * Update a specific header by column ID (reactive)
   */
  private updateHeaderByColumnId(columnId: string): void {
    this.assertInitialized();

    const metadata = this.headerCells.get(columnId);
    if (!metadata || !metadata.lastParams) return;

    // Get updated column state
    const columnState = this.config.columnModel.getColumn(columnId);
    if (!columnState) return;

    const sortState = this.config.getSortState?.() ?? [];
    const filterState = this.config.getFilterState?.() ?? [];

    // Update params
    const params = this.buildRenderParams(
      metadata.lastParams.column,
      metadata.columnIndex,
      columnState.actualWidth,
      sortState,
      filterState
    );

    // Update the renderer
    metadata.renderer.update(metadata.element, params);
    metadata.lastParams = params;
  }

  /**
   * Update a specific header cell (public API - by column index)
   */
  updateHeader(columnIndex: number): void {
    this.assertInitialized();

    // Find column ID by index
    const columns = this.config.columnModel.getColumns()
      .filter(col => col.visible)
      .sort((a, b) => a.order - b.order);

    if (columnIndex >= 0 && columnIndex < columns.length) {
      const columnId = columns[columnIndex].id;
      this.updateHeaderByColumnId(columnId);
    }
  }

  /**
   * Update all headers
   */
  updateAllHeaders(): void {
    this.assertInitialized();

    for (const columnId of this.headerCells.keys()) {
      this.updateHeaderByColumnId(columnId);
    }
  }

  /**
   * Refresh headers (destroy and re-render)
   */
  refreshHeaders(): void {
    this.renderHeaders();
  }

  /**
   * Sync horizontal scroll position (synchronous - no throttling for smooth sync)
   */
  syncScroll(scrollLeft: number): void {
    // Direct synchronous update - no throttling to prevent visual lag
    // The transform is lightweight and must happen in the same frame as body scroll
    if (this.config.enableScrollSync !== false) {
      this.syncHorizontalScroll(scrollLeft);
    }
  }

  /**
   * Get header height
   */
  getHeaderHeight(): number {
    return this.config.headerHeight ?? 40;
  }

  /**
   * Get the header container element (for attaching resize handles, etc.)
   */
  getHeaderContainer(): HTMLElement {
    return this.config.container;
  }

  /**
   * Get the header cells container element (for positioning elements relative to headers)
   */
  getHeaderCellsContainer(): HTMLElement | null {
    return this.headerCellsContainer;
  }

  /**
   * Register default header renderers
   */
  private registerDefaultRenderers(): void {
    this.registry.register('text', () => new TextHeaderRenderer());
    this.registry.register('sortable', () => new SortableHeaderRenderer());
    this.registry.register('filterable', () => new FilterableHeaderRenderer());
    this.registry.register('checkbox', () => new CheckboxHeaderRenderer());
    this.registry.register('icon', () => new IconHeaderRenderer());
  }

  /**
   * Subscribe to column model changes (reactive)
   */
  private subscribeToColumnChanges(): void {
    const subscriber: StateSubscriber<ColumnEvent> = {
      onChange: (event: ColumnEvent) => {
        this.handleColumnChange(event);
      },
    };

    // Subscribe to all column changes globally
    this.columnSubscription = this.config.columnModel.subscribeAll(subscriber);
  }

  /**
   * Handle column model changes reactively
   */
  private handleColumnChange(event: ColumnEvent): void {
    const { type, columnId } = event;

    // Update the specific header based on event type
    switch (type) {
      case 'width':
      case 'resize':
        // Width changed - update header width
        this.updateHeaderByColumnId(columnId);
        break;

      case 'visibility':
        // Visibility changed - re-render all headers
        this.refreshHeaders();
        break;

      case 'reorder':
      case 'pin':
      case 'unpin':
        // Order changed - re-render all headers
        this.refreshHeaders();
        break;

      default:
        // Unknown event - update specific header
        this.updateHeaderByColumnId(columnId);
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Subscribe to grid events
    this.config.eventEmitter.on('sort:change', (payload: any) => {
      this.boundHandlers.sortChange(payload);
    });
    this.config.eventEmitter.on(
      'filter:change',
      this.boundHandlers.filterChange
    );
    this.config.eventEmitter.on('scroll', this.boundHandlers.scroll);
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    this.config.eventEmitter.off('sort:change', this.boundHandlers.sortChange);
    this.config.eventEmitter.off(
      'filter:change',
      this.boundHandlers.filterChange
    );
    this.config.eventEmitter.off('scroll', this.boundHandlers.scroll);
  }

  /**
   * Create header cells container
   */
  private createHeaderCellsContainer(): void {
    const headerHeight = this.getHeaderHeight();

    // Clear container
    this.config.container.innerHTML = '';
    this.config.container.className = 'zg-header';
    this.config.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: ${headerHeight}px;
      z-index: 10;
      background: var(--zg-header-bg, #f5f5f5);
      border-bottom: 1px solid var(--zg-border-color, #d0d0d0);
      overflow: hidden;
    `;

    // Create cells container
    this.headerCellsContainer = document.createElement('div');
    this.headerCellsContainer.className = 'zg-header-cells';
    this.headerCellsContainer.style.cssText = `
      position: relative;
      height: 100%;
      display: flex;
    `;

    this.config.container.appendChild(this.headerCellsContainer);
  }

  /**
   * Render a single header cell
   */
  private renderHeaderCell(
    column: ColumnDef,
    columnId: string,
    columnIndex: number,
    width: number
  ): void {
    if (!this.headerCellsContainer) return;

    // Resolve header config
    const config = resolveHeaderConfig(column.header, column);

    // Get renderer
    const rendererName = config.renderer || config.type;
    const renderer = this.registry.get(rendererName);

    // Create header cell element
    const element = document.createElement('div');
    element.dataset.columnId = columnId;
    element.dataset.columnIndex = String(columnIndex);

    // Build render params
    const sortState = this.config.getSortState?.() ?? [];
    const filterState = this.config.getFilterState?.() ?? [];
    const params = this.buildRenderParams(
      column,
      columnIndex,
      width,
      sortState,
      filterState
    );

    // Render
    renderer.render(element, params);

    // Add to container
    this.headerCellsContainer.appendChild(element);

    // Store metadata by column ID (for reactive updates)
    this.headerCells.set(columnId, {
      element,
      renderer,
      columnId,
      columnIndex,
      lastParams: params,
    });
  }

  /**
   * Build HeaderRenderParams
   */
  private buildRenderParams(
    column: ColumnDef,
    columnIndex: number,
    width: number,
    sortState: SortState[],
    filterState: FilterModel[]
  ): HeaderRenderParams {
    const config = resolveHeaderConfig(column.header, column);
    const headerHeight = this.getHeaderHeight();

    // Find sort state for this column
    const columnSort = sortState.find((s) => s.column === columnIndex);
    const sortDirection = columnSort?.direction;
    const sortPriority =
      sortState.length > 1
        ? sortState.findIndex((s) => s.column === columnIndex) + 1
        : undefined;

    // Check if column has active filter
    const hasFilter = filterState.some((f) => f.column === columnIndex);

    return {
      columnIndex,
      column,
      config,
      width,
      height: headerHeight,
      sortDirection,
      sortPriority,
      hasFilter,
      emit: (event: string, payload: any) => {
        // Emit header events through grid event emitter
        this.config.eventEmitter.emit(event as keyof GridEvents, payload);
      },
    };
  }

  /**
   * Destroy all headers
   */
  private destroyHeaders(): void {
    for (const metadata of this.headerCells.values()) {
      metadata.renderer.destroy(metadata.element);
    }
    this.headerCells.clear();

    if (this.headerCellsContainer) {
      this.headerCellsContainer.innerHTML = '';
    }
  }

  /**
   * Handle sort state change
   */
  private handleSortChange(payload?: any): void {
    console.log('🔄 HeaderManager.handleSortChange() - updating all headers');
    // Use sortState from event payload (more reliable than getSortState)
    const sortState = payload?.sortState ?? this.config.getSortState?.() ?? [];
    console.log('   → Current sortState from payload:', sortState);
    this.updateAllHeaders();
  }

  /**
   * Handle filter state change
   */
  private handleFilterChange(): void {
    this.updateAllHeaders();
  }

  /**
   * Handle scroll event
   */
  private handleScroll(payload: any): void {
    if (payload.scrollLeft !== undefined) {
      this.syncScroll(payload.scrollLeft);
    }
  }

  /**
   * Sync horizontal scroll (actual implementation)
   * Called synchronously on every scroll event to ensure header stays in sync with body
   * Uses CSS transform for GPU-accelerated, high-performance updates
   */
  private syncHorizontalScroll(scrollLeft: number): void {
    if (this.headerCellsContainer) {
      this.headerCellsContainer.style.transform = `translateX(-${scrollLeft}px)`;
    }
  }
}
