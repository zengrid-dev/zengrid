/**
 * @jest-environment jsdom
 */

import { CheckboxRenderer, createCheckboxRenderer } from '../checkbox';
import type { RenderParams } from '../renderer.interface';

describe('CheckboxRenderer', () => {
  let renderer: CheckboxRenderer;
  let element: HTMLElement;
  let params: RenderParams;

  beforeEach(() => {
    renderer = new CheckboxRenderer();
    element = document.createElement('div');
    params = {
      cell: { row: 0, col: 0 },
      position: { x: 0, y: 0, width: 100, height: 30 },
      value: true,
      column: { field: 'selected', header: 'Select' },
      rowData: { id: 1, selected: true },
      isSelected: false,
      isActive: false,
      isEditing: false,
    } as RenderParams;
  });

  describe('constructor', () => {
    it('should create renderer with default options', () => {
      const renderer = new CheckboxRenderer();
      expect(renderer).toBeInstanceOf(CheckboxRenderer);
    });

    it('should accept custom options', () => {
      const onChange = jest.fn();
      const renderer = new CheckboxRenderer({
        checkedValue: 1,
        uncheckedValue: 0,
        disabled: true,
        onChange,
      });
      expect(renderer).toBeInstanceOf(CheckboxRenderer);
    });
  });

  describe('render()', () => {
    it('should create checkbox input element', () => {
      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]');
      expect(checkbox).toBeTruthy();
    });

    it('should add container class', () => {
      renderer.render(element, params);

      expect(element.classList.contains('zg-cell-checkbox-container')).toBe(true);
    });

    it('should create wrapper div', () => {
      renderer.render(element, params);

      const wrapper = element.querySelector('.zg-checkbox-wrapper');
      expect(wrapper).toBeTruthy();
    });

    it('should set checked state for truthy value', () => {
      params.value = true;
      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should set unchecked state for falsy value', () => {
      params.value = false;
      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it('should handle custom checked/unchecked values', () => {
      renderer = new CheckboxRenderer({
        checkedValue: 'yes',
        uncheckedValue: 'no',
      });

      params.value = 'yes';
      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should set data attributes', () => {
      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.dataset.row).toBe('0');
      expect(checkbox.dataset.col).toBe('0');
      expect(checkbox.dataset.field).toBe('selected');
    });

    it('should set ARIA attributes', () => {
      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.getAttribute('role')).toBe('checkbox');
      expect(checkbox.getAttribute('aria-checked')).toBe('true');
      expect(checkbox.getAttribute('aria-label')).toContain('selected');
      expect(checkbox.getAttribute('aria-label')).toContain('row 0');
    });

    it('should set disabled state when configured', () => {
      renderer = new CheckboxRenderer({ disabled: true });
      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.disabled).toBe(true);
      expect(checkbox.getAttribute('aria-disabled')).toBe('true');
    });

    it('should set indeterminate state for null value', () => {
      renderer = new CheckboxRenderer({ indeterminate: true });
      params.value = null;
      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(true);
      expect(checkbox.getAttribute('aria-checked')).toBe('mixed');
    });

    it('should attach change event listener', () => {
      const onChange = jest.fn();
      renderer = new CheckboxRenderer({ onChange });

      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('update()', () => {
    beforeEach(() => {
      renderer.render(element, params);
    });

    it('should update checked state when value changes', () => {
      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);

      params.value = false;
      renderer.update(element, params);

      expect(checkbox.checked).toBe(false);
    });

    it('should update indeterminate state', () => {
      renderer = new CheckboxRenderer({ indeterminate: true });
      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(false);

      params.value = null;
      renderer.update(element, params);

      expect(checkbox.indeterminate).toBe(true);
    });

    it('should update ARIA attributes', () => {
      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;

      params.value = false;
      renderer.update(element, params);

      expect(checkbox.getAttribute('aria-checked')).toBe('false');
    });

    it('should handle custom values in update', () => {
      renderer = new CheckboxRenderer({
        checkedValue: 1,
        uncheckedValue: 0,
      });
      params.value = 1;
      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);

      params.value = 0;
      renderer.update(element, params);

      expect(checkbox.checked).toBe(false);
    });

    it('should do nothing if checkbox element not found', () => {
      element.innerHTML = ''; // Remove checkbox

      expect(() => {
        renderer.update(element, params);
      }).not.toThrow();
    });
  });

  describe('destroy()', () => {
    it('should remove event listeners', () => {
      const onChange = jest.fn();
      renderer = new CheckboxRenderer({ onChange });

      renderer.render(element, params);
      renderer.destroy(element);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      if (checkbox) {
        checkbox.click();
        expect(onChange).not.toHaveBeenCalled();
      }
    });

    it('should clear element content', () => {
      renderer.render(element, params);
      renderer.destroy(element);

      expect(element.innerHTML).toBe('');
    });

    it('should remove container class', () => {
      renderer.render(element, params);
      renderer.destroy(element);

      expect(element.classList.contains('zg-cell-checkbox-container')).toBe(false);
    });

    it('should handle destroy when no checkbox exists', () => {
      expect(() => {
        renderer.destroy(element);
      }).not.toThrow();
    });
  });

  describe('getCellClass()', () => {
    it('should return class for checked value', () => {
      params.value = true;
      const className = renderer.getCellClass(params);

      expect(className).toBe('zg-cell-checkbox-checked');
    });

    it('should return undefined for unchecked value', () => {
      params.value = false;
      const className = renderer.getCellClass(params);

      expect(className).toBeUndefined();
    });

    it('should work with custom checked values', () => {
      renderer = new CheckboxRenderer({
        checkedValue: 'active',
        uncheckedValue: 'inactive',
      });

      params.value = 'active';
      expect(renderer.getCellClass(params)).toBe('zg-cell-checkbox-checked');

      params.value = 'inactive';
      expect(renderer.getCellClass(params)).toBeUndefined();
    });
  });

  describe('onChange callback', () => {
    it('should call onChange with new value and params', () => {
      const onChange = jest.fn();
      renderer = new CheckboxRenderer({ onChange });

      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change'));

      expect(onChange).toHaveBeenCalledWith(false, params);
    });

    it('should use custom checked/unchecked values in onChange', () => {
      const onChange = jest.fn();
      renderer = new CheckboxRenderer({
        checkedValue: 1,
        uncheckedValue: 0,
        onChange,
      });

      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;

      // Uncheck
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change'));
      expect(onChange).toHaveBeenLastCalledWith(0, params);

      // Check
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
      expect(onChange).toHaveBeenLastCalledWith(1, params);
    });

    it('should stop event propagation', () => {
      const elementClickHandler = jest.fn();
      element.addEventListener('change', elementClickHandler);

      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));

      expect(elementClickHandler).not.toHaveBeenCalled();
    });
  });

  describe('tri-state behavior', () => {
    beforeEach(() => {
      renderer = new CheckboxRenderer({ indeterminate: true });
    });

    it('should show checked state for checked value', () => {
      params.value = true;
      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
      expect(checkbox.indeterminate).toBe(false);
      expect(checkbox.getAttribute('aria-checked')).toBe('true');
    });

    it('should show unchecked state for unchecked value', () => {
      params.value = false;
      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
      expect(checkbox.indeterminate).toBe(false);
      expect(checkbox.getAttribute('aria-checked')).toBe('false');
    });

    it('should show indeterminate state for null value', () => {
      params.value = null;
      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(true);
      expect(checkbox.getAttribute('aria-checked')).toBe('mixed');
    });
  });

  describe('createCheckboxRenderer factory', () => {
    it('should create renderer instance', () => {
      const renderer = createCheckboxRenderer();
      expect(renderer).toBeInstanceOf(CheckboxRenderer);
    });

    it('should pass options to constructor', () => {
      const onChange = jest.fn();
      const renderer = createCheckboxRenderer({
        checkedValue: 'Y',
        uncheckedValue: 'N',
        onChange,
      });

      params.value = 'Y';
      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('render/update lifecycle', () => {
    it('should support render -> update -> destroy cycle', () => {
      // Initial render
      params.value = true;
      renderer.render(element, params);

      let checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);

      // Update 1
      params.value = false;
      renderer.update(element, params);
      expect(checkbox.checked).toBe(false);

      // Update 2
      params.value = true;
      renderer.update(element, params);
      expect(checkbox.checked).toBe(true);

      // Destroy
      renderer.destroy(element);
      expect(element.innerHTML).toBe('');
    });

    it('should handle multiple render calls on same element', () => {
      renderer.render(element, params);

      // Second render should replace content
      params.value = false;
      renderer.render(element, params);

      const checkboxes = element.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBe(1);

      const checkbox = checkboxes[0] as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('should set appropriate ARIA role', () => {
      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.getAttribute('role')).toBe('checkbox');
    });

    it('should provide descriptive aria-label', () => {
      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      const label = checkbox.getAttribute('aria-label');

      expect(label).toContain('selected');
      expect(label).toContain('row 0');
    });

    it('should handle missing column field in aria-label', () => {
      params.column = undefined;
      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      const label = checkbox.getAttribute('aria-label');

      expect(label).toContain('checkbox');
    });

    it('should update aria-checked on value change', () => {
      params.value = true;
      renderer.render(element, params);

      const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.getAttribute('aria-checked')).toBe('true');

      params.value = false;
      renderer.update(element, params);
      expect(checkbox.getAttribute('aria-checked')).toBe('false');
    });
  });
});
