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
import type { ColumnDef } from '../../types/column';
import { IS_DEV } from '../../reactive/debug';

/**
 * CSS classes for cell overflow modes
 * Used by applyOverflowClass helper to avoid duplication
 */
const OVERFLOW_CLASSES = [
  'zg-cell-overflow-clip',
  'zg-cell-overflow-ellipsis',
  'zg-cell-overflow-wrap',
  'zg-cell-overflow-scroll',
  'zg-cell-overflow-expand',
] as const;

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
  private rowHeightManager: CellPositionerOptions['rowHeightManager'];

  private lastRange: VisibleRange | null = null;
  private renderedCells: Map<string, string> = new Map(); // key -> renderer name

  // Height measurement state (single RAF batch)
  private rafPending = false;
  private rowsToMeasure: Map<number, HTMLElement[]> = new Map(); // row -> auto-height cells
  private heightCache: Map<number, number> = new Map(); // row -> measured height

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
    this.rowHeightManager = options.rowHeightManager;
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
   * Render cells in a specific range with two-phase auto-height measurement
   *
   * Phase 1: Render all cells with current/cached heights
   * Phase 2 (RAF): Measure auto-height cells, update heights, re-position if needed
   */
  private renderCellsInRange(range: VisibleRange): void {
    const activeKeys = new Set<string>();

    // PHASE 1: Render all visible cells
    for (let row = range.startRow; row < range.endRow; row++) {
      for (let col = range.startCol; col < range.endCol; col++) {
        const key = this.getCellKey(row, col);
        activeKeys.add(key);

        // Always render if cell is newly visible
        if (!this.renderedCells.has(key)) {
          this.renderCell(row, col, key);
        }
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

    // PHASE 2: Schedule measurement for auto-height rows (if any pending)
    if (this.rowsToMeasure.size > 0) {
      this.scheduleMeasurement();
    }
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
    if (!this.lastRange) {
      if (IS_DEV) {
        console.warn('[CellPositioner] refresh() no-op: lastRange is null. Was the positioner recreated without rendering?');
      }
      return;
    }

    for (let row = this.lastRange.startRow; row < this.lastRange.endRow; row++) {
      for (let col = this.lastRange.startCol; col < this.lastRange.endCol; col++) {
        const key = this.getCellKey(row, col);
        this.renderCell(row, col, key);
      }
    }
  }

  refreshSelectionClasses(): void {
    if (!this.lastRange) {
      if (IS_DEV) {
        console.warn('[CellPositioner] refreshSelectionClasses() no-op: lastRange is null. Was the positioner recreated without rendering?');
      }
      return;
    }

    for (let row = this.lastRange.startRow; row < this.lastRange.endRow; row++) {
      for (let col = this.lastRange.startCol; col < this.lastRange.endCol; col++) {
        const key = this.getCellKey(row, col);
        if (!this.renderedCells.has(key)) continue;
        const element = this.pool.acquire(key);
        element.classList.toggle('zg-cell-selected', this.isSelected(row, col));
        element.classList.toggle('zg-cell-active', this.isActive(row, col));
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
    if (!element.classList.contains('zg-cell')) {
      element.classList.add('zg-cell');
    }
    const position = this.scroller.getCellPosition(row, col);
    const value = this.getData(row, col);
    const column = this.getColumn?.(col);
    const rowData = this.getRowData?.(row);

    // Position the cell using batched style updates (cssText) to prevent layout thrashing
    // This is critical for scroll performance - individual style.property assignments
    // can trigger multiple style recalculations, while cssText batches them
    element.style.cssText = `position: absolute; left: ${position.x}px; top: ${position.y}px; width: ${position.width}px; height: ${position.height}px;`;

    // For auto-height columns being measured, allow the cell to expand beyond the set height
    // This is only for the MEASUREMENT phase - after measurement, all cells use the measured height
    const needsMeasurement = this.rowHeightManager?.needsMeasurement(row);
    if (needsMeasurement && column?.autoHeight) {
      // Override height constraint for measurement - let content expand
      // The browser will naturally reflow, and we'll measure in the next frame via RAF
      element.style.height = 'auto';
      element.style.minHeight = `${position.height}px`;
    }
    element.setAttribute('data-row', row.toString());
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

        // Apply overflow mode class (from column config) - even for cached content
        this.applyOverflowClass(element, column);

        // CRITICAL: Measure row height even for cached content
        // Cached content still needs height measurement for auto-height columns
        this.measureRowIfNeeded(row, col, element);

        return;
      }
    }

    // Render or update (cache miss or no cache)
    const lastRenderer = this.renderedCells.get(key);

    // Capture classes before render for delta calculation
    const classesBefore = new Set(Array.from(element.classList));

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

    // Apply optional renderer class (before caching so it's included)
    if (renderer.getCellClass) {
      const rendererClass = renderer.getCellClass(params);
      if (rendererClass) {
        element.classList.add(rendererClass);
      }
    }

    // Cache the rendered content with all classes added by renderer
    if (cacheKey && this.cache) {
      // Calculate delta: classes added during render
      const addedClasses: string[] = [];
      element.classList.forEach((cls) => {
        if (!classesBefore.has(cls)) {
          addedClasses.push(cls);
        }
      });

      this.cache.set(cacheKey, {
        html: element.innerHTML,
        classes: addedClasses.length > 0 ? addedClasses : undefined,
      });
    }

    // Apply state classes
    element.classList.toggle('zg-cell-selected', params.isSelected);
    element.classList.toggle('zg-cell-active', params.isActive);
    element.classList.toggle('zg-cell-editing', params.isEditing);

    // Apply overflow mode class (from column config)
    this.applyOverflowClass(element, column);

    // Measure row height if needed (after rendering is complete)
    this.measureRowIfNeeded(row, col, element);
  }

  /**
   * Track auto-height cells for measurement in next RAF
   */
  private measureRowIfNeeded(row: number, col: number, element: HTMLElement): void {
    if (!this.rowHeightManager) {
      return;
    }

    // Check if this row needs measurement
    const needsMeasurement = this.rowHeightManager.needsMeasurement(row);
    if (!needsMeasurement) {
      return;
    }

    // Get the column definition to check if it affects height
    const column = this.getColumn?.(col);
    if (!column?.autoHeight) {
      // This column doesn't affect row height, skip
      return;
    }

    // Track this cell for measurement
    if (!this.rowsToMeasure.has(row)) {
      this.rowsToMeasure.set(row, []);
    }
    this.rowsToMeasure.get(row)!.push(element);
  }

  /**
   * Schedule measurement in next RAF (single batched callback)
   */
  private scheduleMeasurement(): void {
    if (this.rafPending || this.rowsToMeasure.size === 0) {
      return;
    }

    this.rafPending = true;

    requestAnimationFrame(() => {
      this.rafPending = false;
      this.processMeasurements();
    });
  }

  /**
   * PHASE 2: Measure all tracked cells, update heights, re-position affected rows
   * Called once per frame via RAF
   */
  private processMeasurements(): void {
    if (this.rowsToMeasure.size === 0) {
      return;
    }

    const heightUpdates = new Map<number, number>();
    // Get default height from row height manager stats
    const stats = this.rowHeightManager?.getStats();
    const defaultHeight = stats?.defaultHeight ?? 30;

    // STEP 1: Measure all rows (batched reads - browser has already reflowed)
    for (const [row, cells] of this.rowsToMeasure) {
      // Find max height among all auto-height cells in this row
      let maxHeight = defaultHeight;
      for (const cell of cells) {
        // Let content expand naturally
        const originalHeight = cell.style.height;
        cell.style.height = 'auto';
        const rect = cell.getBoundingClientRect();
        maxHeight = Math.max(maxHeight, rect.height);
        cell.style.height = originalHeight; // Restore
      }

      const measuredHeight = Math.ceil(maxHeight);
      const currentHeight = this.scroller.getRowHeight(row);

      // Only update if height changed
      if (measuredHeight !== currentHeight) {
        heightUpdates.set(row, measuredHeight);
      }

      // Cache the measurement
      this.heightCache.set(row, measuredHeight);
    }

    // Clear pending measurements
    this.rowsToMeasure.clear();

    if (heightUpdates.size === 0) {
      return;
    }

    // STEP 2: Batch update HeightProvider
    const heightProvider = this.scroller.getHeightProvider();
    if (heightProvider && heightProvider.batchSetHeight) {
      heightProvider.batchSetHeight(heightUpdates);
    } else if (heightProvider && heightProvider.setHeight) {
      // Fallback to individual updates if batchSetHeight not available
      for (const [row, height] of heightUpdates) {
        heightProvider.setHeight(row, height);
      }
    }

    // STEP 3: Force re-render of visible cells to apply new heights
    // Since heights changed, Y positions of affected rows need updating
    // Clear the renderedCells cache for affected rows to force re-render
    if (this.lastRange) {
      const minChangedRow = Math.min(...heightUpdates.keys());
      for (let row = minChangedRow; row < this.lastRange.endRow; row++) {
        for (let col = this.lastRange.startCol; col < this.lastRange.endCol; col++) {
          const key = this.getCellKey(row, col);
          this.renderedCells.delete(key);
        }
      }
      // Trigger re-render with current range
      this.renderCellsInRange(this.lastRange);
    }
  }

  /**
   * Apply overflow mode CSS class to a cell element
   * Extracts common logic for applying overflow styles based on column config
   * @param element - Cell DOM element
   * @param column - Column definition (may be undefined)
   */
  private applyOverflowClass(element: HTMLElement, column: ColumnDef | undefined): void {
    // Remove any existing overflow classes
    element.classList.remove(...OVERFLOW_CLASSES);
    if (!column?.overflow?.mode) {
      return;
    }
    // Add the configured overflow class
    element.classList.add(`zg-cell-overflow-${column.overflow.mode}`);
  }

  private getCellKey(row: number, col: number): string {
    return `${row}-${col}`;
  }
}
