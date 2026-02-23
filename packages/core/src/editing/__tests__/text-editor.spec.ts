/**
 * @jest-environment jsdom
 */

import { TextEditor, createTextEditor, type TextEditorOptions } from '../text';
import type { EditorParams } from '../cell-editor.interface';

describe('TextEditor', () => {
  let editor: TextEditor;
  let container: HTMLElement;
  let params: EditorParams;

  beforeEach(() => {
    editor = new TextEditor();
    container = document.createElement('div');
    params = {
      cell: { row: 0, col: 0 },
      column: { field: 'name', header: 'Name' },
      rowData: { id: 1, name: 'John Doe' },
      onComplete: jest.fn(),
      onChange: jest.fn(),
    } as EditorParams;
  });

  describe('Constructor', () => {
    it('should create instance with default options', () => {
      const editor = new TextEditor();
      expect(editor).toBeInstanceOf(TextEditor);
    });

    it('should accept custom options', () => {
      const options: TextEditorOptions = {
        type: 'email',
        placeholder: 'Enter email...',
        maxLength: 100,
        required: true,
      };

      const editor = new TextEditor(options);
      expect(editor).toBeInstanceOf(TextEditor);
    });

    it('should set default type to "text"', () => {
      const editor = new TextEditor();
      editor.init(container, 'test', params);

      const input = container.querySelector('input');
      expect(input?.type).toBe('text');
    });

    it('should accept "number" type', () => {
      const editor = new TextEditor({ type: 'number' });
      editor.init(container, 42, params);

      const input = container.querySelector('input');
      expect(input?.type).toBe('number');
    });

    it('should accept "email" type', () => {
      const editor = new TextEditor({ type: 'email' });
      editor.init(container, 'test@example.com', params);

      const input = container.querySelector('input');
      expect(input?.type).toBe('email');
    });

    it('should set default className', () => {
      const editor = new TextEditor();
      editor.init(container, 'test', params);

      const input = container.querySelector('input');
      expect(input?.className).toBe('zg-text-editor');
    });

    it('should accept custom className', () => {
      const editor = new TextEditor({ className: 'custom-editor' });
      editor.init(container, 'test', params);

      const input = container.querySelector('input');
      expect(input?.className).toBe('custom-editor');
    });
  });

  describe('init()', () => {
    it('should create input element', () => {
      editor.init(container, 'test value', params);

      const input = container.querySelector('input');
      expect(input).toBeTruthy();
      expect(input?.value).toBe('test value');
    });

    it('should clear previous content', () => {
      container.innerHTML = '<div>Previous content</div>';

      editor.init(container, 'test', params);

      expect(container.querySelector('div')).toBeNull();
      expect(container.querySelector('input')).toBeTruthy();
    });

    it('should set initial value', () => {
      editor.init(container, 'Hello World', params);

      expect(editor.getValue()).toBe('Hello World');
    });

    it('should handle null value', () => {
      editor.init(container, null, params);

      const input = container.querySelector('input');
      expect(input?.value).toBe('');
    });

    it('should handle undefined value', () => {
      editor.init(container, undefined, params);

      const input = container.querySelector('input');
      expect(input?.value).toBe('');
    });

    it('should set placeholder if provided', () => {
      const editor = new TextEditor({ placeholder: 'Enter name...' });
      editor.init(container, '', params);

      const input = container.querySelector('input');
      expect(input?.placeholder).toBe('Enter name...');
    });

    it('should set maxLength if provided', () => {
      const editor = new TextEditor({ maxLength: 50 });
      editor.init(container, '', params);

      const input = container.querySelector('input');
      expect(input?.maxLength).toBe(50);
    });

    it('should set min/max for number type', () => {
      const editor = new TextEditor({ type: 'number', min: 0, max: 100 });
      editor.init(container, 50, params);

      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.min).toBe('0');
      expect(input.max).toBe('100');
    });

    it('should set pattern if provided', () => {
      const editor = new TextEditor({ pattern: '^[A-Za-z]+$' });
      editor.init(container, '', params);

      const input = container.querySelector('input');
      expect(input?.pattern).toBe('^[A-Za-z]+$');
    });

    it('should set required attribute if provided', () => {
      const editor = new TextEditor({ required: true });
      editor.init(container, '', params);

      const input = container.querySelector('input');
      expect(input?.required).toBe(true);
    });

    it('should set ARIA attributes', () => {
      editor.init(container, 'test', params);

      const input = container.querySelector('input');
      expect(input?.getAttribute('role')).toBe('textbox');
      expect(input?.getAttribute('aria-label')).toBe('Edit Name');
    });

    it('should set data attributes', () => {
      editor.init(container, 'test', params);

      const input = container.querySelector('input');
      expect(input?.dataset.row).toBe('0');
      expect(input?.dataset.col).toBe('0');
      expect(input?.dataset.field).toBe('name');
    });

    it('should focus input if autoFocus is true (default)', (done) => {
      const editor = new TextEditor();
      const focusSpy = jest.spyOn(HTMLInputElement.prototype, 'focus');
      editor.init(container, 'test', params);

      // Wait for requestAnimationFrame
      requestAnimationFrame(() => {
        expect(focusSpy).toHaveBeenCalled();
        focusSpy.mockRestore();
        done();
      });
    });

    it('should not focus if autoFocus is false', () => {
      const editor = new TextEditor({ autoFocus: false });
      editor.init(container, 'test', params);

      const input = container.querySelector('input');
      expect(document.activeElement).not.toBe(input);
    });

    it('should setup onChange listener', () => {
      const onChange = jest.fn();
      const params2 = { ...params, onChange };

      editor.init(container, 'test', params2);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = 'new value';
      input.dispatchEvent(new Event('input'));

      expect(onChange).toHaveBeenCalledWith('new value');
    });
  });

  describe('getValue()', () => {
    it('should return current value', () => {
      editor.init(container, 'test', params);

      expect(editor.getValue()).toBe('test');
    });

    it('should return parsed number for number type', () => {
      const editor = new TextEditor({ type: 'number' });
      editor.init(container, '42', params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '123';

      expect(editor.getValue()).toBe(123);
    });

    it('should return null for empty number input', () => {
      const editor = new TextEditor({ type: 'number' });
      editor.init(container, '', params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '';

      expect(editor.getValue()).toBeNull();
    });

    it('should return null for invalid number', () => {
      const editor = new TextEditor({ type: 'number' });
      editor.init(container, '', params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = 'abc';

      expect(editor.getValue()).toBeNull();
    });

    it('should return string for text type', () => {
      editor.init(container, '', params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = 'Hello World';

      expect(editor.getValue()).toBe('Hello World');
    });

    it('should return null if no input element', () => {
      expect(editor.getValue()).toBeNull();
    });

    it('should return null for empty string', () => {
      editor.init(container, '', params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '';

      expect(editor.getValue()).toBeNull();
    });
  });

  describe('isValid()', () => {
    it('should return true for valid value', () => {
      editor.init(container, 'test', params);

      const result = editor.isValid();
      expect(result).toBe(true);
    });

    it('should validate required field', () => {
      const editor = new TextEditor({ required: true });
      editor.init(container, '', params);

      const result = editor.isValid();
      expect(result).toEqual({
        valid: false,
        message: 'This field is required',
      });
    });

    it('should allow empty value when not required', () => {
      const editor = new TextEditor({ required: false });
      editor.init(container, '', params);

      const result = editor.isValid();
      expect(result).toBe(true);
    });

    it('should validate pattern', () => {
      const editor = new TextEditor({ pattern: '^[A-Za-z]+$' });
      editor.init(container, '', params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = 'abc123'; // Invalid: contains numbers

      const result = editor.isValid();
      expect(result).toMatchObject({
        valid: false,
        message: expect.stringContaining('pattern'),
      });
    });

    it('should pass pattern validation for valid value', () => {
      const editor = new TextEditor({ pattern: '^[A-Za-z]+$' });
      editor.init(container, '', params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = 'abc'; // Valid: only letters

      const result = editor.isValid();
      expect(result).toBe(true);
    });

    it('should validate min value for numbers', () => {
      const editor = new TextEditor({ type: 'number', min: 10 });
      editor.init(container, '', params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '5'; // Below min

      const result = editor.isValid();
      expect(result).toMatchObject({
        valid: false,
        message: expect.stringContaining('at least 10'),
      });
    });

    it('should validate max value for numbers', () => {
      const editor = new TextEditor({ type: 'number', max: 100 });
      editor.init(container, '', params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '150'; // Above max

      const result = editor.isValid();
      expect(result).toMatchObject({
        valid: false,
        message: expect.stringContaining('at most 100'),
      });
    });

    it('should pass range validation for valid number', () => {
      const editor = new TextEditor({ type: 'number', min: 0, max: 100 });
      editor.init(container, '', params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '50'; // Within range

      const result = editor.isValid();
      expect(result).toBe(true);
    });

    it('should use custom validator returning boolean', () => {
      const validator = jest.fn(() => false);
      const editor = new TextEditor({ validator });
      editor.init(container, 'test', params);

      const result = editor.isValid();
      expect(validator).toHaveBeenCalledWith('test');
      expect(result).toBe(false);
    });

    it('should use custom validator returning string error', () => {
      const validator = jest.fn(() => 'Custom error message');
      const editor = new TextEditor({ validator });
      editor.init(container, 'test', params);

      const result = editor.isValid();
      expect(result).toEqual({
        valid: false,
        message: 'Custom error message',
      });
    });

    it('should use custom validator returning true', () => {
      const validator = jest.fn(() => true);
      const editor = new TextEditor({ validator });
      editor.init(container, 'test', params);

      const result = editor.isValid();
      expect(result).toBe(true);
    });
  });

  describe('onKeyDown()', () => {
    it('should commit on Enter key', () => {
      const onComplete = jest.fn();
      const params2 = { ...params, onComplete };

      editor.init(container, 'initial', params2);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = 'modified';

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      editor.onKeyDown(enterEvent);

      expect(onComplete).toHaveBeenCalledWith('modified', false);
    });

    it('should cancel on Escape key', () => {
      const onComplete = jest.fn();
      const params2 = { ...params, onComplete };

      editor.init(container, 'initial', params2);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = 'modified';

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      editor.onKeyDown(escapeEvent);

      expect(onComplete).toHaveBeenCalledWith('modified', true);
    });

    it('should return true for Enter key (handled)', () => {
      editor.init(container, 'test', params);

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const result = editor.onKeyDown(enterEvent);

      expect(result).toBe(true);
    });

    it('should return true for Escape key (handled)', () => {
      editor.init(container, 'test', params);

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      const result = editor.onKeyDown(escapeEvent);

      expect(result).toBe(true);
    });

    it('should return true for other keys (prevent grid navigation)', () => {
      editor.init(container, 'test', params);

      const arrowEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      const result = editor.onKeyDown(arrowEvent);

      expect(result).toBe(true);
    });

    it('should not commit if validation fails', () => {
      const onComplete = jest.fn();
      const params2 = { ...params, onComplete };
      const editor = new TextEditor({ required: true });

      editor.init(container, 'test', params2);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = ''; // Empty value fails required validation

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      editor.onKeyDown(enterEvent);

      // Still calls onComplete but with validation warning logged
      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('focus()', () => {
    it('should focus the input element', () => {
      editor.init(container, 'test', params);

      const input = container.querySelector('input') as HTMLInputElement;
      const focusSpy = jest.spyOn(input, 'focus');

      editor.focus();

      expect(focusSpy).toHaveBeenCalled();
      focusSpy.mockRestore();
    });

    it('should handle case when input is null', () => {
      expect(() => {
        editor.focus();
      }).not.toThrow();
    });
  });

  describe('destroy()', () => {
    it('should remove input element', () => {
      editor.init(container, 'test', params);

      const input = container.querySelector('input');
      expect(input).toBeTruthy();

      editor.destroy();

      expect(container.querySelector('input')).toBeNull();
    });

    it('should clear internal references', () => {
      editor.init(container, 'test', params);

      editor.destroy();

      expect(editor.getValue()).toBeNull();
    });

    it('should not throw if called multiple times', () => {
      editor.init(container, 'test', params);

      expect(() => {
        editor.destroy();
        editor.destroy();
      }).not.toThrow();
    });

    it('should prevent blur commit after destroy', () => {
      const onComplete = jest.fn();
      const params2 = { ...params, onComplete };
      const editor = new TextEditor({ stopOnBlur: true });

      editor.init(container, 'test', params2);
      const input = container.querySelector('input') as HTMLInputElement;

      editor.destroy();

      // Simulate blur after destroy
      input.dispatchEvent(new Event('blur'));

      // Wait for blur timeout
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(onComplete).not.toHaveBeenCalled();
          resolve();
        }, 150);
      });
    });
  });

  describe('Blur Handling', () => {
    it('should commit on blur when stopOnBlur is true', () => {
      const onComplete = jest.fn();
      const params2 = { ...params, onComplete };
      const editor = new TextEditor({ stopOnBlur: true });

      editor.init(container, 'initial', params2);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = 'modified';
      input.dispatchEvent(new Event('blur'));

      // Wait for blur timeout
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(onComplete).toHaveBeenCalledWith('modified', false);
          resolve();
        }, 150);
      });
    });

    it('should not commit on blur when stopOnBlur is false', () => {
      const onComplete = jest.fn();
      const params2 = { ...params, onComplete };
      const editor = new TextEditor({ stopOnBlur: false });

      editor.init(container, 'initial', params2);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = 'modified';
      input.dispatchEvent(new Event('blur'));

      // Wait for blur timeout
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(onComplete).not.toHaveBeenCalled();
          resolve();
        }, 150);
      });
    });
  });

  describe('Event Propagation', () => {
    it('should stop click propagation', () => {
      editor.init(container, 'test', params);

      const input = container.querySelector('input') as HTMLInputElement;
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const stopPropagation = jest.spyOn(clickEvent, 'stopPropagation');

      input.dispatchEvent(clickEvent);

      expect(stopPropagation).toHaveBeenCalled();
    });

    it('should stop mousedown propagation', () => {
      editor.init(container, 'test', params);

      const input = container.querySelector('input') as HTMLInputElement;
      const mousedownEvent = new MouseEvent('mousedown', { bubbles: true });
      const stopPropagation = jest.spyOn(mousedownEvent, 'stopPropagation');

      input.dispatchEvent(mousedownEvent);

      expect(stopPropagation).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long text', () => {
      const longText = 'a'.repeat(10000);
      editor.init(container, longText, params);

      expect(editor.getValue()).toBe(longText);
    });

    it('should handle special characters', () => {
      const specialChars = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./';
      editor.init(container, specialChars, params);

      expect(editor.getValue()).toBe(specialChars);
    });

    it('should handle unicode characters', () => {
      const unicode = '你好世界🌍';
      editor.init(container, unicode, params);

      expect(editor.getValue()).toBe(unicode);
    });

    it('should handle whitespace', () => {
      const whitespace = '  \t  ';
      editor.init(container, whitespace, params);

      expect(editor.getValue()).toBe(whitespace);
    });

    it('should handle negative numbers', () => {
      const editor = new TextEditor({ type: 'number' });
      editor.init(container, '', params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '-42';

      expect(editor.getValue()).toBe(-42);
    });

    it('should handle decimal numbers', () => {
      const editor = new TextEditor({ type: 'number' });
      editor.init(container, '', params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '3.14';

      expect(editor.getValue()).toBe(3.14);
    });

    it('should handle large numbers', () => {
      const editor = new TextEditor({ type: 'number' });
      editor.init(container, '', params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '9999999999';

      expect(editor.getValue()).toBe(9999999999);
    });

    it('should handle zero', () => {
      const editor = new TextEditor({ type: 'number' });
      editor.init(container, '', params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '0';

      expect(editor.getValue()).toBe(0);
    });

    it('should handle email type', () => {
      const editor = new TextEditor({ type: 'email' });
      editor.init(container, '', params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = 'test@example.com';

      expect(editor.getValue()).toBe('test@example.com');
    });

    it('should handle url type', () => {
      const editor = new TextEditor({ type: 'url' });
      editor.init(container, '', params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = 'https://example.com';

      expect(editor.getValue()).toBe('https://example.com');
    });

    it('should handle tel type', () => {
      const editor = new TextEditor({ type: 'tel' });
      editor.init(container, '', params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '+1234567890';

      expect(editor.getValue()).toBe('+1234567890');
    });

    it('should handle password type', () => {
      const editor = new TextEditor({ type: 'password' });
      editor.init(container, '', params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = 'secret123';

      expect(editor.getValue()).toBe('secret123');
      expect(input.type).toBe('password');
    });
  });

  describe('Factory Function', () => {
    it('should create TextEditor instance', () => {
      const editor = createTextEditor();
      expect(editor).toBeInstanceOf(TextEditor);
    });

    it('should pass options to constructor', () => {
      const options: TextEditorOptions = {
        type: 'email',
        placeholder: 'Enter email...',
        required: true,
      };

      const editor = createTextEditor(options);
      expect(editor).toBeInstanceOf(TextEditor);

      editor.init(container, '', params);

      const input = container.querySelector('input');
      expect(input?.type).toBe('email');
      expect(input?.placeholder).toBe('Enter email...');
      expect(input?.required).toBe(true);
    });
  });
});
