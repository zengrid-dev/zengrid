/**
 * HeaderManager - DOM operations
 */

import type { ColumnDef } from '../types';
import type { HeaderCellMetadata } from './header-types';
import { HeaderRendererRegistry } from '../rendering/headers/header-registry';
import { resolveHeaderConfig } from '../rendering/headers/header-config-resolver';
import type { HeaderRenderParams } from '../rendering/headers/header-renderer.interface';

/**
 * Create header cells container
 */
export function createHeaderCellsContainer(
  container: HTMLElement,
  headerHeight: number
): HTMLElement {
  // Clear container
  container.innerHTML = '';
  container.className = 'zg-header';
  container.style.cssText = `
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
  const headerCellsContainer = document.createElement('div');
  headerCellsContainer.className = 'zg-header-cells';
  headerCellsContainer.style.cssText = `
    position: relative;
    height: 100%;
    display: flex;
  `;

  container.appendChild(headerCellsContainer);
  return headerCellsContainer;
}

/**
 * Render a single header cell
 */
export function renderHeaderCell(
  column: ColumnDef,
  columnId: string,
  columnIndex: number,
  headerCellsContainer: HTMLElement,
  registry: HeaderRendererRegistry,
  params: HeaderRenderParams,
  headerCells: Map<string, HeaderCellMetadata>
): void {
  // Resolve header config
  const config = resolveHeaderConfig(column.header, column);

  // Get renderer
  const rendererName = config.renderer || config.type;
  const renderer = registry.get(rendererName);

  // Create header cell element
  const element = document.createElement('div');
  element.dataset.columnId = columnId;
  element.dataset.columnIndex = String(columnIndex);

  // Render
  renderer.render(element, params);

  // Add to container
  headerCellsContainer.appendChild(element);

  // Store metadata by column ID (for reactive updates)
  headerCells.set(columnId, {
    element,
    renderer,
    columnId,
    columnIndex,
    lastParams: params,
  });
}

/**
 * Destroy all headers
 */
export function destroyHeaders(
  headerCells: Map<string, HeaderCellMetadata>,
  headerCellsContainer: HTMLElement | null
): void {
  for (const metadata of headerCells.values()) {
    metadata.renderer.destroy(metadata.element);
  }
  headerCells.clear();

  if (headerCellsContainer) {
    headerCellsContainer.innerHTML = '';
  }
}

/**
 * Sync horizontal scroll
 * Called synchronously on every scroll event to ensure header stays in sync with body
 * Uses CSS transform for GPU-accelerated, high-performance updates
 */
export function syncHorizontalScroll(
  headerCellsContainer: HTMLElement | null,
  scrollLeft: number
): void {
  if (headerCellsContainer) {
    headerCellsContainer.style.transform = `translateX(-${scrollLeft}px)`;
  }
}
