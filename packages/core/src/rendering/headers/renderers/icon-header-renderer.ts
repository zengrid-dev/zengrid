import type { HeaderRenderer, HeaderRenderParams } from '../header-renderer.interface';

/**
 * IconHeaderRenderer - Header renderer for icon-only headers
 *
 * Displays only an icon without text, useful for action columns or narrow columns.
 *
 * @example
 * ```typescript
 * const renderer = new IconHeaderRenderer();
 * renderer.render(element, {
 *   columnIndex: 5,
 *   column: { field: 'actions', header: { text: '', type: 'icon', leadingIcon: { content: '⋮' } } },
 *   config: { text: '', type: 'icon', leadingIcon: { content: '⋮' }, interactive: true },
 *   width: 50,
 *   height: 40,
 * });
 * ```
 */
export class IconHeaderRenderer implements HeaderRenderer {
  render(element: HTMLElement, params: HeaderRenderParams): void {
    element.innerHTML = '';
    element.className = 'zg-header-cell zg-header-icon-only';
    element.style.width = `${params.width}px`;
    element.style.height = `${params.height}px`;
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';
    element.style.overflow = 'hidden';
    element.style.boxSizing = 'border-box';

    // Get icon from leadingIcon or trailingIcon
    const icon = params.config.leadingIcon || params.config.trailingIcon;
    if (!icon) {
      console.warn('IconHeaderRenderer: No icon provided for icon-only header');
      return;
    }

    // Create icon element
    const iconEl = document.createElement('span');
    iconEl.className = `zg-header-icon ${icon.className || ''}`;
    iconEl.innerHTML = icon.content;
    iconEl.style.cssText = `
      font-size: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      min-width: 0;
      overflow: hidden;
    `;

    // Add interactive styling
    if (params.config.interactive) {
      element.style.cursor = 'pointer';
      iconEl.style.transition = 'transform 0.2s';
    }

    // Click handler
    if (params.config.onClick || icon.onClick) {
      element.addEventListener('click', (e) => {
        if (icon.onClick) {
          icon.onClick(e as MouseEvent, params.columnIndex);
        }
        if (params.config.onClick) {
          params.config.onClick(e as MouseEvent, params.columnIndex);
        }
      });
    }

    // Hover effect
    if (params.config.interactive) {
      element.addEventListener('mouseenter', () => {
        iconEl.style.transform = 'scale(1.1)';
      });
      element.addEventListener('mouseleave', () => {
        iconEl.style.transform = 'scale(1)';
      });
    }

    // Tooltip
    if (params.config.tooltip) {
      element.title = params.config.tooltip.content;
    }

    element.appendChild(iconEl);
  }

  update(element: HTMLElement, params: HeaderRenderParams): void {
    // Update width if changed
    if (element.style.width !== `${params.width}px`) {
      element.style.width = `${params.width}px`;
    }

    // Update icon content if needed (rare)
    const icon = params.config.leadingIcon || params.config.trailingIcon;
    const iconEl = element.querySelector('.zg-header-icon');
    if (icon && iconEl) {
      iconEl.innerHTML = icon.content;
    }

    // Update tooltip
    if (params.config.tooltip) {
      element.title = params.config.tooltip.content;
    }
  }

  destroy(element: HTMLElement): void {
    // Clone to remove all event listeners
    const clone = element.cloneNode(true);
    element.parentNode?.replaceChild(clone, element);
    element.innerHTML = '';
  }

  getHeaderClass?(params: HeaderRenderParams): string | undefined {
    const classes: string[] = [];

    if (params.isHovered) classes.push('hovered');
    if (params.isFocused) classes.push('focused');

    return classes.length > 0 ? classes.join(' ') : undefined;
  }
}
