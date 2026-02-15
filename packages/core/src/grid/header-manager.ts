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
import type { HeaderManagerConfig, HeaderCellMetadata } from './header-types';
import type { HeaderRenderer } from '../rendering/headers/header-renderer.interface';
import { HeaderRendererRegistry } from '../rendering/headers/header-registry';
import { registerDefaultRenderers } from './header-registry-setup';
import {
  createHeaderCellsContainer,
  destroyHeaders,
  syncHorizontalScroll,
} from './header-dom-operations';
import {
  setupEventListeners,
  removeEventListeners,
  handleSortChange,
  handleFilterChange,
  handleScroll,
  type EventHandlerCallbacks,
} from './header-event-handlers';
import {
  renderAllHeaders,
  updateHeaderByColumnId,
  updateHeaderByIndex,
  updateAllHeaders,
} from './header-rendering';
import {
  subscribeToColumnChanges,
  type SubscriptionCallbacks,
} from './header-reactive-subscription';

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
    registerDefaultRenderers(this.registry);

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
      this.headerCellsContainer = createHeaderCellsContainer(
        this.config.container,
        this.getHeaderHeight()
      );
    }

    // Render all headers
    renderAllHeaders(
      this.config.columnModel,
      this.headerCellsContainer,
      this.headerCells,
      this.registry,
      this.config,
      this.getHeaderHeight()
    );
  }

  /**
   * Update a specific header cell (public API - by column index)
   */
  updateHeader(columnIndex: number): void {
    this.assertInitialized();
    updateHeaderByIndex(
      columnIndex,
      this.config.columnModel,
      this.headerCells,
      this.config,
      this.getHeaderHeight()
    );
  }

  /**
   * Update all headers
   */
  updateAllHeaders(): void {
    this.assertInitialized();
    updateAllHeaders(
      this.headerCells,
      this.config.columnModel,
      this.config,
      this.getHeaderHeight()
    );
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
      syncHorizontalScroll(this.headerCellsContainer, scrollLeft);
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
   * Subscribe to column model changes (reactive)
   */
  private subscribeToColumnChanges(): void {
    const callbacks: SubscriptionCallbacks = {
      onWidthChange: (columnId: string) => {
        updateHeaderByColumnId(
          columnId,
          this.headerCells,
          this.config.columnModel,
          this.config,
          this.getHeaderHeight()
        );
      },
      onVisibilityChange: () => {
        this.refreshHeaders();
      },
      onReorderChange: () => {
        this.refreshHeaders();
      },
      onOtherChange: (columnId: string) => {
        updateHeaderByColumnId(
          columnId,
          this.headerCells,
          this.config.columnModel,
          this.config,
          this.getHeaderHeight()
        );
      },
    };

    this.columnSubscription = subscribeToColumnChanges(
      this.config.columnModel,
      callbacks
    );
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    const callbacks: EventHandlerCallbacks = {
      onSortChange: this.boundHandlers.sortChange,
      onFilterChange: this.boundHandlers.filterChange,
      onScroll: this.boundHandlers.scroll,
    };

    setupEventListeners(this.config.eventEmitter, callbacks);
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    const callbacks: EventHandlerCallbacks = {
      onSortChange: this.boundHandlers.sortChange,
      onFilterChange: this.boundHandlers.filterChange,
      onScroll: this.boundHandlers.scroll,
    };

    removeEventListeners(this.config.eventEmitter, callbacks);
  }

  /**
   * Destroy all headers
   */
  private destroyHeaders(): void {
    destroyHeaders(this.headerCells, this.headerCellsContainer);
  }

  /**
   * Handle sort state change
   */
  private handleSortChange(payload?: any): void {
    handleSortChange(payload, this.config.getSortState, () => this.updateAllHeaders());
  }

  /**
   * Handle filter state change
   */
  private handleFilterChange(): void {
    handleFilterChange(() => this.updateAllHeaders());
  }

  /**
   * Handle scroll event
   */
  private handleScroll(payload: any): void {
    handleScroll(payload, (scrollLeft: number) => this.syncScroll(scrollLeft));
  }
}
