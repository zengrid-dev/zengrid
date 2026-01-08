import { SortableHeaderRenderer } from './sortable-header-renderer';
import type { HeaderRenderParams } from '../header-renderer.interface';

/**
 * FilterableHeaderRenderer - Header renderer with filter dropdown trigger
 *
 * Extends SortableHeaderRenderer and adds:
 * - Filter dropdown trigger button
 * - Active filter indicator
 * - Filter icon/button with click handler
 *
 * @example
 * ```typescript
 * const renderer = new FilterableHeaderRenderer();
 * renderer.render(element, {
 *   columnIndex: 0,
 *   column: { field: 'status', header: 'Status', filterable: true, sortable: true },
 *   config: {
 *     text: 'Status',
 *     type: 'filterable',
 *     interactive: true,
 *     filterIndicator: { show: true, icon: '▼' }
 *   },
 *   hasFilter: true,
 *   width: 200,
 *   height: 40,
 * });
 * ```
 */
export class FilterableHeaderRenderer extends SortableHeaderRenderer {
  /**
   * Default filter icon
   */
  private static readonly DEFAULT_FILTER_ICON = '▼';

  /**
   * Initial render of filterable header
   */
  render(element: HTMLElement, params: HeaderRenderParams): void {
    // Call parent render (sortable)
    super.render(element, params);

    // Add filterable class
    element.classList.add('zg-header-filterable');

    // Add filter trigger button
    this.renderFilterTrigger(element, params);
  }

  /**
   * Update filterable header
   */
  update(element: HTMLElement, params: HeaderRenderParams): void {
    // Call parent update
    super.update(element, params);

    // Update filter active state
    if (params.hasFilter) {
      element.classList.add('has-filter');
    } else {
      element.classList.remove('has-filter');
    }

    // Update filter button state
    this.updateFilterTrigger(element, params);
  }

  /**
   * Render filter trigger button
   */
  protected renderFilterTrigger(element: HTMLElement, params: HeaderRenderParams): void {
    const contentWrapper = element.querySelector('.zg-header-content');
    if (!contentWrapper) return;

    const filterIndicator = params.config.filterIndicator;
    if (!filterIndicator?.show) return;

    // Create filter button
    const filterBtn = document.createElement('button');
    filterBtn.className = 'zg-filter-trigger';
    filterBtn.type = 'button';
    filterBtn.innerHTML = filterIndicator.icon || FilterableHeaderRenderer.DEFAULT_FILTER_ICON;
    filterBtn.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      min-width: 16px;
      flex-shrink: 0;
      border: 1px solid var(--zg-border-color, #d0d0d0);
      background: var(--zg-bg-secondary, #f5f5f5);
      border-radius: 2px;
      cursor: pointer;
      font-size: 8px;
      padding: 0;
      margin-left: 2px;
      transition: all 0.2s;
    `;

    // Add active state if filter is applied
    if (params.hasFilter) {
      filterBtn.style.background = 'var(--zg-primary-color, #0066cc)';
      filterBtn.style.color = 'white';
      filterBtn.style.borderColor = 'var(--zg-primary-color, #0066cc)';
    }

    // Click handler to open filter dropdown
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Don't trigger sort

      if (params.emit) {
        params.emit('header:filter:click', {
          columnIndex: params.columnIndex,
          column: params.column,
          hasActiveFilter: params.hasFilter || false,
          dropdownType: filterIndicator.dropdownType || 'text',
        });
      }

      // TODO: Show filter dropdown UI
      console.log('Filter clicked for column', params.columnIndex);
    });

    // Hover effects
    filterBtn.addEventListener('mouseenter', () => {
      if (!params.hasFilter) {
        filterBtn.style.background = 'var(--zg-bg-hover, #e5e5e5)';
      }
    });

    filterBtn.addEventListener('mouseleave', () => {
      if (!params.hasFilter) {
        filterBtn.style.background = 'var(--zg-bg-secondary, #f5f5f5)';
      }
    });

    // Append to content wrapper
    contentWrapper.appendChild(filterBtn);
  }

  /**
   * Update filter trigger button state
   */
  protected updateFilterTrigger(element: HTMLElement, params: HeaderRenderParams): void {
    const filterBtn = element.querySelector('.zg-filter-trigger') as HTMLElement;
    if (!filterBtn) return;

    // Update active state styling
    if (params.hasFilter) {
      filterBtn.style.background = 'var(--zg-primary-color, #0066cc)';
      filterBtn.style.color = 'white';
      filterBtn.style.borderColor = 'var(--zg-primary-color, #0066cc)';
    } else {
      filterBtn.style.background = 'var(--zg-bg-secondary, #f5f5f5)';
      filterBtn.style.color = 'inherit';
      filterBtn.style.borderColor = 'var(--zg-border-color, #d0d0d0)';
    }
  }

  /**
   * Get additional CSS class for filter state
   */
  getHeaderClass?(params: HeaderRenderParams): string | undefined {
    const parentClass = super.getHeaderClass?.(params);
    const classes: string[] = parentClass ? [parentClass] : [];

    if (params.hasFilter) {
      classes.push('has-filter');
    }

    return classes.length > 0 ? classes.join(' ') : undefined;
  }

  /**
   * Cleanup - remove filter button listeners
   */
  destroy(element: HTMLElement): void {
    const filterBtn = element.querySelector('.zg-filter-trigger');
    if (filterBtn) {
      // Clone to remove all event listeners
      const newBtn = filterBtn.cloneNode(true);
      filterBtn.parentNode?.replaceChild(newBtn, filterBtn);
    }

    // Call parent destroy
    super.destroy(element);
  }
}
