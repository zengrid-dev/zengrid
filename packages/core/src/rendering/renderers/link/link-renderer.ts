import type { CellRenderer, RenderParams } from '../renderer.interface';

/**
 * Configuration options for LinkRenderer
 */
export interface LinkRendererOptions {
  /** Link target attribute: '_blank' (new tab) or '_self' (same tab, default) */
  target?: '_blank' | '_self';
  /** Custom CSS class for the link */
  className?: string;
  /** Callback when link is clicked (can prevent default navigation) */
  onClick?: (url: string, params: RenderParams) => void | boolean;
  /** URL prefix to prepend to all links (e.g., 'https://') */
  urlPrefix?: string;
  /** Field name to use for href if different from display value */
  hrefField?: string;
  /** Whether to add rel="noopener noreferrer" for security (default: true for _blank) */
  noOpener?: boolean;
  /** Custom label to display instead of the URL */
  label?: string | ((params: RenderParams) => string);
  /** Whether the link should be disabled (not clickable) */
  disabled?: boolean | ((params: RenderParams) => boolean);
}

/**
 * LinkRenderer - Renders clickable hyperlinks in grid cells
 *
 * Features:
 * - Clickable hyperlinks with configurable targets (_blank, _self)
 * - URL prefix support for relative URLs
 * - Separate href field support (display one value, link to another)
 * - Custom onClick handler with default prevention
 * - Security: automatic rel="noopener noreferrer" for _blank targets
 * - ARIA attributes for accessibility
 * - Disabled state support
 * - Custom label support (static or function)
 *
 * Performance: Optimized for virtual scrolling with update() method
 *
 * @example
 * ```typescript
 * // Simple link renderer
 * const renderer = new LinkRenderer({
 *   target: '_blank',
 *   urlPrefix: 'https://'
 * });
 *
 * // With custom href field
 * const renderer = new LinkRenderer({
 *   hrefField: 'url',
 *   target: '_blank',
 *   onClick: (url, params) => {
 *     console.log('Clicked:', url);
 *     return false; // Prevent default navigation
 *   }
 * });
 *
 * // With custom label
 * const renderer = new LinkRenderer({
 *   label: 'Click here',
 *   hrefField: 'url'
 * });
 *
 * // With dynamic label and disabled
 * const renderer = new LinkRenderer({
 *   label: (params) => params.rowData?.linkText || 'Link',
 *   disabled: (params) => !params.rowData?.active
 * });
 * ```
 */
export class LinkRenderer implements CellRenderer {
  private options: LinkRendererOptions;
  private eventHandlers: Map<HTMLElement, (e: Event) => void>;

  constructor(options: LinkRendererOptions = {}) {
    this.options = {
      target: '_self',
      noOpener: options.target === '_blank' ? true : false,
      ...options,
    };
    this.eventHandlers = new Map();
  }

  /**
   * Initial render - creates link structure
   */
  render(element: HTMLElement, params: RenderParams): void {
    // Clean up existing content on re-render
    this.destroy(element);

    element.classList.add('zg-cell-link');

    // Create link or span element
    const linkElement = document.createElement('a');
    linkElement.className = this.options.className || 'zg-link';

    // Add ARIA role
    linkElement.setAttribute('role', 'link');

    // Add data attributes
    linkElement.dataset.row = String(params.cell.row);
    linkElement.dataset.col = String(params.cell.col);
    if (params.column?.field) {
      linkElement.dataset.field = params.column.field;
    }

    element.appendChild(linkElement);

    // Add click handler if provided
    if (this.options.onClick) {
      const handler = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();

        const url = this.getUrl(params);
        const result = this.options.onClick!(url, params);

        // If onClick returns false, don't navigate
        if (result !== false) {
          if (this.options.target === '_blank') {
            window.open(url, '_blank', this.options.noOpener !== false ? 'noopener,noreferrer' : undefined);
          } else {
            window.location.href = url;
          }
        }
      };

      linkElement.addEventListener('click', handler);
      this.eventHandlers.set(element, handler);
    }

