/**
 * @jest-environment jsdom
 */

import {
  SelectRenderer,
  createSelectRenderer,
  type SelectOption,
} from '../select';
import type { RenderParams } from '../renderer.interface';

describe('SelectRenderer', () => {
  let renderer: SelectRenderer;
  let element: HTMLElement;
  let params: RenderParams;

  const defaultOptions: SelectOption[] = [
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
    { label: 'Option 3', value: 'opt3' },
  ];

  beforeEach(() => {
    renderer = new SelectRenderer({ options: defaultOptions });
    element = document.createElement('div');
    params = {
      cell: { row: 0, col: 0 },
      position: { x: 0, y: 0, width: 150, height: 30 },
      value: 'opt1',
      column: { field: 'status', header: 'Status' },
      rowData: { id: 1, status: 'opt1' },
      isSelected: false,
      isActive: false,
      isEditing: false,
    } as RenderParams;
  });

  // ========================================
  // Constructor Tests
  // ========================================

  describe('Constructor', () => {
    it('should require at least one option', () => {
      expect(() => new SelectRenderer({ options: [] })).toThrow(
        'SelectRenderer requires at least one option'
      );
    });

    it('should set default placeholder', () => {
      const renderer = new SelectRenderer({ options: defaultOptions });
      expect(renderer['options'].placeholder).toBeUndefined();
    });

    it('should set custom placeholder', () => {
      const renderer = new SelectRenderer({
        options: defaultOptions,
        placeholder: 'Choose...',
      });
      expect(renderer['options'].placeholder).toBe('Choose...');
    });

    it('should set default className', () => {
      const renderer = new SelectRenderer({ options: defaultOptions });
      expect(renderer['options'].className).toBe('zg-select');
    });

    it('should set custom className', () => {
      const renderer = new SelectRenderer({
        options: defaultOptions,
        className: 'custom-select',
      });
      expect(renderer['options'].className).toBe('custom-select');
    });

    it('should default to single-select mode', () => {
      const renderer = new SelectRenderer({ options: defaultOptions });
      expect(renderer['options'].multiple).toBe(false);
      expect(renderer['options'].size).toBe(1);
    });

    it('should enable multi-select mode', () => {
      const renderer = new SelectRenderer({
        options: defaultOptions,
        multiple: true,
      });
      expect(renderer['options'].multiple).toBe(true);
      expect(renderer['options'].size).toBe(4);
    });

    it('should set custom size', () => {
      const renderer = new SelectRenderer({
        options: defaultOptions,
        multiple: true,
        size: 8,
      });
      expect(renderer['options'].size).toBe(8);
    });

    it('should accept onChange callback', () => {
      const onChange = jest.fn();
      const renderer = new SelectRenderer({
        options: defaultOptions,
        onChange,
      });
      expect(renderer['options'].onChange).toBe(onChange);
    });
  });

  // ========================================
  // render() Tests
  // ========================================

  describe('render()', () => {
    it('should create select element', () => {
      renderer.render(element, params);

      const select = element.querySelector('select');
      expect(select).toBeTruthy();
      expect(select?.tagName).toBe('SELECT');
    });

    it('should add cell class', () => {
      renderer.render(element, params);
      expect(element.classList.contains('zg-cell-select')).toBe(true);
    });

    it('should apply custom className', () => {
      const renderer = new SelectRenderer({
        options: defaultOptions,
        className: 'custom-select',
      });
      renderer.render(element, params);

      const select = element.querySelector('select');
      expect(select?.className).toBe('custom-select');
    });

    it('should create options from config', () => {
      renderer.render(element, params);

      const select = element.querySelector('select');
      const options = select?.querySelectorAll('option');

      // Should have 3 options (no placeholder in default)
      expect(options?.length).toBe(3);
      expect(options?.[0].textContent).toBe('Option 1');
      expect(options?.[1].textContent).toBe('Option 2');
      expect(options?.[2].textContent).toBe('Option 3');
    });

    it('should add placeholder option in single-select mode', () => {
      const renderer = new SelectRenderer({
        options: defaultOptions,
        placeholder: 'Choose...',
      });
      renderer.render(element, params);

      const select = element.querySelector('select');
      const options = select?.querySelectorAll('option');

      // Should have 4 options (1 placeholder + 3 options)
      expect(options?.length).toBe(4);
      expect(options?.[0].textContent).toBe('Choose...');
      expect(options?.[0].value).toBe('');
      expect(options?.[0].disabled).toBe(true);
    });

    it('should not add placeholder in multi-select mode', () => {
      const renderer = new SelectRenderer({
        options: defaultOptions,
        placeholder: 'Choose...',
        multiple: true,
      });
      renderer.render(element, params);

      const select = element.querySelector('select');
      const options = select?.querySelectorAll('option');

      // Should have only 3 options (no placeholder)
      expect(options?.length).toBe(3);
    });

    it('should select current value', () => {
      const params2 = { ...params, value: 'opt2' };
      renderer.render(element, params2);

      const select = element.querySelector('select') as HTMLSelectElement;
      const selectedOption = select.selectedOptions[0];

      expect(selectedOption).toBeTruthy();
      expect(JSON.parse(selectedOption.value)).toBe('opt2');
      expect(selectedOption.textContent).toBe('Option 2');
    });

    it('should set multiple attribute for multi-select', () => {
      const renderer = new SelectRenderer({
        options: defaultOptions,
        multiple: true,
      });
      renderer.render(element, params);

      const select = element.querySelector('select') as HTMLSelectElement;
      expect(select.multiple).toBe(true);
      expect(select.size).toBe(4);
    });

    it('should attach onChange handler', () => {
      const onChange = jest.fn();
      const renderer = new SelectRenderer({
        options: defaultOptions,
        onChange,
      });
      renderer.render(element, params);

      const select = element.querySelector('select') as HTMLSelectElement;
      select.value = JSON.stringify('opt2');
      select.dispatchEvent(new Event('change'));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('opt2', params);
    });

    it('should delegate to update()', () => {
      const updateSpy = jest.spyOn(renderer, 'update');
      renderer.render(element, params);

      expect(updateSpy).toHaveBeenCalledWith(element, params);
    });
  });

  // ========================================
  // update() Tests
  // ========================================

  describe('update()', () => {
    beforeEach(() => {
      renderer.render(element, params);
    });

    it('should update selected value', () => {
      const params2 = { ...params, value: 'opt3' };
      renderer.update(element, params2);

      const select = element.querySelector('select') as HTMLSelectElement;
      const selectedOption = select.selectedOptions[0];

      expect(JSON.parse(selectedOption.value)).toBe('opt3');
      expect(selectedOption.textContent).toBe('Option 3');
    });

    it('should update data attributes', () => {
      const params2 = {
        ...params,
        cell: { row: 5, col: 2 },
        column: { field: 'priority', header: 'Priority' },
      };
      renderer.update(element, params2);

      const select = element.querySelector('select') as HTMLSelectElement;
      expect(select.dataset.row).toBe('5');
      expect(select.dataset.col).toBe('2');
      expect(select.dataset.field).toBe('priority');
    });

    it('should rebuild options on update', () => {
      renderer.update(element, params);

      const select = element.querySelector('select');
      const options = select?.querySelectorAll('option');
      expect(options?.length).toBe(3);
    });

    it('should handle null value', () => {
      const params2 = { ...params, value: null };
      renderer.update(element, params2);

      const select = element.querySelector('select') as HTMLSelectElement;
      expect(select.selectedIndex).toBe(-1);
    });

    it('should handle undefined value', () => {
      const params2 = { ...params, value: undefined };
      renderer.update(element, params2);

      const select = element.querySelector('select') as HTMLSelectElement;
      expect(select.selectedIndex).toBe(-1);
    });
  });

  // ========================================
  // destroy() Tests
  // ========================================

  describe('destroy()', () => {
    it('should remove select element', () => {
      renderer.render(element, params);
      renderer.destroy(element);

      const select = element.querySelector('select');
      expect(select).toBeNull();
    });

    it('should remove cell class', () => {
      renderer.render(element, params);
      renderer.destroy(element);

      expect(element.classList.contains('zg-cell-select')).toBe(false);
    });

    it('should remove event handler', () => {
      const onChange = jest.fn();
      const renderer = new SelectRenderer({
        options: defaultOptions,
        onChange,
      });
      renderer.render(element, params);

      const select = element.querySelector('select') as HTMLSelectElement;

      renderer.destroy(element);

      // Try to trigger event after destroy
      select.value = JSON.stringify('opt2');
      select.dispatchEvent(new Event('change'));

      // Should not be called since handler was removed
      expect(onChange).toHaveBeenCalledTimes(0);
    });

    it('should clear event handlers map', () => {
      const onChange = jest.fn();
      const renderer = new SelectRenderer({
        options: defaultOptions,
        onChange,
      });
      renderer.render(element, params);

      expect(renderer['eventHandlers'].size).toBe(1);

      renderer.destroy(element);

      expect(renderer['eventHandlers'].size).toBe(0);
    });
  });

  // ========================================
  // getCellClass() Tests
  // ========================================

  describe('getCellClass()', () => {
    it('should return empty class for null value', () => {
      const params2 = { ...params, value: null };
      const className = renderer.getCellClass(params2);
      expect(className).toBe('zg-select-empty');
    });

    it('should return empty class for undefined value', () => {
      const params2 = { ...params, value: undefined };
      const className = renderer.getCellClass(params2);
      expect(className).toBe('zg-select-empty');
    });

    it('should return has-value class for selected value', () => {
      const className = renderer.getCellClass(params);
      expect(className).toBe('zg-select-has-value');
    });

    it('should return empty class for empty multi-select array', () => {
      const renderer = new SelectRenderer({
        options: defaultOptions,
        multiple: true,
      });
      const params2 = { ...params, value: [] };
      const className = renderer.getCellClass(params2);
      expect(className).toBe('zg-select-empty');
    });

    it('should return multiple class for multi-select with multiple values', () => {
      const renderer = new SelectRenderer({
        options: defaultOptions,
        multiple: true,
      });
      const params2 = { ...params, value: ['opt1', 'opt2'] };
      const className = renderer.getCellClass(params2);
      expect(className).toBe('zg-select-multiple');
    });

    it('should return has-value class for multi-select with single value', () => {
      const renderer = new SelectRenderer({
        options: defaultOptions,
        multiple: true,
      });
      const params2 = { ...params, value: ['opt1'] };
      const className = renderer.getCellClass(params2);
      expect(className).toBe('zg-select-has-value');
    });
  });

  // ========================================
  // Single-Select Mode Tests
  // ========================================

  describe('Single-Select Mode', () => {
    it('should have size=1 by default', () => {
      renderer.render(element, params);

      const select = element.querySelector('select') as HTMLSelectElement;
      expect(select.size).toBe(1);
    });

    it('should not have multiple attribute', () => {
      renderer.render(element, params);

      const select = element.querySelector('select') as HTMLSelectElement;
      expect(select.multiple).toBe(false);
    });

    it('should trigger onChange with single value', () => {
      const onChange = jest.fn();
      const renderer = new SelectRenderer({
        options: defaultOptions,
        onChange,
      });
      renderer.render(element, params);

      const select = element.querySelector('select') as HTMLSelectElement;
      const options = select.querySelectorAll('option');
      options[1].selected = true;
      select.dispatchEvent(new Event('change'));

      expect(onChange).toHaveBeenCalledWith('opt2', params);
    });

    it('should trigger onChange with null for placeholder selection', () => {
      const onChange = jest.fn();
      const renderer = new SelectRenderer({
        options: defaultOptions,
        placeholder: 'Choose...',
        onChange,
      });
      const params2 = { ...params, value: 'opt1' };
      renderer.render(element, params2);

      const select = element.querySelector('select') as HTMLSelectElement;
      select.selectedIndex = 0; // Select placeholder
      select.dispatchEvent(new Event('change'));

      expect(onChange).toHaveBeenCalledWith(null, params2);
    });
  });

  // ========================================
  // Multi-Select Mode Tests
  // ========================================

  describe('Multi-Select Mode', () => {
    let multiRenderer: SelectRenderer;

    beforeEach(() => {
      multiRenderer = new SelectRenderer({
        options: defaultOptions,
        multiple: true,
        size: 5,
      });
    });

    it('should have multiple attribute', () => {
      multiRenderer.render(element, params);

      const select = element.querySelector('select') as HTMLSelectElement;
      expect(select.multiple).toBe(true);
    });

    it('should have custom size', () => {
      multiRenderer.render(element, params);

      const select = element.querySelector('select') as HTMLSelectElement;
      expect(select.size).toBe(5);
    });

    it('should select multiple values', () => {
      const params2 = { ...params, value: ['opt1', 'opt3'] };
      multiRenderer.render(element, params2);

      const select = element.querySelector('select') as HTMLSelectElement;
      const selectedOptions = Array.from(select.selectedOptions);

      expect(selectedOptions.length).toBe(2);
      expect(JSON.parse(selectedOptions[0].value)).toBe('opt1');
      expect(JSON.parse(selectedOptions[1].value)).toBe('opt3');
    });

    it('should trigger onChange with array of values', () => {
      const onChange = jest.fn();
      const renderer = new SelectRenderer({
        options: defaultOptions,
        multiple: true,
        onChange,
      });
      renderer.render(element, params);

      const select = element.querySelector('select') as HTMLSelectElement;
      const options = Array.from(select.querySelectorAll('option'));
      options[0].selected = true;
      options[2].selected = true;
      select.dispatchEvent(new Event('change'));

      expect(onChange).toHaveBeenCalledWith(['opt1', 'opt3'], params);
    });

    it('should handle empty multi-select', () => {
      const onChange = jest.fn();
      const renderer = new SelectRenderer({
        options: defaultOptions,
        multiple: true,
        onChange,
      });
      const params2 = { ...params, value: ['opt1'] };
      renderer.render(element, params2);

      const select = element.querySelector('select') as HTMLSelectElement;
      const options = Array.from(select.querySelectorAll('option'));
      options.forEach(opt => (opt.selected = false));
      select.dispatchEvent(new Event('change'));

      expect(onChange).toHaveBeenCalledWith([], params2);
    });
  });

  // ========================================
  // Option Grouping Tests
  // ========================================

  describe('Option Grouping', () => {
    const groupedOptions: SelectOption[] = [
      { label: 'Red', value: 'red', group: 'Colors' },
      { label: 'Green', value: 'green', group: 'Colors' },
      { label: 'Blue', value: 'blue', group: 'Colors' },
      { label: 'Circle', value: 'circle', group: 'Shapes' },
      { label: 'Square', value: 'square', group: 'Shapes' },
      { label: 'Other', value: 'other' }, // Ungrouped
    ];

    it('should create optgroup elements', () => {
      const renderer = new SelectRenderer({ options: groupedOptions });
      renderer.render(element, params);

      const select = element.querySelector('select');
      const optgroups = select?.querySelectorAll('optgroup');

      expect(optgroups?.length).toBe(2);
      expect(optgroups?.[0].label).toBe('Colors');
      expect(optgroups?.[1].label).toBe('Shapes');
    });

    it('should add ungrouped options directly', () => {
      const renderer = new SelectRenderer({ options: groupedOptions });
      renderer.render(element, params);

      const select = element.querySelector('select');
      const directOptions = Array.from(select?.children || []).filter(
        child => child.tagName === 'OPTION'
      );

      expect(directOptions.length).toBe(1);
      expect(directOptions[0].textContent).toBe('Other');
    });

    it('should place options under correct group', () => {
      const renderer = new SelectRenderer({ options: groupedOptions });
      renderer.render(element, params);

      const select = element.querySelector('select');
      const colorsGroup = select?.querySelector('optgroup[label="Colors"]');
      const colorsOptions = colorsGroup?.querySelectorAll('option');

      expect(colorsOptions?.length).toBe(3);
      expect(colorsOptions?.[0].textContent).toBe('Red');
      expect(colorsOptions?.[1].textContent).toBe('Green');
      expect(colorsOptions?.[2].textContent).toBe('Blue');
    });
  });

  // ========================================
  // Disabled Options Tests
  // ========================================

  describe('Disabled Options', () => {
    const optionsWithDisabled: SelectOption[] = [
      { label: 'Option 1', value: 'opt1' },
      { label: 'Option 2', value: 'opt2', disabled: true },
      { label: 'Option 3', value: 'opt3' },
    ];

    it('should mark disabled options', () => {
      const renderer = new SelectRenderer({ options: optionsWithDisabled });
      renderer.render(element, params);

      const select = element.querySelector('select');
      const options = select?.querySelectorAll('option');

      expect(options?.[0].disabled).toBe(false);
      expect(options?.[1].disabled).toBe(true);
      expect(options?.[2].disabled).toBe(false);
    });

    it('should not allow selecting disabled option', () => {
      const renderer = new SelectRenderer({ options: optionsWithDisabled });
      renderer.render(element, params);

      const select = element.querySelector('select');
      const options = select?.querySelectorAll('option');

      expect(options?.[1].disabled).toBe(true);
    });
  });

  // ========================================
  // Complex Value Tests
  // ========================================

  describe('Complex Values', () => {
    const complexOptions: SelectOption[] = [
      { label: 'User 1', value: { id: 1, name: 'John' } },
      { label: 'User 2', value: { id: 2, name: 'Jane' } },
      { label: 'User 3', value: { id: 3, name: 'Bob' } },
    ];

    it('should handle object values', () => {
      const renderer = new SelectRenderer({ options: complexOptions });
      const params2 = { ...params, value: { id: 2, name: 'Jane' } };
      renderer.render(element, params2);

      const select = element.querySelector('select') as HTMLSelectElement;
      const selectedOption = select.selectedOptions[0];

      expect(selectedOption.textContent).toBe('User 2');
      expect(JSON.parse(selectedOption.value)).toEqual({ id: 2, name: 'Jane' });
    });

    it('should trigger onChange with object value', () => {
      const onChange = jest.fn();
      const renderer = new SelectRenderer({
        options: complexOptions,
        onChange,
      });
      renderer.render(element, params);

      const select = element.querySelector('select') as HTMLSelectElement;
      select.selectedIndex = 1;
      select.dispatchEvent(new Event('change'));

      expect(onChange).toHaveBeenCalledWith({ id: 2, name: 'Jane' }, params);
    });

    it('should deep compare object values', () => {
      const renderer = new SelectRenderer({ options: complexOptions });
      const params2 = {
        ...params,
        value: { id: 1, name: 'John' }, // New object with same values
      };
      renderer.render(element, params2);

      const select = element.querySelector('select') as HTMLSelectElement;
      const selectedOption = select.selectedOptions[0];

      expect(selectedOption.textContent).toBe('User 1');
    });
  });

  // ========================================
  // ARIA Attributes Tests
  // ========================================

  describe('ARIA Attributes', () => {
    it('should set aria-label', () => {
      renderer.render(element, params);

      const select = element.querySelector('select') as HTMLSelectElement;
      expect(select.getAttribute('aria-label')).toBe('Status select');
    });

    it('should use field name if no header', () => {
      const params2 = {
        ...params,
        column: { field: 'status', header: 'status' },
      };
      renderer.render(element, params2);

      const select = element.querySelector('select') as HTMLSelectElement;
      expect(select.getAttribute('aria-label')).toBe('status select');
    });

    it('should set aria-multiselectable for multi-select', () => {
      const renderer = new SelectRenderer({
        options: defaultOptions,
        multiple: true,
      });
      renderer.render(element, params);

      const select = element.querySelector('select') as HTMLSelectElement;
      expect(select.getAttribute('aria-multiselectable')).toBe('true');
    });

    it('should not set aria-multiselectable for single-select', () => {
      renderer.render(element, params);

      const select = element.querySelector('select') as HTMLSelectElement;
      expect(select.getAttribute('aria-multiselectable')).toBeNull();
    });
  });

  // ========================================
  // Lifecycle Tests
  // ========================================

  describe('Lifecycle', () => {
    it('should handle full lifecycle', () => {
      const onChange = jest.fn();
      const renderer = new SelectRenderer({
        options: defaultOptions,
        onChange,
      });

      // Render
      renderer.render(element, params);
      expect(element.querySelector('select')).toBeTruthy();

      // Update
      const params2 = { ...params, value: 'opt2' };
      renderer.update(element, params2);
      const select = element.querySelector('select') as HTMLSelectElement;
      expect(JSON.parse(select.selectedOptions[0].value)).toBe('opt2');

      // Trigger change
      select.selectedIndex = 2;
      select.dispatchEvent(new Event('change'));
      expect(onChange).toHaveBeenCalledWith('opt3', params2);

      // Destroy
      renderer.destroy(element);
      expect(element.querySelector('select')).toBeNull();
    });

    it('should support multiple update cycles', () => {
      renderer.render(element, params);

      for (let i = 0; i < 10; i++) {
        const value = defaultOptions[i % defaultOptions.length].value;
        const params2 = { ...params, value };
        renderer.update(element, params2);

        const select = element.querySelector('select') as HTMLSelectElement;
        expect(JSON.parse(select.selectedOptions[0].value)).toBe(value);
      }
    });
  });

  // ========================================
  // Edge Cases
  // ========================================

  describe('Edge Cases', () => {
    it('should handle empty string value', () => {
      const params2 = { ...params, value: '' };
      renderer.render(element, params2);

      const select = element.querySelector('select') as HTMLSelectElement;
      expect(select.selectedIndex).toBe(-1);
    });

    it('should handle value not in options', () => {
      const params2 = { ...params, value: 'nonexistent' };
      renderer.render(element, params2);

      const select = element.querySelector('select') as HTMLSelectElement;
      expect(select.selectedIndex).toBe(-1);
    });

    it('should handle options with same labels', () => {
      const duplicateOptions: SelectOption[] = [
        { label: 'Option', value: 'opt1' },
        { label: 'Option', value: 'opt2' },
        { label: 'Option', value: 'opt3' },
      ];
      const renderer = new SelectRenderer({ options: duplicateOptions });
      const params2 = { ...params, value: 'opt2' };
      renderer.render(element, params2);

      const select = element.querySelector('select') as HTMLSelectElement;
      expect(JSON.parse(select.selectedOptions[0].value)).toBe('opt2');
    });

    it('should handle update with no select element', () => {
      // Don't call render first
      expect(() => renderer.update(element, params)).not.toThrow();
    });

    it('should handle destroy with no select element', () => {
      // Don't call render first
      expect(() => renderer.destroy(element)).not.toThrow();
    });

    it('should handle numeric values', () => {
      const numericOptions: SelectOption[] = [
        { label: 'One', value: 1 },
        { label: 'Two', value: 2 },
        { label: 'Three', value: 3 },
      ];
      const renderer = new SelectRenderer({ options: numericOptions });
      const params2 = { ...params, value: 2 };
      renderer.render(element, params2);

      const select = element.querySelector('select') as HTMLSelectElement;
      expect(JSON.parse(select.selectedOptions[0].value)).toBe(2);
    });

    it('should handle boolean values', () => {
      const booleanOptions: SelectOption[] = [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ];
      const renderer = new SelectRenderer({ options: booleanOptions });
      const params2 = { ...params, value: false };
      renderer.render(element, params2);

      const select = element.querySelector('select') as HTMLSelectElement;
      expect(JSON.parse(select.selectedOptions[0].value)).toBe(false);
    });

    it('should stop event propagation on change', () => {
      const onChange = jest.fn();
      const parentClick = jest.fn();
      const renderer = new SelectRenderer({
        options: defaultOptions,
        onChange,
      });

      element.addEventListener('change', parentClick);
      renderer.render(element, params);

      const select = element.querySelector('select') as HTMLSelectElement;
      const changeEvent = new Event('change', { bubbles: true });
      const stopPropagationSpy = jest.spyOn(changeEvent, 'stopPropagation');

      select.dispatchEvent(changeEvent);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  // ========================================
  // Factory Function Tests
  // ========================================

  describe('createSelectRenderer()', () => {
    it('should create a SelectRenderer instance', () => {
      const renderer = createSelectRenderer({ options: defaultOptions });
      expect(renderer).toBeInstanceOf(SelectRenderer);
    });

    it('should pass options correctly', () => {
      const onChange = jest.fn();
      const renderer = createSelectRenderer({
        options: defaultOptions,
        placeholder: 'Select option...',
        onChange,
        multiple: true,
      });

      expect(renderer['options'].placeholder).toBe('Select option...');
      expect(renderer['options'].onChange).toBe(onChange);
      expect(renderer['options'].multiple).toBe(true);
    });
  });
});
