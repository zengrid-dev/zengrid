import type {
  CellPositioner as ICellPositioner,
  CellPositionerOptions,
} from './cell-positioner.interface';
import type { CellRef, VisibleRange } from '../../types';
import type { RenderParams } from '../renderers';
import { RendererCache } from '../cache';
import type { ViewportModel } from '../../features/viewport/viewport-model';
import type { ViewportEvent } from '../../features/viewport/types';
import type { StateSubscriber } from '@zengrid/shared';

/**
 * CellPositioner - Orchestrates cell rendering
 *
 * Coordinates VirtualScroller, CellPool, and RendererRegistry
 * to efficiently render only visible cells.
 *
 * @example
 * ```typescript
 * const positioner = new CellPositioner({
 *   scroller: virtualScroller,
 *   pool: cellPool,
 *   registry: rendererRegistry,
 *   getData: (row, col) => data[row][col],
 *   getColumn: (col) => columns[col],
 * });
 *
 * // Render on scroll
 * viewport.addEventListener('scroll', (e) => {
 *   positioner.renderVisibleCells(e.target.scrollTop, e.target.scrollLeft);
 * });
 * ```
 */
export class CellPositioner implements ICellPositioner {
  private scroller: CellPositionerOptions['scroller'];
  private pool: CellPositionerOptions['pool'];
  private registry: CellPositionerOptions['registry'];
  private cache: CellPositionerOptions['cache'];
  private getData: CellPositionerOptions['getData'];
  private getRowData: CellPositionerOptions['getRowData'];
  private getColumn: CellPositionerOptions['getColumn'];
  private isSelected: NonNullable<CellPositionerOptions['isSelected']>;
  private isActive: NonNullable<CellPositionerOptions['isActive']>;
  private isEditing: NonNullable<CellPositionerOptions['isEditing']>;

  private lastRange: VisibleRange | null = null;
  private renderedCells: Map<string, string> = new Map(); // key -> renderer name

  // Reactive subscription
  private viewportSubscription: (() => void) | null = null;

  constructor(options: CellPositionerOptions) {
    this.scroller = options.scroller;
    this.pool = options.pool;
    this.registry = options.registry;
    this.cache = options.cache;
    this.getData = options.getData;
    this.getRowData = options.getRowData;
    this.getColumn = options.getColumn;
    this.isSelected = options.isSelected ?? (() => false);
    this.isActive = options.isActive ?? (() => false);
    this.isEditing = options.isEditing ?? (() => false);
  }

  /**
   * Subscribe to viewport changes (reactive mode)
   */
  subscribeToViewport(viewportModel: ViewportModel): () => void {
    const subscriber: StateSubscriber<ViewportEvent> = {
      onChange: (event: ViewportEvent) => {
        this.handleViewportChange(event);
      },
    };

    this.viewportSubscription = viewportModel.subscribe(subscriber);
    return this.viewportSubscription;
  }

  /**
   * Handle viewport change reactively
   */
  private handleViewportChange(event: ViewportEvent): void {
    const range = event.newRange;
    this.renderCellsInRange(range);
  }

  renderVisibleCells(scrollTop: number, scrollLeft: number): void {
    const range = this.scroller.calculateVisibleRange(scrollTop, scrollLeft);
    this.renderCellsInRange(range);
  }

  /**
   * Render cells in a specific range (internal helper)
   */
  private renderCellsInRange(range: VisibleRange): void {
    const activeKeys = new Set<string>();

    for (let row = range.startRow; row < range.endRow; row++) {
      for (let col = range.startCol; col < range.endCol; col++) {
        const key = this.getCellKey(row, col);
        activeKeys.add(key);

        this.renderCell(row, col, key);
      }
    }

    // Release cells no longer visible
    this.pool.releaseExcept(activeKeys);

    // Clean up rendered cells tracking
    for (const key of this.renderedCells.keys()) {
      if (!activeKeys.has(key)) {
        this.renderedCells.delete(key);
      }
    }

    this.lastRange = range;
  }

  updateCells(cells: CellRef[]): void {
    for (const cell of cells) {
      const key = this.getCellKey(cell.row, cell.col);
      if (this.renderedCells.has(key)) {
        this.renderCell(cell.row, cell.col, key);
      }
    }
  }

