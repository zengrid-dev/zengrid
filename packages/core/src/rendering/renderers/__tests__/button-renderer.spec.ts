/**
 * @jest-environment jsdom
 */

import { ButtonRenderer, createButtonRenderer, type ButtonRendererOptions } from '../button';
import type { RenderParams } from '../renderer.interface';

describe('ButtonRenderer', () => {
  let element: HTMLElement;
  let params: RenderParams;

  beforeEach(() => {
    element = document.createElement('div');
    params = {
      cell: { row: 0, col: 0 },
      position: { x: 0, y: 0, width: 100, height: 30 },
      value: 'Click me',
      column: { field: 'action', header: 'Action' },
      rowData: { id: 1, name: 'Test', status: 'active' },
      isSelected: false,
      isActive: false,
      isEditing: false,
    } as RenderParams;
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });
      expect(renderer).toBeInstanceOf(ButtonRenderer);
    });

    it('should create instance with custom options', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({
        label: 'Delete',
        variant: 'danger',
        size: 'large',
        icon: '🗑️',
        className: 'custom-btn',
        disabled: false,
        onClick,
      });
      expect(renderer).toBeInstanceOf(ButtonRenderer);
    });

    it('should create instance with default onClick when onClick is missing', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const renderer = new ButtonRenderer({} as ButtonRendererOptions);
      expect(renderer).toBeInstanceOf(ButtonRenderer);

      // Verify default onClick logs a warning
      renderer.render(element, params);
      const button = element.querySelector('button');
      button?.click();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'ButtonRenderer: No onClick handler provided. Cell:',
        params.cell,
        'Value:',
        params.value
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('render()', () => {
    it('should create button element', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      renderer.render(element, params);

      const button = element.querySelector('button');
      expect(button).toBeTruthy();
      expect(button?.type).toBe('button');
    });

    it('should add container class', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      renderer.render(element, params);

      expect(element.classList.contains('zg-cell-button')).toBe(true);
    });

    it('should add click event listener', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      renderer.render(element, params);

      const button = element.querySelector('button');
      button?.click();

      expect(onClick).toHaveBeenCalledWith(params);
    });

    it('should render with static label', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ label: 'Delete', onClick });

      renderer.render(element, params);

      const button = element.querySelector('button');
      expect(button?.textContent).toBe('Delete');
    });

    it('should render with function label', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({
        label: (p) => (p.rowData?.status === 'active' ? 'Deactivate' : 'Activate'),
        onClick,
      });

      renderer.render(element, params);

      const button = element.querySelector('button');
      expect(button?.textContent).toBe('Deactivate');
    });

    it('should render with value as label when no label option', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      renderer.render(element, { ...params, value: 'Submit' });

      const button = element.querySelector('button');
      expect(button?.textContent).toBe('Submit');
    });

    it('should render with default label when no label and no value', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      renderer.render(element, { ...params, value: null });

      const button = element.querySelector('button');
      expect(button?.textContent).toBe('Button');
    });

    it('should render with icon', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ label: 'Edit', icon: '✏️', onClick });

      renderer.render(element, params);

      const icon = element.querySelector('.button-icon');
      expect(icon).toBeTruthy();
      expect(icon?.textContent).toBe('✏️');
    });
  });

  describe('update()', () => {
    it('should update button label', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ label: 'Click', onClick });

      renderer.render(element, params);

      const button = element.querySelector('button');
      expect(button?.textContent).toBe('Click');

      // Update with new params
      renderer.update(element, { ...params, value: 'Updated' });

      // Label should stay the same since we have a static label
      expect(button?.textContent).toBe('Click');
    });

    it('should update dynamic label', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({
        label: (p) => (p.rowData?.status === 'active' ? 'Deactivate' : 'Activate'),
        onClick,
      });

      renderer.render(element, params);
      let button = element.querySelector('button');
      expect(button?.textContent).toBe('Deactivate');

      // Update with new status
      const newParams = {
        ...params,
        rowData: { ...params.rowData, status: 'inactive' },
      };
      renderer.update(element, newParams);

      button = element.querySelector('button');
      expect(button?.textContent).toBe('Activate');
    });

    it('should update disabled state', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({
        label: 'Test',
        disabled: (p) => p.rowData?.locked === true,
        onClick,
      });

      // Initially not disabled
      renderer.render(element, { ...params, rowData: { locked: false } });
      let button = element.querySelector('button') as HTMLButtonElement;
      expect(button.disabled).toBe(false);

      // Update to disabled
      renderer.update(element, { ...params, rowData: { locked: true } });
      button = element.querySelector('button') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('should update ARIA attributes', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({
        label: 'Test',
        disabled: (p) => p.rowData?.locked === true,
        onClick,
      });

      renderer.render(element, { ...params, rowData: { locked: false } });
      let button = element.querySelector('button');
      expect(button?.getAttribute('aria-disabled')).toBeNull();

      renderer.update(element, { ...params, rowData: { locked: true } });
      button = element.querySelector('button');
      expect(button?.getAttribute('aria-disabled')).toBe('true');
    });

    it('should update data attributes', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ label: 'Test', onClick });

      renderer.render(element, params);

      const button = element.querySelector('button');
      expect(button?.dataset.row).toBe('0');
      expect(button?.dataset.col).toBe('0');
      expect(button?.dataset.field).toBe('action');

      // Update with different cell
      renderer.update(element, {
        ...params,
        cell: { row: 5, col: 2 },
        column: { field: 'edit', header: 'Edit' },
      });

      expect(button?.dataset.row).toBe('5');
      expect(button?.dataset.col).toBe('2');
      expect(button?.dataset.field).toBe('edit');
    });

    it('should update icon', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ label: 'Test', icon: '✏️', onClick });

      renderer.render(element, params);

      let icon = element.querySelector('.button-icon');
      expect(icon?.textContent).toBe('✏️');

      // Icon is static in options, but we can verify it persists
      renderer.update(element, params);
      icon = element.querySelector('.button-icon');
      expect(icon?.textContent).toBe('✏️');
    });
  });

  describe('destroy()', () => {
    it('should remove button element', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      renderer.render(element, params);
      expect(element.querySelector('button')).toBeTruthy();

      renderer.destroy(element);
      expect(element.querySelector('button')).toBeNull();
    });

    it('should remove event listeners', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      renderer.render(element, params);
      const button = element.querySelector('button');

      renderer.destroy(element);

      // Try to click after destroy
      button?.click();
      expect(onClick).not.toHaveBeenCalled();
    });

    it('should remove container class', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      renderer.render(element, params);
      expect(element.classList.contains('zg-cell-button')).toBe(true);

      renderer.destroy(element);
      expect(element.classList.contains('zg-cell-button')).toBe(false);
    });

    it('should clean up element innerHTML', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      renderer.render(element, params);
      expect(element.innerHTML).not.toBe('');

      renderer.destroy(element);
      expect(element.innerHTML).toBe('');
    });
  });

  describe('getCellClass()', () => {
    it('should return undefined for enabled button with default variant', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      const cellClass = renderer.getCellClass(params);
      expect(cellClass).toBeUndefined();
    });

    it('should return disabled class when button is disabled', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ disabled: true, onClick });

      const cellClass = renderer.getCellClass(params);
      expect(cellClass).toBe('zg-button-cell-disabled');
    });

    it('should return variant class for non-default variant', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ variant: 'danger', onClick });

      const cellClass = renderer.getCellClass(params);
      expect(cellClass).toBe('zg-button-cell-danger');
    });

    it('should prioritize disabled class over variant class', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ variant: 'primary', disabled: true, onClick });

      const cellClass = renderer.getCellClass(params);
      expect(cellClass).toBe('zg-button-cell-disabled');
    });
  });

  describe('variants', () => {
    it.each([
      ['button', 'rgb(255, 255, 255)', 'rgb(51, 51, 51)'],
      ['primary', 'rgb(0, 123, 255)', 'rgb(255, 255, 255)'],
      ['secondary', 'rgb(108, 117, 125)', 'rgb(255, 255, 255)'],
      ['danger', 'rgb(220, 53, 69)', 'rgb(255, 255, 255)'],
      ['success', 'rgb(40, 167, 69)', 'rgb(255, 255, 255)'],
      ['warning', 'rgb(255, 193, 7)', 'rgb(33, 37, 41)'],
    ])('should apply correct styles for %s variant', (variant, bgColor, textColor) => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({
        variant: variant as ButtonRendererOptions['variant'],
        onClick,
      });

      renderer.render(element, params);

      const button = element.querySelector('button') as HTMLButtonElement;
      expect(button.style.backgroundColor).toBe(bgColor);
      expect(button.style.color).toBe(textColor);
      expect(button.className).toContain(`zg-button-${variant}`);
    });
  });

  describe('sizes', () => {
    it.each([
      ['small', '4px 8px', '12px'],
      ['medium', '6px 12px', '14px'],
      ['large', '10px 20px', '16px'],
    ])('should apply correct styles for %s size', (size, padding, fontSize) => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({
        size: size as ButtonRendererOptions['size'],
        onClick,
      });

      renderer.render(element, params);

      const button = element.querySelector('button') as HTMLButtonElement;
      expect(button.style.padding).toBe(padding);
      expect(button.style.fontSize).toBe(fontSize);
      expect(button.className).toContain(`zg-button-${size}`);
    });
  });

  describe('disabled state', () => {
    it('should render as disabled when disabled is true', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ disabled: true, onClick });

      renderer.render(element, params);

      const button = element.querySelector('button') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
      expect(button.className).toContain('zg-button-disabled');
      expect(button.style.cursor).toBe('not-allowed');
      expect(button.style.backgroundColor).toBe('rgb(245, 245, 245)');
      expect(button.style.color).toBe('rgb(153, 153, 153)');
    });

    it('should render as enabled when disabled is false', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ disabled: false, onClick });

      renderer.render(element, params);

      const button = element.querySelector('button') as HTMLButtonElement;
      expect(button.disabled).toBe(false);
      expect(button.className).not.toContain('zg-button-disabled');
      expect(button.style.cursor).toBe('pointer');
    });

    it('should compute disabled state from function', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({
        disabled: (p) => p.rowData?.locked === true,
        onClick,
      });

      // Test with locked = true
      renderer.render(element, { ...params, rowData: { locked: true } });
      let button = element.querySelector('button') as HTMLButtonElement;
      expect(button.disabled).toBe(true);

      // Test with locked = false
      element.innerHTML = '';
      renderer.render(element, { ...params, rowData: { locked: false } });
      button = element.querySelector('button') as HTMLButtonElement;
      expect(button.disabled).toBe(false);
    });

    it('should not call onClick when disabled', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ disabled: true, onClick });

      renderer.render(element, params);

      const button = element.querySelector('button');
      button?.click();

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should dynamically enable/disable via update()', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({
        disabled: (p) => p.rowData?.locked === true,
        onClick,
      });

      // Start disabled
      renderer.render(element, { ...params, rowData: { locked: true } });
      let button = element.querySelector('button') as HTMLButtonElement;
      expect(button.disabled).toBe(true);

      // Update to enabled
      renderer.update(element, { ...params, rowData: { locked: false } });
      button = element.querySelector('button') as HTMLButtonElement;
      expect(button.disabled).toBe(false);

      // Try clicking (should work)
      button.click();
      expect(onClick).toHaveBeenCalledWith({ ...params, rowData: { locked: false } });
    });
  });

  describe('onClick callback', () => {
    it('should call onClick when button is clicked', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      renderer.render(element, params);

      const button = element.querySelector('button');
      button?.click();

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(params);
    });

    it('should prevent default and stop propagation', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      renderer.render(element, params);

      const button = element.querySelector('button');
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');

      button?.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should catch and log errors from onClick', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const onClick = jest.fn(() => {
        throw new Error('Test error');
      });
      const renderer = new ButtonRenderer({ onClick });

      renderer.render(element, params);

      const button = element.querySelector('button');
      button?.click();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'ButtonRenderer onClick error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('custom className', () => {
    it('should apply custom className', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ className: 'custom-btn', onClick });

      renderer.render(element, params);

      const button = element.querySelector('button');
      expect(button?.className).toContain('custom-btn');
    });

    it('should combine custom className with default classes', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({
        className: 'custom-btn',
        variant: 'primary',
        size: 'large',
        onClick,
      });

      renderer.render(element, params);

      const button = element.querySelector('button');
      expect(button?.className).toContain('zg-button');
      expect(button?.className).toContain('zg-button-primary');
      expect(button?.className).toContain('zg-button-large');
      expect(button?.className).toContain('custom-btn');
    });
  });

  describe('ARIA attributes', () => {
    it('should set role attribute', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      renderer.render(element, params);

      const button = element.querySelector('button');
      expect(button?.getAttribute('role')).toBe('button');
    });

    it('should set aria-label from label option', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ label: 'Delete Row', onClick });

      renderer.render(element, params);

      const button = element.querySelector('button');
      expect(button?.getAttribute('aria-label')).toBe('Delete Row');
    });

    it('should set aria-label from value when no label', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      renderer.render(element, { ...params, value: 'Edit' });

      const button = element.querySelector('button');
      expect(button?.getAttribute('aria-label')).toBe('Edit');
    });

    it('should set aria-disabled when disabled', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ disabled: true, onClick });

      renderer.render(element, params);

      const button = element.querySelector('button');
      expect(button?.getAttribute('aria-disabled')).toBe('true');
    });

    it('should not set aria-disabled when enabled', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ disabled: false, onClick });

      renderer.render(element, params);

      const button = element.querySelector('button');
      expect(button?.getAttribute('aria-disabled')).toBeNull();
    });
  });

  describe('data attributes', () => {
    it('should set data-row and data-col attributes', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      renderer.render(element, params);

      const button = element.querySelector('button');
      expect(button?.dataset.row).toBe('0');
      expect(button?.dataset.col).toBe('0');
    });

    it('should set data-field attribute when column has field', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      renderer.render(element, params);

      const button = element.querySelector('button');
      expect(button?.dataset.field).toBe('action');
    });

    it('should set data-variant attribute', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ variant: 'danger', onClick });

      renderer.render(element, params);

      const button = element.querySelector('button');
      expect(button?.dataset.variant).toBe('danger');
    });
  });

  describe('HTML escaping', () => {
    it('should escape HTML in label to prevent XSS', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ label: '<script>alert("xss")</script>', onClick });

      renderer.render(element, params);

      const button = element.querySelector('button');
      const labelSpan = button?.querySelector('.button-label');
      expect(labelSpan?.innerHTML).not.toContain('<script>');
      expect(labelSpan?.textContent).toBe('<script>alert("xss")</script>');
    });
  });

  describe('full lifecycle', () => {
    it('should handle multiple render-update-destroy cycles', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({
        label: (p) => `Button ${p.cell.row}`,
        onClick,
      });

      // First cycle
      renderer.render(element, params);
      let button = element.querySelector('button');
      expect(button?.textContent).toBe('Button 0');

      renderer.update(element, { ...params, cell: { row: 1, col: 0 } });
      button = element.querySelector('button');
      expect(button?.textContent).toBe('Button 1');

      renderer.destroy(element);
      expect(element.innerHTML).toBe('');

      // Second cycle
      renderer.render(element, { ...params, cell: { row: 2, col: 0 } });
      button = element.querySelector('button');
      expect(button?.textContent).toBe('Button 2');

      renderer.destroy(element);
      expect(element.innerHTML).toBe('');
    });

    it('should handle render -> update -> update -> destroy', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({
        label: (p) => (p.rowData?.status === 'active' ? 'Deactivate' : 'Activate'),
        disabled: (p) => p.rowData?.locked === true,
        onClick,
      });

      // Render
      renderer.render(element, { ...params, rowData: { status: 'active', locked: false } });
      let button = element.querySelector('button') as HTMLButtonElement;
      expect(button.textContent).toBe('Deactivate');
      expect(button.disabled).toBe(false);

      // First update
      renderer.update(element, { ...params, rowData: { status: 'inactive', locked: false } });
      button = element.querySelector('button') as HTMLButtonElement;
      expect(button.textContent).toBe('Activate');
      expect(button.disabled).toBe(false);

      // Second update
      renderer.update(element, { ...params, rowData: { status: 'inactive', locked: true } });
      button = element.querySelector('button') as HTMLButtonElement;
      expect(button.textContent).toBe('Activate');
      expect(button.disabled).toBe(true);

      // Destroy
      renderer.destroy(element);
      expect(element.innerHTML).toBe('');
    });
  });

  describe('factory function', () => {
    it('should create ButtonRenderer instance', () => {
      const onClick = jest.fn();
      const renderer = createButtonRenderer({ onClick });

      expect(renderer).toBeInstanceOf(ButtonRenderer);
    });

    it('should pass options correctly', () => {
      const onClick = jest.fn();
      const renderer = createButtonRenderer({
        label: 'Test',
        variant: 'primary',
        size: 'large',
        onClick,
      });

      renderer.render(element, params);

      const button = element.querySelector('button');
      expect(button?.textContent).toBe('Test');
      expect(button?.className).toContain('zg-button-primary');
      expect(button?.className).toContain('zg-button-large');
    });
  });

  describe('edge cases', () => {
    it('should handle null value', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      renderer.render(element, { ...params, value: null });

      const button = element.querySelector('button');
      expect(button?.textContent).toBe('Button');
    });

    it('should handle undefined value', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      renderer.render(element, { ...params, value: undefined });

      const button = element.querySelector('button');
      expect(button?.textContent).toBe('Button');
    });

    it('should handle empty string value', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      renderer.render(element, { ...params, value: '' });

      const button = element.querySelector('button');
      expect(button?.textContent).toBe('');
    });

    it('should handle numeric value', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      renderer.render(element, { ...params, value: 123 });

      const button = element.querySelector('button');
      expect(button?.textContent).toBe('123');
    });

    it('should handle missing column', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      renderer.render(element, { ...params, column: undefined });

      const button = element.querySelector('button');
      expect(button?.dataset.field).toBeUndefined();
    });

    it('should handle missing rowData', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({
        label: (p) => p.rowData?.name || 'Default',
        onClick,
      });

      renderer.render(element, { ...params, rowData: undefined });

      const button = element.querySelector('button');
      expect(button?.textContent).toBe('Default');
    });

    it('should handle button without icon', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ label: 'Test', onClick });

      renderer.render(element, params);

      const icon = element.querySelector('.button-icon');
      expect(icon).toBeNull();
    });

    it('should handle update before render gracefully', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      // Try to update without render
      renderer.update(element, params);

      // Should not throw, but button won't exist
      const button = element.querySelector('button');
      expect(button).toBeNull();
    });

    it('should handle destroy before render gracefully', () => {
      const onClick = jest.fn();
      const renderer = new ButtonRenderer({ onClick });

      // Try to destroy without render
      expect(() => {
        renderer.destroy(element);
      }).not.toThrow();
    });
  });
});
