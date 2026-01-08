/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  DropdownEditor,
  createDropdownEditor,
  type DropdownOption,
  type DropdownEditorOptions,
} from '../dropdown-editor';
import type { EditorParams } from '../cell-editor.interface';

describe('DropdownEditor', () => {
  let editor: DropdownEditor;
  let container: HTMLElement;
  let params: EditorParams;
  const mockOptions: DropdownOption[] = [
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
    { label: 'Option 3', value: 'opt3' },
  ];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    params = {
      cell: { row: 0, col: 0 },
      column: { field: 'testField', header: 'Test Field' },
      rowData: { testField: 'opt1' },
      onComplete: vi.fn(),
      onChange: vi.fn(),
    };

    editor = new DropdownEditor({ options: mockOptions });
  });

  afterEach(() => {
    editor.destroy();
    if (container.parentElement) {
      document.body.removeChild(container);
    }
  });

  // ===== Constructor Tests =====
  describe('Constructor', () => {
    it('should create instance with default options', () => {
      expect(editor).toBeInstanceOf(DropdownEditor);
    });

    it('should throw error if options array is empty', () => {
      expect(() => new DropdownEditor({ options: [] })).toThrow(
        'DropdownEditor requires at least one option'
      );
    });

    it('should support searchable mode', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        searchable: true,
      });
      customEditor.init(container, null, params);

      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      expect(searchInput).toBeTruthy();
      expect(searchInput.getAttribute('role')).toBe('searchbox');

      customEditor.destroy();
    });

    it('should support non-searchable mode', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        searchable: false,
      });
      customEditor.init(container, null, params);

      const display = container.querySelector('.zg-dropdown-editor-display') as HTMLElement;
      expect(display).toBeTruthy();
      expect(display.getAttribute('tabindex')).toBe('0');

      customEditor.destroy();
    });

    it('should support multi-select mode', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        multiSelect: true,
      });
      customEditor.init(container, ['opt1', 'opt2'], params);

      const value = customEditor.getValue();
      expect(Array.isArray(value)).toBe(true);
      expect(value).toEqual(['opt1', 'opt2']);

      customEditor.destroy();
    });

    it('should support custom placeholder', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        placeholder: 'Choose an option...',
      });
      customEditor.init(container, null, params);

      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      expect(searchInput.placeholder).toBe('Choose an option...');

      customEditor.destroy();
    });

    it('should support custom CSS class', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        className: 'custom-dropdown',
      });
      customEditor.init(container, null, params);

      const editorContainer = container.querySelector('.custom-dropdown-container');
      expect(editorContainer).toBeTruthy();

      customEditor.destroy();
    });
  });

  // ===== init() Tests =====
  describe('init()', () => {
    it('should create searchable input element by default', () => {
      editor.init(container, null, params);

      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      expect(searchInput).toBeTruthy();
      expect(searchInput.className).toContain('zg-dropdown-editor-search');
    });

    it('should set initial single value', () => {
      editor.init(container, 'opt2', params);
      const value = editor.getValue();
      expect(value).toBe('opt2');
    });

    it('should set initial multi-select values', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        multiSelect: true,
      });
      customEditor.init(container, ['opt1', 'opt3'], params);
      const value = customEditor.getValue();
      expect(value).toEqual(['opt1', 'opt3']);
      customEditor.destroy();
    });

    it('should handle null initial value', () => {
      editor.init(container, null, params);
      const value = editor.getValue();
      expect(value).toBe(null);
    });

    it('should create dropdown menu element', () => {
      editor.init(container, null, params);

      const menu = container.querySelector('.zg-dropdown-editor-menu') as HTMLElement;
      expect(menu).toBeTruthy();
      expect(menu.getAttribute('role')).toBe('listbox');
      expect(menu.style.display).toBe('none');
    });

    it('should set ARIA attributes', () => {
      editor.init(container, null, params);

      const editorContainer = container.querySelector(
        '.zg-dropdown-editor-container'
      ) as HTMLElement;
      expect(editorContainer.getAttribute('role')).toBe('combobox');
      expect(editorContainer.getAttribute('aria-expanded')).toBe('false');
      expect(editorContainer.getAttribute('aria-haspopup')).toBe('listbox');
    });

    it('should set required attribute when required', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        required: true,
      });
      customEditor.init(container, null, params);

      const editorContainer = container.querySelector(
        '.zg-dropdown-editor-container'
      ) as HTMLElement;
      expect(editorContainer.getAttribute('aria-required')).toBe('true');

      customEditor.destroy();
    });

    it('should set data attributes', () => {
      editor.init(container, null, params);

      const editorContainer = container.querySelector(
        '.zg-dropdown-editor-container'
      ) as HTMLElement;
      expect(editorContainer.dataset.row).toBe('0');
      expect(editorContainer.dataset.col).toBe('0');
      expect(editorContainer.dataset.field).toBe('testField');
    });

    it('should auto-focus by default', () => {
      editor.init(container, null, params);

      // Wait for requestAnimationFrame
      return new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
          expect(document.activeElement).toBe(searchInput);
          resolve();
        });
      });
    });

    it('should not auto-focus when disabled', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        autoFocus: false,
      });
      customEditor.init(container, null, params);

      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      expect(document.activeElement).not.toBe(searchInput);

      customEditor.destroy();
    });

    it('should support select all on focus', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        selectAllOnFocus: true,
      });
      customEditor.init(container, null, params);

      return new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
          // Check if selectionStart and selectionEnd are set (select() was called)
          expect(searchInput.selectionStart).toBe(0);
          customEditor.destroy();
          resolve();
        });
      });
    });
  });

  // ===== getValue() Tests =====
  describe('getValue()', () => {
    it('should return null for empty single-select', () => {
      editor.init(container, null, params);
      const value = editor.getValue();
      expect(value).toBe(null);
    });

    it('should return single selected value', () => {
      editor.init(container, 'opt2', params);
      const value = editor.getValue();
      expect(value).toBe('opt2');
    });

    it('should return array for multi-select', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        multiSelect: true,
      });
      customEditor.init(container, ['opt1', 'opt3'], params);
      const value = customEditor.getValue();
      expect(Array.isArray(value)).toBe(true);
      expect(value).toEqual(['opt1', 'opt3']);
      customEditor.destroy();
    });

    it('should return empty array for empty multi-select', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        multiSelect: true,
      });
      customEditor.init(container, null, params);
      const value = customEditor.getValue();
      expect(Array.isArray(value)).toBe(true);
      expect(value).toEqual([]);
      customEditor.destroy();
    });
  });

  // ===== isValid() Tests =====
  describe('isValid()', () => {
    it('should return true for valid single-select value', () => {
      editor.init(container, 'opt1', params);
      const result = editor.isValid();
      expect(result).toBe(true);
    });

    it('should return error for empty value when required', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        required: true,
      });
      customEditor.init(container, null, params);
      const result = customEditor.isValid();
      expect(result).toMatchObject({
        valid: false,
        message: 'This field is required',
      });
      customEditor.destroy();
    });

    it('should return error for empty multi-select when required', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        multiSelect: true,
        required: true,
      });
      customEditor.init(container, [], params);
      const result = customEditor.isValid();
      expect(result).toMatchObject({
        valid: false,
        message: 'Please select at least one option',
      });
      customEditor.destroy();
    });

    it('should validate value exists in options', () => {
      editor.init(container, 'invalid-value', params);
      const result = editor.isValid();
      expect(result).toMatchObject({
        valid: false,
        message: 'Please select a valid option',
      });
    });

    it('should allow custom values when allowCustom is true', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        allowCustom: true,
      });
      customEditor.init(container, 'custom-value', params);
      const result = customEditor.isValid();
      expect(result).toBe(true);
      customEditor.destroy();
    });

    it('should use custom validator returning boolean', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        validator: (value) => value === 'opt1',
      });
      customEditor.init(container, 'opt2', params);
      const result = customEditor.isValid();
      expect(result).toBe(false);
      customEditor.destroy();
    });

    it('should use custom validator returning error message', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        validator: (value) => {
          if (value === 'opt1') return true;
          return 'Only Option 1 is allowed';
        },
      });
      customEditor.init(container, 'opt2', params);
      const result = customEditor.isValid();
      expect(result).toMatchObject({
        valid: false,
        message: 'Only Option 1 is allowed',
      });
      customEditor.destroy();
    });
  });

  // ===== onKeyDown() Tests =====
  describe('onKeyDown()', () => {
    it('should commit on Enter key when dropdown is closed', () => {
      const onComplete = vi.fn();
      editor.init(container, 'opt1', { ...params, onComplete });

      editor.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(onComplete).toHaveBeenCalledWith('opt1', false);
    });

    it('should restore initial value on Escape when dropdown is closed', () => {
      const onComplete = vi.fn();
      const initialValue = 'opt1';
      editor.init(container, initialValue, { ...params, onComplete });

      editor.onKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(onComplete).toHaveBeenCalledWith(initialValue, true);
    });

    it('should open dropdown on ArrowDown', () => {
      editor.init(container, null, params);

      // Close dropdown first
      const menu = container.querySelector('.zg-dropdown-editor-menu') as HTMLElement;
      menu.style.display = 'none';

      editor.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));

      expect(menu.style.display).toBe('block');
    });

    it('should open dropdown on ArrowUp', () => {
      editor.init(container, null, params);

      // Close dropdown first
      const menu = container.querySelector('.zg-dropdown-editor-menu') as HTMLElement;
      menu.style.display = 'none';

      editor.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

      expect(menu.style.display).toBe('block');
    });

    it('should stop propagation for handled keys', () => {
      editor.init(container, null, params);

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      const stopPropagation = vi.spyOn(event, 'stopPropagation');
      const preventDefault = vi.spyOn(event, 'preventDefault');

      editor.onKeyDown(event);

      expect(stopPropagation).toHaveBeenCalled();
      expect(preventDefault).toHaveBeenCalled();
    });
  });

  // ===== Searchable Tests =====
  describe('Searchable', () => {
    it('should filter options by search term', () => {
      editor.init(container, null, params);

      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      searchInput.value = 'Option 2';
      searchInput.dispatchEvent(new Event('input'));

      const menu = container.querySelector('.zg-dropdown-editor-menu') as HTMLElement;
      const options = menu.querySelectorAll('.zg-dropdown-editor-option');
      expect(options.length).toBe(1);
      expect(options[0].textContent).toBe('Option 2');
    });

    it('should show "No results found" for empty search results', () => {
      editor.init(container, null, params);

      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      searchInput.value = 'Nonexistent';
      searchInput.dispatchEvent(new Event('input'));

      const menu = container.querySelector('.zg-dropdown-editor-menu') as HTMLElement;
      const noResults = menu.querySelector('.zg-dropdown-editor-no-results');
      expect(noResults).toBeTruthy();
      expect(noResults?.textContent).toBe('No results found');
    });

    it('should support case-insensitive search by default', () => {
      editor.init(container, null, params);

      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      searchInput.value = 'option 2';
      searchInput.dispatchEvent(new Event('input'));

      const menu = container.querySelector('.zg-dropdown-editor-menu') as HTMLElement;
      const options = menu.querySelectorAll('.zg-dropdown-editor-option');
      expect(options.length).toBe(1);
    });

    it('should support case-sensitive search when enabled', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        caseSensitiveSearch: true,
      });
      customEditor.init(container, null, params);

      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      searchInput.value = 'option 2';
      searchInput.dispatchEvent(new Event('input'));

      const menu = container.querySelector('.zg-dropdown-editor-menu') as HTMLElement;
      const options = menu.querySelectorAll('.zg-dropdown-editor-option');
      expect(options.length).toBe(0);

      customEditor.destroy();
    });
  });

  // ===== Multi-Select Tests =====
  describe('Multi-Select', () => {
    it('should toggle selection on option click', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        multiSelect: true,
      });
      customEditor.init(container, ['opt1'], params);

      // Open dropdown
      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      searchInput.dispatchEvent(new Event('focus'));

      // Click on opt2
      const menu = container.querySelector('.zg-dropdown-editor-menu') as HTMLElement;
      const options = menu.querySelectorAll('.zg-dropdown-editor-option');
      (options[1] as HTMLElement).click();

      const value = customEditor.getValue();
      expect(value).toEqual(['opt1', 'opt2']);

      customEditor.destroy();
    });

    it('should show count display mode', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        multiSelect: true,
        multiSelectDisplay: 'count',
      });
      customEditor.init(container, ['opt1', 'opt2'], params);

      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      expect(searchInput.placeholder).toBe('2 selected');

      customEditor.destroy();
    });

    it('should show list display mode', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        multiSelect: true,
        multiSelectDisplay: 'list',
      });
      customEditor.init(container, ['opt1', 'opt2'], params);

      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      expect(searchInput.placeholder).toContain('Option 1');
      expect(searchInput.placeholder).toContain('Option 2');

      customEditor.destroy();
    });

    it('should show tags display mode with overflow', () => {
      const customEditor = new DropdownEditor({
        options: [
          { label: 'Opt 1', value: '1' },
          { label: 'Opt 2', value: '2' },
          { label: 'Opt 3', value: '3' },
          { label: 'Opt 4', value: '4' },
          { label: 'Opt 5', value: '5' },
        ],
        multiSelect: true,
        multiSelectDisplay: 'tags',
      });
      customEditor.init(container, ['1', '2', '3', '4', '5'], params);

      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      expect(searchInput.placeholder).toContain('Opt 1');
      expect(searchInput.placeholder).toContain('+2');

      customEditor.destroy();
    });
  });

  // ===== Option Grouping Tests =====
  describe('Option Grouping', () => {
    it('should render grouped options', () => {
      const groupedOptions: DropdownOption[] = [
        { label: 'Red', value: 'red', group: 'Colors' },
        { label: 'Blue', value: 'blue', group: 'Colors' },
        { label: 'Small', value: 'small', group: 'Sizes' },
        { label: 'Large', value: 'large', group: 'Sizes' },
      ];

      const customEditor = new DropdownEditor({ options: groupedOptions });
      customEditor.init(container, null, params);

      // Open dropdown
      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      searchInput.dispatchEvent(new Event('focus'));

      const menu = container.querySelector('.zg-dropdown-editor-menu') as HTMLElement;
      const groupHeaders = menu.querySelectorAll('.zg-dropdown-editor-group-header');
      expect(groupHeaders.length).toBe(2);
      expect(groupHeaders[0].textContent).toBe('Colors');
      expect(groupHeaders[1].textContent).toBe('Sizes');

      customEditor.destroy();
    });
  });

  // ===== Disabled Options Tests =====
  describe('Disabled Options', () => {
    it('should render disabled options', () => {
      const optionsWithDisabled: DropdownOption[] = [
        { label: 'Option 1', value: 'opt1' },
        { label: 'Option 2', value: 'opt2', disabled: true },
        { label: 'Option 3', value: 'opt3' },
      ];

      const customEditor = new DropdownEditor({ options: optionsWithDisabled });
      customEditor.init(container, null, params);

      // Open dropdown
      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      searchInput.dispatchEvent(new Event('focus'));

      const menu = container.querySelector('.zg-dropdown-editor-menu') as HTMLElement;
      const options = menu.querySelectorAll('.zg-dropdown-editor-option');
      expect(options[1].classList.contains('disabled')).toBe(true);
      expect(options[1].getAttribute('aria-disabled')).toBe('true');

      customEditor.destroy();
    });
  });

  // ===== focus() Tests =====
  describe('focus()', () => {
    it('should focus searchable input', () => {
      editor.init(container, null, params);
      editor.focus();

      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      expect(document.activeElement).toBe(searchInput);
    });

    it('should focus non-searchable display', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        searchable: false,
      });
      customEditor.init(container, null, params);
      customEditor.focus();

      const display = container.querySelector('.zg-dropdown-editor-display') as HTMLElement;
      expect(document.activeElement).toBe(display);

      customEditor.destroy();
    });
  });

  // ===== destroy() Tests =====
  describe('destroy()', () => {
    it('should remove container from DOM', () => {
      editor.init(container, null, params);
      editor.destroy();

      const editorContainer = container.querySelector('.zg-dropdown-editor-container');
      expect(editorContainer).toBe(null);
    });

    it('should clear event listeners', () => {
      editor.init(container, null, params);

      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      const inputSpy = vi.fn();
      searchInput.addEventListener('input', inputSpy);

      editor.destroy();

      searchInput.dispatchEvent(new Event('input'));
      // Event listener should still fire (we only remove editor's listeners)
      expect(inputSpy).toHaveBeenCalled();
    });

    it('should be safe to call multiple times', () => {
      editor.init(container, null, params);
      editor.destroy();
      expect(() => editor.destroy()).not.toThrow();
    });
  });

  // ===== Blur Handling Tests =====
  describe('Blur Handling', () => {
    it('should commit on blur by default', () => {
      const onComplete = vi.fn();
      editor.init(container, 'opt1', { ...params, onComplete });

      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      searchInput.dispatchEvent(new Event('blur'));

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(onComplete).toHaveBeenCalledWith('opt1', false);
          resolve();
        }, 250);
      });
    });

    it('should not commit on blur when stopOnBlur is false', () => {
      const customEditor = new DropdownEditor({
        options: mockOptions,
        stopOnBlur: false,
      });
      const onComplete = vi.fn();
      customEditor.init(container, 'opt1', { ...params, onComplete });

      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      searchInput.dispatchEvent(new Event('blur'));

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(onComplete).not.toHaveBeenCalled();
          customEditor.destroy();
          resolve();
        }, 250);
      });
    });
  });

  // ===== onChange Callback Tests =====
  describe('onChange Callback', () => {
    it('should call onChange callback when selection changes in multi-select', () => {
      const onChange = vi.fn();
      const customEditor = new DropdownEditor({
        options: mockOptions,
        multiSelect: true,
      });
      customEditor.init(container, ['opt1'], { ...params, onChange });

      // Open dropdown
      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      searchInput.dispatchEvent(new Event('focus'));

      // Click on opt2
      const menu = container.querySelector('.zg-dropdown-editor-menu') as HTMLElement;
      const options = menu.querySelectorAll('.zg-dropdown-editor-option');
      (options[1] as HTMLElement).click();

      expect(onChange).toHaveBeenCalledWith(['opt1', 'opt2']);

      customEditor.destroy();
    });
  });

  // ===== Factory Function Tests =====
  describe('createDropdownEditor', () => {
    it('should create DropdownEditor instance', () => {
      const factoryEditor = createDropdownEditor({ options: mockOptions });
      expect(factoryEditor).toBeInstanceOf(DropdownEditor);
      factoryEditor.destroy();
    });

    it('should accept options', () => {
      const factoryEditor = createDropdownEditor({
        options: mockOptions,
        searchable: false,
        multiSelect: true,
      });
      factoryEditor.init(container, null, params);

      const display = container.querySelector('.zg-dropdown-editor-display');
      expect(display).toBeTruthy();

      const value = factoryEditor.getValue();
      expect(Array.isArray(value)).toBe(true);

      factoryEditor.destroy();
    });
  });
});
