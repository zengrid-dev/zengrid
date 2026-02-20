/**
 * @jest-environment jsdom
 */

import { LinkRenderer, createLinkRenderer } from '../link';
import type { RenderParams } from '../renderer.interface';

describe('LinkRenderer', () => {
  let renderer: LinkRenderer;
  let element: HTMLElement;
  let params: RenderParams;

  beforeEach(() => {
    renderer = new LinkRenderer();
    element = document.createElement('div');
    params = {
      cell: { row: 0, col: 0 },
      position: { x: 0, y: 0, width: 150, height: 30 },
      value: 'https://example.com',
      column: { field: 'website', header: 'Website' },
      rowData: { id: 1, website: 'https://example.com' },
      isSelected: false,
      isActive: false,
      isEditing: false,
    } as RenderParams;
  });

  describe('constructor', () => {
    it('should create renderer with default options', () => {
      const renderer = new LinkRenderer();
      expect(renderer).toBeInstanceOf(LinkRenderer);
    });

    it('should accept custom options', () => {
      const onClick = jest.fn();
      const renderer = new LinkRenderer({
        target: '_blank',
        urlPrefix: 'https://',
        className: 'custom-link',
        onClick,
      });
      expect(renderer).toBeInstanceOf(LinkRenderer);
    });
  });

  describe('render()', () => {
    it('should create anchor element', () => {
      renderer.render(element, params);

      const anchor = element.querySelector('a');
      expect(anchor).toBeTruthy();
    });

    it('should add cell class', () => {
      renderer.render(element, params);

      expect(element.classList.contains('zg-cell-link')).toBe(true);
    });

    it('should set href attribute', () => {
      params.value = 'https://example.com';
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.href).toBe('https://example.com/');
    });

    it('should set link text content', () => {
      params.value = 'https://example.com';
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.textContent).toBe('https://example.com');
    });

    it('should set data attributes', () => {
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.dataset.row).toBe('0');
      expect(anchor.dataset.col).toBe('0');
      expect(anchor.dataset.field).toBe('website');
    });

    it('should set ARIA role', () => {
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.getAttribute('role')).toBe('link');
    });

    it('should set target to _self by default', () => {
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.target).toBe('_self');
    });

    it('should set custom class name', () => {
      renderer = new LinkRenderer({ className: 'custom-link' });
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.className).toBe('custom-link');
    });

    it('should attach click event listener when onClick is provided', () => {
      const onClick = jest.fn();
      renderer = new LinkRenderer({ onClick });

      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      anchor.click();

      expect(onClick).toHaveBeenCalledWith('https://example.com', params);
    });
  });

  describe('update()', () => {
    beforeEach(() => {
      renderer.render(element, params);
    });

    it('should update href when value changes', () => {
      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.href).toBe('https://example.com/');

      params.value = 'https://newsite.com';
      renderer.update(element, params);

      expect(anchor.href).toBe('https://newsite.com/');
    });

    it('should update text content when value changes', () => {
      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.textContent).toBe('https://example.com');

      params.value = 'https://newsite.com';
      renderer.update(element, params);

      expect(anchor.textContent).toBe('https://newsite.com');
    });

    it('should do nothing if anchor not found', () => {
      element.innerHTML = ''; // Remove anchor

      expect(() => {
        renderer.update(element, params);
      }).not.toThrow();
    });
  });

  describe('destroy()', () => {
    it('should remove event listeners', () => {
      const onClick = jest.fn();
      renderer = new LinkRenderer({ onClick });

      renderer.render(element, params);
      renderer.destroy(element);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      if (anchor) {
        anchor.click();
        expect(onClick).not.toHaveBeenCalled();
      }
    });

    it('should clear element content', () => {
      renderer.render(element, params);
      renderer.destroy(element);

      expect(element.innerHTML).toBe('');
    });

    it('should remove cell class', () => {
      renderer.render(element, params);
      renderer.destroy(element);

      expect(element.classList.contains('zg-cell-link')).toBe(false);
    });

    it('should handle destroy when no link exists', () => {
      expect(() => {
        renderer.destroy(element);
      }).not.toThrow();
    });
  });

  describe('getCellClass()', () => {
    it('should return class for external link', () => {
      renderer = new LinkRenderer({ target: '_blank' });
      params.value = 'https://example.com';
      const className = renderer.getCellClass(params);
      expect(className).toBe('zg-link-external');
    });

    it('should return class for internal link', () => {
      renderer = new LinkRenderer({ target: '_self' });
      params.value = 'https://example.com';
      const className = renderer.getCellClass(params);
      expect(className).toBe('zg-link-internal');
    });

    it('should return class for disabled link', () => {
      renderer = new LinkRenderer({ disabled: true });
      const className = renderer.getCellClass(params);
      expect(className).toBe('zg-link-disabled');
    });

    it('should return class for empty URL', () => {
      params.value = '';
      const className = renderer.getCellClass(params);
      expect(className).toBe('zg-link-disabled');
    });
  });

  describe('target attribute', () => {
    it('should set target to _blank', () => {
      renderer = new LinkRenderer({ target: '_blank' });
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.target).toBe('_blank');
    });

    it('should add rel="noopener noreferrer" for _blank', () => {
      renderer = new LinkRenderer({ target: '_blank' });
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.rel).toBe('noopener noreferrer');
    });

    it('should not add rel for _self', () => {
      renderer = new LinkRenderer({ target: '_self' });
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.rel).toBe('');
    });

    it('should respect noOpener option', () => {
      renderer = new LinkRenderer({ target: '_blank', noOpener: false });
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.rel).toBe('');
    });

    it('should add aria-label for _blank links', () => {
      renderer = new LinkRenderer({ target: '_blank' });
      params.value = 'https://example.com';
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.getAttribute('aria-label')).toBe('https://example.com (opens in new tab)');
    });
  });

  describe('urlPrefix option', () => {
    it('should prepend URL prefix to relative URLs', () => {
      renderer = new LinkRenderer({ urlPrefix: 'https://example.com/' });
      params.value = 'page';
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.href).toBe('https://example.com/page');
    });

    it('should not prepend prefix to absolute URLs', () => {
      renderer = new LinkRenderer({ urlPrefix: 'https://example.com/' });
      params.value = 'https://othersite.com';
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.href).toBe('https://othersite.com/');
    });

    it('should handle URLs with different protocols', () => {
      renderer = new LinkRenderer({ urlPrefix: 'https://' });
      params.value = 'ftp://files.example.com';
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.href).toBe('ftp://files.example.com/');
    });
  });

  describe('hrefField option', () => {
    it('should use hrefField value for URL', () => {
      renderer = new LinkRenderer({ hrefField: 'url' });
      params.rowData = { url: 'https://link.com', website: 'Display Text' };
      params.value = 'Display Text';
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.href).toBe('https://link.com/');
      expect(anchor.textContent).toBe('Display Text');
    });

    it('should fallback to value if hrefField not found', () => {
      renderer = new LinkRenderer({ hrefField: 'url' });
      params.rowData = { website: 'https://example.com' };
      params.value = 'https://example.com';
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.href).toBe('https://example.com/');
    });

    it('should handle missing rowData', () => {
      renderer = new LinkRenderer({ hrefField: 'url' });
      params.rowData = undefined;
      params.value = 'https://example.com';
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.href).toBe('https://example.com/');
    });
  });

  describe('label option', () => {
    it('should use static label', () => {
      renderer = new LinkRenderer({ label: 'Click Here' });
      params.value = 'https://example.com';
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.textContent).toBe('Click Here');
      expect(anchor.href).toBe('https://example.com/');
    });

    it('should use function label', () => {
      const labelFn = (params: RenderParams) => `Visit ${params.rowData?.name}`;
      renderer = new LinkRenderer({ label: labelFn });
      params.value = 'https://example.com';
      params.rowData = { name: 'Example Site' };
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.textContent).toBe('Visit Example Site');
    });

    it('should update label when params change', () => {
      const labelFn = (params: RenderParams) => params.rowData?.label || 'Default';
      renderer = new LinkRenderer({ label: labelFn });
      params.rowData = { label: 'Old Label' };
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.textContent).toBe('Old Label');

      params.rowData = { label: 'New Label' };
      renderer.update(element, params);
      expect(anchor.textContent).toBe('New Label');
    });
  });

  describe('disabled option', () => {
    it('should render as disabled with static disabled', () => {
      renderer = new LinkRenderer({ disabled: true });
      params.value = 'https://example.com';
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.hasAttribute('href')).toBe(false);
      expect(anchor.style.color).toBe('rgb(153, 153, 153)');
      expect(anchor.style.cursor).toBe('not-allowed');
      expect(anchor.getAttribute('aria-disabled')).toBe('true');
    });

    it('should render as disabled with function returning true', () => {
      const disabledFn = (params: RenderParams) => !params.rowData?.active;
      renderer = new LinkRenderer({ disabled: disabledFn });
      params.rowData = { active: false };
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.hasAttribute('href')).toBe(false);
      expect(anchor.getAttribute('aria-disabled')).toBe('true');
    });

    it('should render as active with function returning false', () => {
      const disabledFn = (params: RenderParams) => !params.rowData?.active;
      renderer = new LinkRenderer({ disabled: disabledFn });
      params.rowData = { active: true };
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.hasAttribute('href')).toBe(true);
      expect(anchor.hasAttribute('aria-disabled')).toBe(false);
    });

    it('should toggle disabled state on update', () => {
      const disabledFn = (params: RenderParams) => !params.rowData?.active;
      renderer = new LinkRenderer({ disabled: disabledFn });
      params.rowData = { active: true };
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.hasAttribute('href')).toBe(true);

      params.rowData = { active: false };
      renderer.update(element, params);
      expect(anchor.hasAttribute('href')).toBe(false);
      expect(anchor.getAttribute('aria-disabled')).toBe('true');
    });

    it('should render as disabled when URL is empty', () => {
      params.value = '';
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.hasAttribute('href')).toBe(false);
      expect(anchor.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('onClick callback', () => {
    it('should call onClick with URL and params', () => {
      const onClick = jest.fn();
      renderer = new LinkRenderer({ onClick });

      params.value = 'https://example.com';
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      anchor.click();

      expect(onClick).toHaveBeenCalledWith('https://example.com', params);
    });

    it('should prevent default navigation', () => {
      const onClick = jest.fn();
      renderer = new LinkRenderer({ onClick });

      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      const event = new Event('click', { bubbles: true, cancelable: true });
      anchor.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });

    it('should stop event propagation', () => {
      const onClick = jest.fn();
      const elementClickHandler = jest.fn();
      element.addEventListener('click', elementClickHandler);

      renderer = new LinkRenderer({ onClick });
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      anchor.click();

      expect(onClick).toHaveBeenCalled();
      expect(elementClickHandler).not.toHaveBeenCalled();
    });
  });

  describe('value handling', () => {
    it('should handle null value', () => {
      params.value = null;
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.textContent).toBe('');
    });

    it('should handle undefined value', () => {
      params.value = undefined;
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.textContent).toBe('');
    });

    it('should convert number to string', () => {
      params.value = 12345;
      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.textContent).toBe('12345');
    });
  });

  describe('createLinkRenderer factory', () => {
    it('should create renderer instance', () => {
      const renderer = createLinkRenderer();
      expect(renderer).toBeInstanceOf(LinkRenderer);
    });

    it('should pass options to constructor', () => {
      const onClick = jest.fn();
      const renderer = createLinkRenderer({
        target: '_blank',
        onClick,
      });

      renderer.render(element, params);

      const anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.target).toBe('_blank');
    });
  });

  describe('render/update lifecycle', () => {
    it('should support render -> update -> destroy cycle', () => {
      // Initial render
      params.value = 'https://example.com';
      renderer.render(element, params);

      let anchor = element.querySelector('a') as HTMLAnchorElement;
      expect(anchor.href).toBe('https://example.com/');

      // Update 1
      params.value = 'https://newsite.com';
      renderer.update(element, params);
      expect(anchor.href).toBe('https://newsite.com/');

      // Update 2
      params.value = 'https://anothersite.com';
      renderer.update(element, params);
      expect(anchor.href).toBe('https://anothersite.com/');

      // Destroy
      renderer.destroy(element);
      expect(element.innerHTML).toBe('');
    });

    it('should handle multiple render calls on same element', () => {
      renderer.render(element, params);

      // Second render should replace content
      params.value = 'https://newsite.com';
      renderer.render(element, params);

      const anchors = element.querySelectorAll('a');
      expect(anchors.length).toBe(1);

      const anchor = anchors[0] as HTMLAnchorElement;
      expect(anchor.href).toBe('https://newsite.com/');
    });
  });
});
