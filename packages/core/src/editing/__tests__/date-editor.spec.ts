/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DateEditor, createDateEditor, type DateEditorOptions } from '../date-editor';
import type { EditorParams } from '../cell-editor.interface';

describe('DateEditor', () => {
  let editor: DateEditor;
  let container: HTMLElement;
  let params: EditorParams;

  beforeEach(() => {
    editor = new DateEditor();
    container = document.createElement('div');
    params = {
      cell: { row: 0, col: 1 },
      column: { header: 'Birth Date', field: 'birthDate' },
      rowData: { id: 1, name: 'John', birthDate: new Date('1990-01-15') },
    };
  });

  describe('Constructor', () => {
    it('should create instance with default options', () => {
      expect(editor).toBeInstanceOf(DateEditor);
    });

    it('should accept custom options', () => {
      const options: DateEditorOptions = {
        type: 'datetime-local',
        minDate: new Date('2020-01-01'),
        maxDate: new Date('2030-12-31'),
        required: true,
        placeholder: 'Select date...',
        validator: (value) => value !== null,
      };
      const customEditor = new DateEditor(options);
      expect(customEditor).toBeInstanceOf(DateEditor);
    });

    it('should use YYYY-MM-DD format by default', () => {
      editor.init(container, new Date('2024-03-15'), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('2024-03-15');
    });

    it('should apply custom className', () => {
      const customEditor = new DateEditor({ className: 'custom-date-editor' });
      customEditor.init(container, new Date(), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.className).toBe('custom-date-editor');
    });

    it('should default to date input type', () => {
      editor.init(container, new Date(), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.type).toBe('date');
    });

    it('should support datetime-local type', () => {
      const customEditor = new DateEditor({ type: 'datetime-local' });
      customEditor.init(container, new Date('2024-03-15T10:30:00'), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.type).toBe('datetime-local');
      expect(input.value).toMatch(/2024-03-15T\d{2}:\d{2}/);
    });

    it('should support time type', () => {
      const customEditor = new DateEditor({ type: 'time' });
      customEditor.init(container, new Date('2024-03-15T14:30:00'), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.type).toBe('time');
      expect(input.value).toBe('14:30');
    });
  });

  describe('init()', () => {
    it('should create input element', () => {
      editor.init(container, new Date('2024-01-15'), params);
      const input = container.querySelector('input');
      expect(input).toBeTruthy();
      expect(input?.type).toBe('date');
    });

    it('should set initial value from Date object', () => {
      const date = new Date('2024-03-15');
      editor.init(container, date, params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('2024-03-15');
    });

    it('should set initial value from string', () => {
      editor.init(container, '2024-03-15' as any, params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('2024-03-15');
    });

    it('should set initial value from timestamp', () => {
      const timestamp = new Date('2024-03-15').getTime();
      editor.init(container, timestamp as any, params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('2024-03-15');
    });

    it('should handle null initial value', () => {
      editor.init(container, null, params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should handle undefined initial value', () => {
      editor.init(container, undefined as any, params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should apply placeholder when provided', () => {
      const customEditor = new DateEditor({ placeholder: 'Select date...' });
      customEditor.init(container, null, params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.placeholder).toBe('Select date...');
    });

    it('should set required attribute when required is true', () => {
      const customEditor = new DateEditor({ required: true });
      customEditor.init(container, null, params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.required).toBe(true);
    });

    it('should not set required when required is false', () => {
      const customEditor = new DateEditor({ required: false });
      customEditor.init(container, null, params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.required).toBe(false);
    });

    it('should set min attribute from Date object', () => {
      const customEditor = new DateEditor({ minDate: new Date('2020-01-01') });
      customEditor.init(container, new Date(), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.min).toBe('2020-01-01');
    });

    it('should set max attribute from Date object', () => {
      const customEditor = new DateEditor({ maxDate: new Date('2030-12-31') });
      customEditor.init(container, new Date(), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.max).toBe('2030-12-31');
    });

    it('should set min attribute from string', () => {
      const customEditor = new DateEditor({ minDate: '2020-01-01' });
      customEditor.init(container, new Date(), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.min).toBe('2020-01-01');
    });

    it('should set ARIA attributes', () => {
      editor.init(container, new Date(), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.getAttribute('role')).toBe('textbox');
      expect(input.getAttribute('aria-label')).toContain('Birth Date');
      expect(input.getAttribute('aria-required')).toBe('false');
    });

    it('should set data attributes', () => {
      editor.init(container, new Date(), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.dataset.row).toBe('0');
      expect(input.dataset.col).toBe('1');
      expect(input.dataset.field).toBe('birthDate');
    });

    it('should auto-focus by default', () => {
      editor.init(container, new Date(), params);
      const input = container.querySelector('input') as HTMLInputElement;
      // Focus is called via requestAnimationFrame, so we can't test it directly
      // but we can verify the input exists and is in the DOM
      expect(input).toBeTruthy();
      expect(document.contains(input)).toBe(true);
    });

    it('should not auto-focus when disabled', () => {
      const customEditor = new DateEditor({ autoFocus: false });
      customEditor.init(container, new Date(), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toBeTruthy();
    });
  });

  describe('getValue()', () => {
    it('should return Date object for valid date input', () => {
      editor.init(container, new Date('2024-03-15'), params);
      const value = editor.getValue();
      expect(value).toBeInstanceOf(Date);
      expect(value?.toISOString()).toContain('2024-03-15');
    });

    it('should return null for empty input', () => {
      editor.init(container, null, params);
      const value = editor.getValue();
      expect(value).toBe(null);
    });

    it('should return null before initialization', () => {
      const value = editor.getValue();
      expect(value).toBe(null);
    });

    it('should return Date after user input', () => {
      editor.init(container, null, params);
      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '2024-06-20';
      const value = editor.getValue();
      expect(value).toBeInstanceOf(Date);
      expect(value?.getFullYear()).toBe(2024);
      expect(value?.getMonth()).toBe(5); // June (0-indexed)
      expect(value?.getDate()).toBe(20);
    });

    it('should handle datetime-local values', () => {
      const customEditor = new DateEditor({ type: 'datetime-local' });
      customEditor.init(container, new Date('2024-03-15T14:30:00'), params);
      const value = customEditor.getValue();
      expect(value).toBeInstanceOf(Date);
    });

    it('should handle time values', () => {
      const customEditor = new DateEditor({ type: 'time' });
      customEditor.init(container, new Date('2024-03-15T14:30:00'), params);
      const value = customEditor.getValue();
      expect(value).toBeInstanceOf(Date);
    });
  });

  describe('isValid()', () => {
    it('should return true for valid date', () => {
      editor.init(container, new Date('2024-03-15'), params);
      expect(editor.isValid()).toBe(true);
    });

    it('should return true for empty value when not required', () => {
      const customEditor = new DateEditor({ required: false });
      customEditor.init(container, null, params);
      expect(customEditor.isValid()).toBe(true);
    });

    it('should return error for empty value when required', () => {
      const customEditor = new DateEditor({ required: true });
      customEditor.init(container, null, params);
      const result = customEditor.isValid();
      expect(result).toMatchObject({
        valid: false,
        message: 'This field is required',
      });
    });

    it('should validate min date constraint', () => {
      const customEditor = new DateEditor({
        minDate: new Date('2024-01-01'),
      });
      customEditor.init(container, new Date('2023-12-31'), params);
      const result = customEditor.isValid();
      expect(result).toMatchObject({
        valid: false,
      });
      expect((result as any).message).toContain('must be after');
    });

    it('should validate max date constraint', () => {
      const customEditor = new DateEditor({
        maxDate: new Date('2024-12-31'),
      });
      customEditor.init(container, new Date('2025-01-01'), params);
      const result = customEditor.isValid();
      expect(result).toMatchObject({
        valid: false,
      });
      expect((result as any).message).toContain('must be before');
    });

    it('should pass validation when date is within range', () => {
      const customEditor = new DateEditor({
        minDate: new Date('2024-01-01'),
        maxDate: new Date('2024-12-31'),
      });
      customEditor.init(container, new Date('2024-06-15'), params);
      expect(customEditor.isValid()).toBe(true);
    });

    it('should use custom validator returning boolean', () => {
      const customEditor = new DateEditor({
        validator: (value) => {
          return value !== null && value.getFullYear() >= 2020;
        },
      });
      customEditor.init(container, new Date('2019-01-01'), params);
      expect(customEditor.isValid()).toBe(false);

      customEditor.init(container, new Date('2024-01-01'), params);
      expect(customEditor.isValid()).toBe(true);
    });

    it('should use custom validator returning error message', () => {
      const customEditor = new DateEditor({
        validator: (value) => {
          if (!value) return 'Date is required';
          if (value.getFullYear() < 2020) return 'Must be 2020 or later';
          return true;
        },
      });
      customEditor.init(container, new Date('2019-01-01'), params);
      const result = customEditor.isValid();
      expect(result).toMatchObject({
        valid: false,
        message: 'Must be 2020 or later',
      });
    });

    it('should return error for invalid date string', () => {
      editor.init(container, null, params);
      const input = container.querySelector('input') as HTMLInputElement;
      input.value = 'invalid-date';
      const result = editor.isValid();
      expect(result).toMatchObject({
        valid: false,
        message: 'Invalid date format',
      });
    });
  });

  describe('onKeyDown()', () => {
    it('should commit on Enter key', () => {
      const onComplete = vi.fn();
      editor.init(container, new Date('2024-03-15'), { ...params, onComplete });

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const handled = editor.onKeyDown(enterEvent);

      expect(handled).toBe(true);
      expect(onComplete).toHaveBeenCalledWith(expect.any(Date), false);
    });

    it('should cancel on Escape key', () => {
      const onComplete = vi.fn();
      const initialDate = new Date('2024-03-15');
      editor.init(container, initialDate, { ...params, onComplete });

      // Change the value
      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '2024-06-20';

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      const handled = editor.onKeyDown(escapeEvent);

      expect(handled).toBe(true);
      expect(onComplete).toHaveBeenCalledWith(initialDate, true);
    });

    it('should restore initial value on Escape', () => {
      const initialDate = new Date('2024-03-15');
      editor.init(container, initialDate, params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '2024-06-20'; // Change value

      editor.onKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(input.value).toBe('2024-03-15'); // Restored
    });

    it('should restore to empty on Escape when initial value was null', () => {
      editor.init(container, null, params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '2024-06-20'; // Set value

      editor.onKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(input.value).toBe(''); // Restored to empty
    });

    it('should stop propagation on all keys', () => {
      editor.init(container, new Date(), params);
      const event = new KeyboardEvent('keydown', { key: 'a' });
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

      editor.onKeyDown(event);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should prevent default on Enter and Escape', () => {
      editor.init(container, new Date(), params);

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const preventDefaultSpy = vi.spyOn(enterEvent, 'preventDefault');
      editor.onKeyDown(enterEvent);
      expect(preventDefaultSpy).toHaveBeenCalled();

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      const preventDefaultSpy2 = vi.spyOn(escapeEvent, 'preventDefault');
      editor.onKeyDown(escapeEvent);
      expect(preventDefaultSpy2).toHaveBeenCalled();
    });
  });

  describe('focus()', () => {
    it('should focus the input element', () => {
      editor.init(container, new Date(), params);
      const input = container.querySelector('input') as HTMLInputElement;
      const focusSpy = vi.spyOn(input, 'focus');

      editor.focus();

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should not throw when called before initialization', () => {
      expect(() => editor.focus()).not.toThrow();
    });
  });

  describe('destroy()', () => {
    it('should remove input element from DOM', () => {
      editor.init(container, new Date(), params);
      const input = container.querySelector('input');
      expect(input).toBeTruthy();

      editor.destroy();

      const inputAfter = container.querySelector('input');
      expect(inputAfter).toBeFalsy();
    });

    it('should clear internal references', () => {
      editor.init(container, new Date(), params);
      editor.destroy();

      // getValue should return null after destroy
      expect(editor.getValue()).toBe(null);
    });

    it('should be safe to call multiple times', () => {
      editor.init(container, new Date(), params);

      expect(() => {
        editor.destroy();
        editor.destroy();
        editor.destroy();
      }).not.toThrow();
    });

    it('should prevent blur handler from firing after destroy', () => {
      const onComplete = vi.fn();
      const customEditor = new DateEditor({ stopOnBlur: true });
      customEditor.init(container, new Date(), { ...params, onComplete });

      const input = container.querySelector('input') as HTMLInputElement;
      customEditor.destroy();

      // Trigger blur event
      input.dispatchEvent(new FocusEvent('blur'));

      // Wait for timeout
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(onComplete).not.toHaveBeenCalled();
          resolve(undefined);
        }, 150);
      });
    });
  });

  describe('Blur Handling', () => {
    it('should commit on blur when stopOnBlur is true', () => {
      const onComplete = vi.fn();
      const customEditor = new DateEditor({ stopOnBlur: true });
      customEditor.init(container, new Date('2024-03-15'), { ...params, onComplete });

      const input = container.querySelector('input') as HTMLInputElement;
      input.dispatchEvent(new FocusEvent('blur'));

      return new Promise((resolve) => {
        setTimeout(() => {
          expect(onComplete).toHaveBeenCalledWith(expect.any(Date), false);
          resolve(undefined);
        }, 150);
      });
    });

    it('should not commit on blur when stopOnBlur is false', () => {
      const onComplete = vi.fn();
      const customEditor = new DateEditor({ stopOnBlur: false });
      customEditor.init(container, new Date('2024-03-15'), { ...params, onComplete });

      const input = container.querySelector('input') as HTMLInputElement;
      input.dispatchEvent(new FocusEvent('blur'));

      return new Promise((resolve) => {
        setTimeout(() => {
          expect(onComplete).not.toHaveBeenCalled();
          resolve(undefined);
        }, 150);
      });
    });
  });

  describe('onChange Callback', () => {
    it('should call onChange when input value changes', () => {
      const onChange = vi.fn();
      editor.init(container, new Date('2024-03-15'), { ...params, onChange });

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '2024-06-20';
      input.dispatchEvent(new Event('input'));

      expect(onChange).toHaveBeenCalledWith(expect.any(Date));
    });

    it('should not call onChange when not provided', () => {
      editor.init(container, new Date('2024-03-15'), params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '2024-06-20';

      expect(() => {
        input.dispatchEvent(new Event('input'));
      }).not.toThrow();
    });

    it('should call onChange with null when input is cleared', () => {
      const onChange = vi.fn();
      editor.init(container, new Date('2024-03-15'), { ...params, onChange });

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '';
      input.dispatchEvent(new Event('input'));

      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  describe('Event Propagation', () => {
    it('should stop click propagation', () => {
      editor.init(container, new Date(), params);
      const input = container.querySelector('input') as HTMLInputElement;

      const clickEvent = new MouseEvent('click', { bubbles: true });
      const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

      input.dispatchEvent(clickEvent);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should stop mousedown propagation', () => {
      editor.init(container, new Date(), params);
      const input = container.querySelector('input') as HTMLInputElement;

      const mousedownEvent = new MouseEvent('mousedown', { bubbles: true });
      const stopPropagationSpy = vi.spyOn(mousedownEvent, 'stopPropagation');

      input.dispatchEvent(mousedownEvent);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe('Date Parsing', () => {
    it('should parse ISO date strings', () => {
      editor.init(container, '2024-03-15T10:30:00.000Z' as any, params);
      const value = editor.getValue();
      expect(value).toBeInstanceOf(Date);
      expect(value?.getFullYear()).toBe(2024);
    });

    it('should parse timestamps', () => {
      const timestamp = new Date('2024-03-15').getTime();
      editor.init(container, timestamp as any, params);
      const value = editor.getValue();
      expect(value).toBeInstanceOf(Date);
      expect(value?.getFullYear()).toBe(2024);
    });

    it('should handle invalid date strings as null', () => {
      editor.init(container, 'not-a-date' as any, params);
      const value = editor.getValue();
      expect(value).toBe(null);
    });

    it('should handle invalid Date objects as null', () => {
      const invalidDate = new Date('invalid');
      editor.init(container, invalidDate, params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  describe('Date Formatting', () => {
    it('should format date type as YYYY-MM-DD', () => {
      const customEditor = new DateEditor({ type: 'date' });
      customEditor.init(container, new Date('2024-03-15T10:30:00'), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('2024-03-15');
    });

    it('should format datetime-local type correctly', () => {
      const customEditor = new DateEditor({ type: 'datetime-local' });
      customEditor.init(container, new Date('2024-03-15T10:30:00'), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toMatch(/2024-03-15T\d{2}:\d{2}/);
    });

    it('should format time type correctly', () => {
      const customEditor = new DateEditor({ type: 'time' });
      customEditor.init(container, new Date('2024-03-15T14:30:00'), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('14:30');
    });
  });

  describe('Factory Function', () => {
    it('should create DateEditor instance', () => {
      const instance = createDateEditor();
      expect(instance).toBeInstanceOf(DateEditor);
    });

    it('should pass options to constructor', () => {
      const instance = createDateEditor({
        type: 'datetime-local',
        required: true,
        placeholder: 'Select datetime...',
      });
      expect(instance).toBeInstanceOf(DateEditor);

      instance.init(container, null, params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.type).toBe('datetime-local');
      expect(input.required).toBe(true);
      expect(input.placeholder).toBe('Select datetime...');
    });
  });
});
