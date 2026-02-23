/**
 * @jest-environment jsdom
 */

import { CheckboxEditor, createCheckboxEditor, type CheckboxEditorOptions } from '../checkbox';
import type { EditorParams } from '../cell-editor.interface';

describe('CheckboxEditor', () => {
  let container: HTMLElement;
  let params: EditorParams;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    params = {
      cell: { row: 0, col: 1 },
      column: { field: 'active', header: 'Active' },
      rowData: { id: 1, active: true },
      onComplete: jest.fn(),
      onChange: jest.fn(),
    };
  });

  describe('Constructor', () => {
    it('should create instance with default options', () => {
      const editor = new CheckboxEditor();
      expect(editor).toBeInstanceOf(CheckboxEditor);
    });

    it('should accept custom options', () => {
      const options: CheckboxEditorOptions = {
        allowIndeterminate: true,
        label: 'Enable feature',
        disabled: false,
        checkedText: 'Yes',
        uncheckedText: 'No',
      };
      const editor = new CheckboxEditor(options);
      expect(editor).toBeInstanceOf(CheckboxEditor);
    });

    it('should use default values for missing options', () => {
      const editor = new CheckboxEditor({});
      expect(editor).toBeInstanceOf(CheckboxEditor);
    });

    it('should handle partial options', () => {
      const editor = new CheckboxEditor({ label: 'Test' });
      expect(editor).toBeInstanceOf(CheckboxEditor);
    });

    it('should allow custom validator', () => {
      const validator = (value: boolean | null) => value === true;
      const editor = new CheckboxEditor({ validator });
      expect(editor).toBeInstanceOf(CheckboxEditor);
    });

    it('should handle disabled state', () => {
      const editor = new CheckboxEditor({ disabled: true });
      expect(editor).toBeInstanceOf(CheckboxEditor);
    });

    it('should handle custom className', () => {
      const editor = new CheckboxEditor({ className: 'custom-checkbox' });
      expect(editor).toBeInstanceOf(CheckboxEditor);
    });

    it('should handle all custom texts', () => {
      const editor = new CheckboxEditor({
        checkedText: 'On',
        uncheckedText: 'Off',
        indeterminateText: 'Unknown',
      });
      expect(editor).toBeInstanceOf(CheckboxEditor);
    });
  });

  describe('init()', () => {
    let editor: CheckboxEditor;

    beforeEach(() => {
      editor = new CheckboxEditor();
    });

    it('should create checkbox element', () => {
      editor.init(container, true, params);
      const checkbox = container.querySelector('input[type="checkbox"]');
      expect(checkbox).toBeTruthy();
      expect((checkbox as HTMLInputElement).checked).toBe(true);
    });

    it('should create label container', () => {
      editor.init(container, false, params);
      const label = container.querySelector('label');
      expect(label).toBeTruthy();
      expect(label?.classList.contains('zg-checkbox-editor')).toBe(true);
    });

    it('should set custom className', () => {
      const editor = new CheckboxEditor({ className: 'custom-class' });
      editor.init(container, true, params);
      const label = container.querySelector('label');
      expect(label?.classList.contains('custom-class')).toBe(true);
    });

    it('should display label text if provided', () => {
      const editor = new CheckboxEditor({ label: 'Enable feature' });
      editor.init(container, true, params);
      const labelText = container.querySelector('.zg-checkbox-label');
      expect(labelText?.textContent).toBe('Enable feature');
    });

    it('should not display label text if not provided', () => {
      editor.init(container, true, params);
      const labelText = container.querySelector('.zg-checkbox-label');
      expect(labelText).toBeFalsy();
    });

    it('should set ARIA attributes', () => {
      editor.init(container, true, params);
      const checkbox = container.querySelector('input') as HTMLInputElement;
      expect(checkbox.getAttribute('role')).toBe('checkbox');
      expect(checkbox.getAttribute('aria-label')).toBe('Edit Active');
      expect(checkbox.getAttribute('aria-checked')).toBe('true');
    });

    it('should set data attributes', () => {
      editor.init(container, true, params);
      const label = container.querySelector('label') as HTMLLabelElement;
      expect(label.dataset.row).toBe('0');
      expect(label.dataset.col).toBe('1');
      expect(label.dataset.field).toBe('active');
    });

    it('should handle true value', () => {
      editor.init(container, true, params);
      const checkbox = container.querySelector('input') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
      expect(checkbox.indeterminate).toBe(false);
    });

    it('should handle false value', () => {
      editor.init(container, false, params);
      const checkbox = container.querySelector('input') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
      expect(checkbox.indeterminate).toBe(false);
    });

    it('should handle null value with indeterminate enabled', () => {
      const editor = new CheckboxEditor({ allowIndeterminate: true });
      editor.init(container, null, params);
      const checkbox = container.querySelector('input') as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(true);
      expect(checkbox.checked).toBe(false);
    });

    it('should handle null value with indeterminate disabled', () => {
      editor.init(container, null, params);
      const checkbox = container.querySelector('input') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
      expect(checkbox.indeterminate).toBe(false);
    });

    it('should handle disabled state', () => {
      const editor = new CheckboxEditor({ disabled: true });
      editor.init(container, true, params);
      const checkbox = container.querySelector('input') as HTMLInputElement;
      expect(checkbox.disabled).toBe(true);
    });

    it('should focus checkbox if autoFocus is true', (done) => {
      const editor = new CheckboxEditor({ autoFocus: true });
      editor.init(container, true, params);

      setTimeout(() => {
        const checkbox = container.querySelector('input') as HTMLInputElement;
        expect(document.activeElement).toBe(checkbox);
        done();
      }, 50);
    });

    it('should not auto-focus if autoFocus is false', () => {
      const editor = new CheckboxEditor({ autoFocus: false });
      editor.init(container, true, params);
      const checkbox = container.querySelector('input') as HTMLInputElement;
      expect(document.activeElement).not.toBe(checkbox);
    });
  });

  describe('getValue()', () => {
    let editor: CheckboxEditor;

    beforeEach(() => {
      editor = new CheckboxEditor();
    });

    it('should return true when checked', () => {
      editor.init(container, true, params);
      expect(editor.getValue()).toBe(true);
    });

    it('should return false when unchecked', () => {
      editor.init(container, false, params);
      expect(editor.getValue()).toBe(false);
    });

    it('should return null when indeterminate', () => {
      const editor = new CheckboxEditor({ allowIndeterminate: true });
      editor.init(container, null, params);
      expect(editor.getValue()).toBe(null);
    });

    it('should return current state after toggle', () => {
      editor.init(container, false, params);
      const checkbox = container.querySelector('input') as HTMLInputElement;
      checkbox.click();
      expect(editor.getValue()).toBe(true);
    });

    it('should return null if checkbox not initialized', () => {
      expect(editor.getValue()).toBe(null);
    });

    it('should return false if indeterminate not allowed', () => {
      editor.init(container, null, params);
      expect(editor.getValue()).toBe(false);
    });
  });

  describe('normalizeValue()', () => {
    let editor: CheckboxEditor;

    beforeEach(() => {
      editor = new CheckboxEditor({ allowIndeterminate: true });
    });

    it('should normalize boolean true', () => {
      editor.init(container, true, params);
      expect(editor.getValue()).toBe(true);
    });

    it('should normalize boolean false', () => {
      editor.init(container, false, params);
      expect(editor.getValue()).toBe(false);
    });

    it('should normalize null to null when indeterminate allowed', () => {
      editor.init(container, null, params);
      expect(editor.getValue()).toBe(null);
    });

    it('should normalize undefined to null when indeterminate allowed', () => {
      editor.init(container, undefined as any, params);
      expect(editor.getValue()).toBe(null);
    });

    it('should normalize string "true" to true', () => {
      editor.init(container, 'true' as any, params);
      expect(editor.getValue()).toBe(true);
    });

    it('should normalize string "false" to false', () => {
      editor.init(container, 'false' as any, params);
      expect(editor.getValue()).toBe(false);
    });

    it('should normalize string "1" to true', () => {
      editor.init(container, '1' as any, params);
      expect(editor.getValue()).toBe(true);
    });

    it('should normalize string "0" to false', () => {
      editor.init(container, '0' as any, params);
      expect(editor.getValue()).toBe(false);
    });

    it('should normalize string "yes" to true', () => {
      editor.init(container, 'yes' as any, params);
      expect(editor.getValue()).toBe(true);
    });

    it('should normalize string "no" to false', () => {
      editor.init(container, 'no' as any, params);
      expect(editor.getValue()).toBe(false);
    });

    it('should normalize string "on" to true', () => {
      editor.init(container, 'on' as any, params);
      expect(editor.getValue()).toBe(true);
    });

    it('should normalize string "off" to false', () => {
      editor.init(container, 'off' as any, params);
      expect(editor.getValue()).toBe(false);
    });

    it('should normalize string "null" to null', () => {
      editor.init(container, 'null' as any, params);
      expect(editor.getValue()).toBe(null);
    });

    it('should normalize string "indeterminate" to null', () => {
      editor.init(container, 'indeterminate' as any, params);
      expect(editor.getValue()).toBe(null);
    });

    it('should normalize number 1 to true', () => {
      editor.init(container, 1 as any, params);
      expect(editor.getValue()).toBe(true);
    });

    it('should normalize number 0 to false', () => {
      editor.init(container, 0 as any, params);
      expect(editor.getValue()).toBe(false);
    });

    it('should normalize number -1 to true', () => {
      editor.init(container, -1 as any, params);
      expect(editor.getValue()).toBe(true);
    });

    it('should normalize unknown types to false', () => {
      editor.init(container, {} as any, params);
      expect(editor.getValue()).toBe(false);
    });
  });

  describe('isValid()', () => {
    it('should return true when no validator provided', () => {
      const editor = new CheckboxEditor();
      editor.init(container, true, params);
      expect(editor.isValid()).toBe(true);
    });

    it('should validate with custom validator returning boolean', () => {
      const editor = new CheckboxEditor({
        validator: (value) => value === true,
      });
      editor.init(container, true, params);
      expect(editor.isValid()).toBe(true);

      editor.init(container, false, params);
      expect(editor.isValid()).toBe(false);
    });

    it('should validate with custom validator returning string', () => {
      const editor = new CheckboxEditor({
        validator: (value) => (value === true ? true : 'Must be checked'),
      });
      editor.init(container, false, params);
      const result = editor.isValid();
      expect(result).toMatchObject({
        valid: false,
        message: 'Must be checked',
      });
    });

    it('should validate null value', () => {
      const editor = new CheckboxEditor({
        allowIndeterminate: true,
        validator: (value) => value !== null || 'Cannot be indeterminate',
      });
      editor.init(container, null, params);
      const result = editor.isValid();
      expect(result).toMatchObject({
        valid: false,
        message: 'Cannot be indeterminate',
      });
    });

    it('should allow custom validation logic', () => {
      let callCount = 0;
      const editor = new CheckboxEditor({
        validator: (value) => {
          callCount++;
          return value === true;
        },
      });
      editor.init(container, true, params);
      editor.isValid();
      expect(callCount).toBe(1);
    });
  });

  describe('onKeyDown()', () => {
    let editor: CheckboxEditor;

    beforeEach(() => {
      editor = new CheckboxEditor();
    });

    it('should commit on Enter key', () => {
      const onComplete = jest.fn();
      const params2 = { ...params, onComplete };
      editor.init(container, true, params2);
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      editor.onKeyDown(enterEvent);
      expect(onComplete).toHaveBeenCalledWith(true, false);
    });

    it('should cancel on Escape key and restore initial value', () => {
      const onComplete = jest.fn();
      const params2 = { ...params, onComplete };
      editor.init(container, true, params2);

      // Change value
      const checkbox = container.querySelector('input') as HTMLInputElement;
      checkbox.checked = false;

      // Cancel
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      editor.onKeyDown(escapeEvent);

      expect(onComplete).toHaveBeenCalledWith(true, true);
      expect(checkbox.checked).toBe(true); // Restored
    });

    it('should handle Space key for indeterminate state', () => {
      const editor = new CheckboxEditor({ allowIndeterminate: true });
      editor.init(container, null, params);

      const checkbox = container.querySelector('input') as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(true);

      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      const handled = editor.onKeyDown(spaceEvent);

      expect(handled).toBe(true);
      expect(checkbox.indeterminate).toBe(false);
      expect(checkbox.checked).toBe(true);
    });

    it('should handle "Spacebar" key (older browsers)', () => {
      const editor = new CheckboxEditor({ allowIndeterminate: true });
      editor.init(container, null, params);

      const spaceEvent = new KeyboardEvent('keydown', { key: 'Spacebar' });
      const handled = editor.onKeyDown(spaceEvent);

      expect(handled).toBe(true);
    });

    it('should stop propagation for all keys', () => {
      editor.init(container, true, params);
      const event = new KeyboardEvent('keydown', { key: 'a' });
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');
      editor.onKeyDown(event);
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should return true to indicate handled', () => {
      editor.init(container, true, params);
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      const handled = editor.onKeyDown(event);
      expect(handled).toBe(true);
    });

    it('should prevent default on Enter', () => {
      editor.init(container, true, params);
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      editor.onKeyDown(event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should prevent default on Escape', () => {
      editor.init(container, true, params);
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      editor.onKeyDown(event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Tri-state Behavior', () => {
    it('should cycle through indeterminate → checked → unchecked when clicking', () => {
      const editor = new CheckboxEditor({ allowIndeterminate: true });
      editor.init(container, null, params);

      const label = container.querySelector('label') as HTMLLabelElement;
      const checkbox = container.querySelector('input') as HTMLInputElement;

      // Initial: indeterminate
      expect(checkbox.indeterminate).toBe(true);
      expect(editor.getValue()).toBe(null);

      // Click label: indeterminate → checked
      label.click();
      expect(checkbox.indeterminate).toBe(false);
      expect(checkbox.checked).toBe(true);
      expect(editor.getValue()).toBe(true);

      // Click label: checked → unchecked (or indeterminate)
      label.click();
      expect(checkbox.checked).toBe(false);
      expect(checkbox.indeterminate).toBe(true);
      expect(editor.getValue()).toBe(null);
    });

    it('should cycle through checked → unchecked when not allowing indeterminate', () => {
      const editor = new CheckboxEditor({ allowIndeterminate: false });
      editor.init(container, false, params);

      const label = container.querySelector('label') as HTMLLabelElement;
      const checkbox = container.querySelector('input') as HTMLInputElement;

      // Initial: unchecked
      expect(checkbox.checked).toBe(false);

      // Click: unchecked → checked
      label.click();
      expect(checkbox.checked).toBe(true);

      // Click: checked → unchecked
      label.click();
      expect(checkbox.checked).toBe(false);
      expect(checkbox.indeterminate).toBe(false);
    });

    it('should update ARIA attributes when cycling states', () => {
      const editor = new CheckboxEditor({ allowIndeterminate: true });
      editor.init(container, null, params);

      const label = container.querySelector('label') as HTMLLabelElement;
      const checkbox = container.querySelector('input') as HTMLInputElement;

      expect(checkbox.getAttribute('aria-checked')).toBe('mixed');

      label.click();
      expect(checkbox.getAttribute('aria-checked')).toBe('true');

      label.click();
      expect(checkbox.getAttribute('aria-checked')).toBe('mixed');
    });
  });

  describe('focus()', () => {
    it('should focus the checkbox element', () => {
      const editor = new CheckboxEditor({ autoFocus: false });
      editor.init(container, true, params);
      editor.focus();
      const checkbox = container.querySelector('input') as HTMLInputElement;
      expect(document.activeElement).toBe(checkbox);
    });

    it('should not throw if checkbox not initialized', () => {
      const editor = new CheckboxEditor();
      expect(() => editor.focus()).not.toThrow();
    });
  });

  describe('destroy()', () => {
    it('should remove checkbox element', () => {
      const editor = new CheckboxEditor();
      editor.init(container, true, params);
      editor.destroy();
      const checkbox = container.querySelector('input');
      expect(checkbox).toBeFalsy();
    });

    it('should remove label container', () => {
      const editor = new CheckboxEditor();
      editor.init(container, true, params);
      editor.destroy();
      const label = container.querySelector('label');
      expect(label).toBeFalsy();
    });

    it('should clear internal references', () => {
      const editor = new CheckboxEditor();
      editor.init(container, true, params);
      editor.destroy();
      expect(editor.getValue()).toBe(null);
    });

    it('should be safe to call multiple times', () => {
      const editor = new CheckboxEditor();
      editor.init(container, true, params);
      editor.destroy();
      expect(() => editor.destroy()).not.toThrow();
    });

    it('should prevent blur handler after destroy', (done) => {
      const onComplete = jest.fn();
      const editor = new CheckboxEditor({ stopOnBlur: true });
      editor.init(container, true, { ...params, onComplete });

      const checkbox = container.querySelector('input') as HTMLInputElement;
      checkbox.focus();
      editor.destroy();
      checkbox.blur();

      setTimeout(() => {
        expect(onComplete).not.toHaveBeenCalled();
        done();
      }, 150);
    });
  });

  describe('Blur Handling', () => {
    it('should commit on blur when stopOnBlur is true', (done) => {
      const onComplete = jest.fn();
      const editor = new CheckboxEditor({ stopOnBlur: true });
      editor.init(container, true, { ...params, onComplete });

      const checkbox = container.querySelector('input') as HTMLInputElement;
      checkbox.focus();
      checkbox.blur();

      setTimeout(() => {
        expect(onComplete).toHaveBeenCalledWith(true, false);
        done();
      }, 150);
    });

    it('should not commit on blur when stopOnBlur is false', (done) => {
      const onComplete = jest.fn();
      const editor = new CheckboxEditor({ stopOnBlur: false });
      editor.init(container, false, { ...params, onComplete });

      const checkbox = container.querySelector('input') as HTMLInputElement;
      checkbox.focus();
      checkbox.blur();

      setTimeout(() => {
        expect(onComplete).not.toHaveBeenCalled();
        done();
      }, 150);
    });
  });

  describe('onChange Callback', () => {
    it('should call onChange when checkbox is clicked', () => {
      const onChange = jest.fn();
      const editor = new CheckboxEditor();
      editor.init(container, false, { ...params, onChange });

      const checkbox = container.querySelector('input') as HTMLInputElement;
      checkbox.click();

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('should call onChange when label is clicked', () => {
      const onChange = jest.fn();
      const editor = new CheckboxEditor({ label: 'Test' });
      editor.init(container, false, { ...params, onChange });

      const label = container.querySelector('label') as HTMLLabelElement;
      const labelText = label.querySelector('.zg-checkbox-label') as HTMLSpanElement;
      labelText.click();

      expect(onChange).toHaveBeenCalled();
    });

    it('should not call onChange if not provided', () => {
      const editor = new CheckboxEditor();
      editor.init(container, false, params);

      const checkbox = container.querySelector('input') as HTMLInputElement;
      expect(() => checkbox.click()).not.toThrow();
    });
  });

  describe('Event Propagation', () => {
    it('should stop click propagation on checkbox', () => {
      const editor = new CheckboxEditor();
      editor.init(container, true, params);

      const checkbox = container.querySelector('input') as HTMLInputElement;
      const event = new MouseEvent('click', { bubbles: true });
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');

      checkbox.dispatchEvent(event);
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should stop mousedown propagation on checkbox', () => {
      const editor = new CheckboxEditor();
      editor.init(container, true, params);

      const checkbox = container.querySelector('input') as HTMLInputElement;
      const event = new MouseEvent('mousedown', { bubbles: true });
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');

      checkbox.dispatchEvent(event);
      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should not toggle when disabled', () => {
      const editor = new CheckboxEditor({ disabled: true });
      editor.init(container, false, params);

      const label = container.querySelector('label') as HTMLLabelElement;
      const checkbox = container.querySelector('input') as HTMLInputElement;

      label.click();
      expect(checkbox.checked).toBe(false); // Should not change
    });

    it('should show disabled cursor', () => {
      const editor = new CheckboxEditor({ disabled: true });
      editor.init(container, false, params);

      const label = container.querySelector('label') as HTMLLabelElement;
      expect(label.style.cursor).toBe('not-allowed');
    });
  });

  describe('Factory Function', () => {
    it('should create CheckboxEditor instance', () => {
      const editor = createCheckboxEditor();
      expect(editor).toBeInstanceOf(CheckboxEditor);
    });

    it('should accept options', () => {
      const editor = createCheckboxEditor({ label: 'Test', allowIndeterminate: true });
      expect(editor).toBeInstanceOf(CheckboxEditor);
    });
  });
});