  refresh(): void {
    if (!this.lastRange) return;

    for (let row = this.lastRange.startRow; row < this.lastRange.endRow; row++) {
      for (let col = this.lastRange.startCol; col < this.lastRange.endCol; col++) {
        const key = this.getCellKey(row, col);
        this.renderCell(row, col, key);
      }
    }
  }

  destroy(): void {
    // Unsubscribe from viewport changes
    if (this.viewportSubscription) {
      this.viewportSubscription();
      this.viewportSubscription = null;
    }

    this.pool.clear();
    this.renderedCells.clear();
    this.lastRange = null;
  }

  private renderCell(row: number, col: number, key: string): void {
    const element = this.pool.acquire(key);
    const position = this.scroller.getCellPosition(row, col);
    const value = this.getData(row, col);
    const column = this.getColumn?.(col);
    const rowData = this.getRowData?.(row);

    // Position the cell
    element.style.left = `${position.x}px`;
    element.style.top = `${position.y}px`;
    element.style.width = `${position.width}px`;
    element.style.height = `${position.height}px`;
    element.style.display = ''; // Show the cell (remove display: none from pool)
    element.setAttribute('data-col', col.toString());

    // Get renderer - handle both string names and renderer instances
    let renderer: any;
    let rendererName: string;

    if (column?.renderer) {
      // Check if it's a renderer instance (has render method)
      if (typeof column.renderer === 'object' && 'render' in column.renderer) {
        renderer = column.renderer;
        rendererName = renderer.constructor.name || 'custom';
      } else {
        // It's a string name - look it up in registry
        rendererName = column.renderer as string;
        renderer = this.registry.get(rendererName);
      }
    } else {
      // Default to text renderer
      rendererName = 'text';
      renderer = this.registry.get(rendererName);
    }

    // Prepare render params
    const params: RenderParams = {
      cell: { row, col },
      position,
      value,
      column,
      rowData,
      isSelected: this.isSelected(row, col),
      isActive: this.isActive(row, col),
      isEditing: this.isEditing(row, col),
    };

    // Generate cache key
    const cacheKey = this.cache
      ? RendererCache.generateKey(row, col, value, rendererName, {
          isSelected: params.isSelected,
          isActive: params.isActive,
          isEditing: params.isEditing,
        })
      : null;

    // Check cache before rendering
    if (cacheKey && this.cache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        // Use cached content
        element.innerHTML = cached.html;

        // Apply cached classes
        if (cached.classes) {
          cached.classes.forEach((cls) => element.classList.add(cls));
        }

        this.renderedCells.set(key, rendererName);

        // Apply state classes
        element.classList.toggle('zg-cell-selected', params.isSelected);
        element.classList.toggle('zg-cell-active', params.isActive);
        element.classList.toggle('zg-cell-editing', params.isEditing);

        return;
      }
    }

    // Render or update (cache miss or no cache)
    const lastRenderer = this.renderedCells.get(key);
    if (lastRenderer !== rendererName || !lastRenderer) {
      // Renderer changed or first render - destroy old and render new
      if (lastRenderer) {
        const oldRenderer = this.registry.get(lastRenderer);
        oldRenderer.destroy(element);
      }
      renderer.render(element, params);
      this.renderedCells.set(key, rendererName);
    } else {
      // Same renderer - just update
      renderer.update(element, params);
    }

    // Cache the rendered content
    if (cacheKey && this.cache) {
      const rendererClass = renderer.getCellClass?.(params);
      this.cache.set(cacheKey, {
        html: element.innerHTML,
        classes: rendererClass ? [rendererClass] : undefined,
      });
    }

    // Apply state classes
    element.classList.toggle('zg-cell-selected', params.isSelected);
    element.classList.toggle('zg-cell-active', params.isActive);
    element.classList.toggle('zg-cell-editing', params.isEditing);

    // Apply optional renderer class
    if (renderer.getCellClass) {
      const rendererClass = renderer.getCellClass(params);
      if (rendererClass) {
        element.classList.add(rendererClass);
      }
    }
  }

  private getCellKey(row: number, col: number): string {
    return `${row}-${col}`;
  }
}
