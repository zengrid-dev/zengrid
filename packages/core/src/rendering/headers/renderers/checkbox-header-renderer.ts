import type { HeaderRenderer, HeaderRenderParams } from '../header-renderer.interface';

/**
 * CheckboxHeaderRenderer - Header renderer for select-all checkbox
 *
 * Displays a checkbox in the header that can be used for row selection.
 * Typically used in the first column for bulk selection.
 *
 * @example
 * ```typescript
 * const renderer = new CheckboxHeaderRenderer();
 * renderer.render(element, {
 *   columnIndex: 0,
 *   column: { field: 'select', header: { text: '', type: 'checkbox' } },
 *   config: { text: '', type: 'checkbox', interactive: true },
 *   width: 40,
 *   height: 40,
 * });
 * ```
 */
export class CheckboxHeaderRenderer implements HeaderRenderer {
  render(element: HTMLElement, params: HeaderRenderParams): void {
    element.innerHTML = '';
    element.className = 'zg-header-cell zg-header-checkbox';
    element.style.width = `${params.width}px`;
    element.style.height = `${params.height}px`;
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';

    // Create checkbox input
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'zg-header-checkbox-input';
    checkbox.style.cssText = `
      width: 16px;
      height: 16px;
      cursor: pointer;
    `;

    // Click handler
    checkbox.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked;

      if (params.emit) {
        params.emit('header:checkbox:change', {
          columnIndex: params.columnIndex,
          checked,
          action: checked ? 'select-all' : 'deselect-all',
        });
      }

      if (params.config.onClick) {
        params.config.onClick(e as any, params.columnIndex);
      }
    });

    element.appendChild(checkbox);

    // Store checkbox reference for updates
    (element as any)._checkbox = checkbox;
  }

  update(element: HTMLElement, params: HeaderRenderParams): void {
    const checkbox = (element as any)._checkbox as HTMLInputElement;
    if (!checkbox) return;

    // Width update
    if (element.style.width !== `${params.width}px`) {
      element.style.width = `${params.width}px`;
    }

    // Could update checked state based on rendererData
    if (params.config.rendererData?.checked !== undefined) {
      checkbox.checked = params.config.rendererData.checked;
    }
  }

  destroy(element: HTMLElement): void {
    const checkbox = (element as any)._checkbox as HTMLInputElement;
    if (checkbox) {
      // Clone to remove listeners
      const newCheckbox = checkbox.cloneNode(true);
      checkbox.parentNode?.replaceChild(newCheckbox, checkbox);
    }
    delete (element as any)._checkbox;
    element.innerHTML = '';
  }
}
