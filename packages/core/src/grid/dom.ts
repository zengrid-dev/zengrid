import type { GridOptions } from '../types';

/**
 * GridDOM - Handles all DOM creation and manipulation for the grid
 */
export class GridDOM {
  private container: HTMLElement;
  private options: GridOptions;

  public viewport: HTMLElement | null = null;
  public canvas: HTMLElement | null = null;
  public scrollContainer: HTMLElement | null = null;
  public headerContainer: HTMLElement | null = null;

  constructor(container: HTMLElement, options: GridOptions) {
    this.container = container;
    this.options = options;
  }

  /**
   * Setup the complete DOM structure for the grid
   */
  setupDOM(): void {
    // Create viewport
    this.viewport = document.createElement('div');
    this.viewport.className = 'zg-viewport';
    this.viewport.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    `;

    // Create scroll container
    this.scrollContainer = document.createElement('div');
    this.scrollContainer.className = 'zg-scroll-container';

    // Calculate header height if columns are defined
    const headerHeight = this.options.columns && this.options.columns.length > 0 ? 40 : 0;

    this.scrollContainer.style.cssText = `
      position: absolute;
      top: ${headerHeight}px;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: auto;
    `;

    // Create canvas (scroll area)
    this.canvas = document.createElement('div');
    this.canvas.className = 'zg-canvas';
    this.canvas.style.cssText = `
      position: relative;
      pointer-events: none;
    `;

    // Create cells container
    const cellsContainer = document.createElement('div');
    cellsContainer.className = 'zg-cells';
    cellsContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: auto;
    `;

    // Create headers if columns are defined
    if (this.options.columns && this.options.columns.length > 0) {
      this.createHeaderContainer();
    }

    // Assemble DOM
    this.canvas.appendChild(cellsContainer);
    this.scrollContainer.appendChild(this.canvas);
    this.viewport.appendChild(this.scrollContainer);
    this.container.appendChild(this.viewport);
  }

  /**
   * Create header container with column headers
   */
  createHeaderContainer(): void {
    if (!this.options.columns || this.options.columns.length === 0 || !this.viewport) return;

    this.headerContainer = document.createElement('div');
    this.headerContainer.className = 'zg-header';

    const headerHeight = 40;
    this.headerContainer.style.cssText = `
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

    // Create header cells container
    const headerCellsContainer = document.createElement('div');
    headerCellsContainer.className = 'zg-header-cells';
    headerCellsContainer.style.cssText = `
      position: relative;
      height: 100%;
      display: flex;
    `;

    // Create header cells
    this.options.columns.forEach((column, index) => {
      const headerCell = document.createElement('div');
      headerCell.className = 'zg-header-cell';

      // Get column width
      const colWidth = Array.isArray(this.options.colWidth)
        ? this.options.colWidth[index]
        : this.options.colWidth;

      headerCell.style.cssText = `
        width: ${colWidth}px;
        height: ${headerHeight}px;
        box-sizing: border-box;
        flex-shrink: 0;
      `;

      // Set header text
      headerCell.textContent = column.header || `Column ${index}`;
      headerCellsContainer.appendChild(headerCell);
    });

    this.headerContainer.appendChild(headerCellsContainer);

    // Insert header as first child of viewport
    this.viewport.insertBefore(this.headerContainer, this.viewport.firstChild);
  }

  /**
   * Update canvas size based on scroller dimensions
   */
  updateCanvasSize(totalWidth: number, totalHeight: number): void {
    if (this.canvas) {
      this.canvas.style.width = `${totalWidth}px`;
      this.canvas.style.height = `${totalHeight}px`;
    }
  }

  /**
   * Sync header horizontal scroll position
   */
  syncHeaderScroll(scrollLeft: number): void {
    if (this.headerContainer) {
      const headerCells = this.headerContainer.querySelector('.zg-header-cells') as HTMLElement;
      if (headerCells) {
        headerCells.style.transform = `translateX(-${scrollLeft}px)`;
      }
    }
  }

  /**
   * Get the cells container element
   */
  getCellsContainer(): HTMLElement | null {
    return this.canvas?.querySelector('.zg-cells') || null;
  }

  /**
   * Destroy DOM elements
   */
  destroy(): void {
    if (this.viewport) {
      this.viewport.remove();
    }
    this.viewport = null;
    this.canvas = null;
    this.scrollContainer = null;
    this.headerContainer = null;
  }
}