    // Set initial state via update()
    this.update(element, params);
  }

  /**
   * Update existing link - called on value/state changes
   * Optimized for performance during scrolling
   */
  update(element: HTMLElement, params: RenderParams): void {
    const linkElement = element.querySelector('a');
    if (!linkElement) return;

    // Get the URL to link to
    const url = this.getUrl(params);

    // Get display label
    const label = this.getLabel(params);

    // Check if disabled
    const disabled = this.isDisabled(params);

    // Update link or convert to disabled span
    if (!url || disabled) {
      // Render as disabled text
      linkElement.textContent = label || url || '';
      linkElement.removeAttribute('href');
      linkElement.removeAttribute('target');
      linkElement.removeAttribute('rel');
      linkElement.style.color = '#999';
      linkElement.style.cursor = 'not-allowed';
      linkElement.style.textDecoration = 'none';
      linkElement.setAttribute('aria-disabled', 'true');
    } else {
      // Render as active link
      linkElement.href = url;
      linkElement.textContent = label || url;
      linkElement.target = this.options.target || '_self';

      // Add security attributes for _blank targets
      if (this.options.target === '_blank' && this.options.noOpener !== false) {
        linkElement.rel = 'noopener noreferrer';
      } else {
        linkElement.removeAttribute('rel');
      }

      // Reset disabled styles
      linkElement.style.color = '';
      linkElement.style.cursor = '';
      linkElement.style.textDecoration = '';
      linkElement.removeAttribute('aria-disabled');

      // Update ARIA label for _blank
      if (this.options.target === '_blank') {
        linkElement.setAttribute('aria-label', `${label || url} (opens in new tab)`);
      } else {
        linkElement.removeAttribute('aria-label');
      }

      // Update data-url attribute
      linkElement.dataset.url = url;
    }
  }

  /**
   * Cleanup before element returns to pool
   */
  destroy(element: HTMLElement): void {
    // Remove event listener
    const handler = this.eventHandlers.get(element);
    if (handler) {
      const linkElement = element.querySelector('a');
      if (linkElement) {
        linkElement.removeEventListener('click', handler);
      }
      this.eventHandlers.delete(element);
    }

    // Clear content and remove classes
    element.innerHTML = '';
    element.classList.remove('zg-cell-link');
  }

  /**
   * Optional: Return CSS class based on link state
   */
  getCellClass(params: RenderParams): string | undefined {
    const disabled = this.isDisabled(params);
    const url = this.getUrl(params);

    if (disabled || !url) {
      return 'zg-link-disabled';
    }

    if (this.options.target === '_blank') {
      return 'zg-link-external';
    }

    return 'zg-link-internal';
  }

  /**
   * Get the URL to link to
   */
  private getUrl(params: RenderParams): string {
    let url: string | undefined;

    // Use hrefField if provided, otherwise use value
    if (this.options.hrefField && params.rowData) {
      url = params.rowData[this.options.hrefField];
    }

    // Fallback to value if hrefField not found or no hrefField specified
    if (url === null || url === undefined) {
      url = params.value;
    }

    // Convert to string
    if (url === null || url === undefined) {
      return '';
    }
    url = String(url);

    // Add prefix if provided and URL doesn't already have a protocol
    if (this.options.urlPrefix && url && !url.match(/^[a-zA-Z]+:\/\//)) {
      url = this.options.urlPrefix + url;
    }

    return url;
  }

  /**
   * Get the display label for the link
   */
  private getLabel(params: RenderParams): string {
    if (this.options.label) {
      if (typeof this.options.label === 'function') {
        return this.options.label(params);
      }
      return this.options.label;
    }

    // Default to the cell value
    const value = params.value;
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }

  /**
   * Check if the link is disabled
   */
  private isDisabled(params: RenderParams): boolean {
    if (this.options.disabled === undefined) {
      return false;
    }

    if (typeof this.options.disabled === 'function') {
      return this.options.disabled(params);
    }

    return this.options.disabled;
  }
}

/**
 * Factory function to create a LinkRenderer instance
 *
 * @example
 * ```typescript
 * // In column definition
 * const column = {
 *   field: 'website',
 *   header: 'Website',
 *   renderer: 'link', // Registered name
 * };
 *
 * // Or create directly
 * const renderer = createLinkRenderer({
 *   target: '_blank',
 *   urlPrefix: 'https://example.com/',
 *   onClick: (url) => console.log('Navigating to:', url)
 * });
 * ```
 */
export function createLinkRenderer(options: LinkRendererOptions = {}): LinkRenderer {
  return new LinkRenderer(options);
}
