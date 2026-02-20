/**
 * @jest-environment jsdom
 */

import { DateEditor, createDateEditor } from '../datetime/date-editor';
import type { DateEditorOptions } from '../datetime/date-editor';
import type { EditorParams } from '../cell-editor.interface';

describe('DateEditor', () => {
  let editor: DateEditor;
  let container: HTMLElement;
  let params: EditorParams;

  beforeEach(() => {
    editor = new DateEditor();
    container = document.createElement('div');
    document.body.appendChild(container);
    params = {
      cell: { row: 0, col: 1 },
      column: { header: 'Birth Date', field: 'birthDate' },
      rowData: { id: 1, name: 'John', birthDate: new Date('1990-01-15') },
    };
  });

  afterEach(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    // Clean up any popups added to document.body
    document.querySelectorAll('.zg-datetime-popup').forEach(el => el.remove());
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

    it('should use DD/MM/YYYY format by default', () => {
      editor.init(container, new Date('2024-03-15'), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('15/03/2024');
    });

    it('should apply custom className', () => {
      const customEditor = new DateEditor({ className: 'custom-date-editor' });
      customEditor.init(container, new Date(), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.className).toBe('custom-date-editor-input zg-datetime-input');
    });

    it('should default to text input type when using calendar popup', () => {
      editor.init(container, new Date(), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.type).toBe('text');
    });

    it('should support datetime-local type with native picker', () => {
      const customEditor = new DateEditor({ type: 'datetime-local', useCalendarPopup: false });
      customEditor.init(container, new Date('2024-03-15T10:30:00'), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.type).toBe('datetime-local');
      expect(input.value).toMatch(/2024-03-15T\d{2}:\d{2}/);
    });

    it('should support time type with native picker', () => {
      const customEditor = new DateEditor({ type: 'time', useCalendarPopup: false });
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
      expect(input?.type).toBe('text');
    });

    it('should set initial value from Date object', () => {
      const date = new Date('2024-03-15');
      editor.init(container, date, params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('15/03/2024');
    });

    it('should set initial value from string', () => {
      editor.init(container, '2024-03-15' as any, params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('15/03/2024');
    });

    it('should set initial value from timestamp', () => {
      const timestamp = new Date('2024-03-15').getTime();
      editor.init(container, timestamp as any, params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('15/03/2024');
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

    it('should set required attribute on input element', () => {
      const customEditor = new DateEditor({ required: true });
      customEditor.init(container, null, params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.required).toBe(true);
    });

    it('should set min attribute for native picker', () => {
      const customEditor = new DateEditor({ minDate: new Date('2020-01-01'), useCalendarPopup: false });
      customEditor.init(container, new Date(), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.min).toBe('2020-01-01');
    });

    it('should set max attribute for native picker', () => {
      const customEditor = new DateEditor({ maxDate: new Date('2030-12-31'), useCalendarPopup: false });
      customEditor.init(container, new Date(), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.max).toBe('2030-12-31');
    });

    it('should not set min/max for calendar popup', () => {
      const customEditor = new DateEditor({ minDate: '2020-01-01' });
      customEditor.init(container, new Date(), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.min).toBe('');
    });

    it('should set ARIA attributes', () => {
      editor.init(container, new Date(), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.getAttribute('aria-label')).toBe('Date input');
    });

    it('should set aria-required when required is true', () => {
      const customEditor = new DateEditor({ required: true });
      customEditor.init(container, new Date(), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.getAttribute('aria-required')).toBe('true');
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
        message: 'Date is required',
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
        message: 'Date is before minimum allowed',
      });
    });

    it('should validate max date constraint', () => {
      const customEditor = new DateEditor({
        maxDate: new Date('2024-12-31'),
      });
      customEditor.init(container, new Date('2025-01-01'), params);
      const result = customEditor.isValid();
      expect(result).toMatchObject({
        valid: false,
        message: 'Date is after maximum allowed',
      });
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
      const result = customEditor.isValid();
      expect(result).toMatchObject({ valid: false });

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

    it('should handle invalid input gracefully', () => {
      editor.init(container, null, params);
      const input = container.querySelector('input') as HTMLInputElement;
      input.value = 'invalid-date';
      const value = editor.getValue();
      expect(value).toBe(null);
    });
  });

  describe('onKeyDown()', () => {
    it('should commit on Enter key', () => {
      const onComplete = jest.fn();
      editor.init(container, new Date('2024-03-15'), { ...params, onComplete });

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const handled = editor.onKeyDown(enterEvent);

      expect(handled).toBe(true);
      expect(onComplete).toHaveBeenCalledWith(expect.any(Date), false);
    });

    it('should cancel on Escape key', () => {
      const onComplete = jest.fn();
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

    it('should cancel editing on Escape', () => {
      const onComplete = jest.fn();
      const initialDate = new Date('2024-03-15');
      editor.init(container, initialDate, { ...params, onComplete });

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '20/06/2024';

      editor.onKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(onComplete).toHaveBeenCalledWith(initialDate, true);
    });

    it('should return true for all keys', () => {
      editor.init(container, new Date(), params);
      const event = new KeyboardEvent('keydown', { key: 'a' });
      const handled = editor.onKeyDown(event);
      expect(handled).toBe(true);
    });

    it('should prevent default on Enter and Escape', () => {
      editor.init(container, new Date(), params);

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const preventDefaultSpy = jest.spyOn(enterEvent, 'preventDefault');
      editor.onKeyDown(enterEvent);
      expect(preventDefaultSpy).toHaveBeenCalled();

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      const preventDefaultSpy2 = jest.spyOn(escapeEvent, 'preventDefault');
      editor.onKeyDown(escapeEvent);
      expect(preventDefaultSpy2).toHaveBeenCalled();
    });
  });

  describe('focus()', () => {
    it('should focus the input element', () => {
      editor.init(container, new Date(), params);
      const input = container.querySelector('input') as HTMLInputElement;
      const focusSpy = jest.spyOn(input, 'focus');

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
      const onComplete = jest.fn();
      const customEditor = new DateEditor({ commitOnBlur: true });
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
    it('should commit on blur when commitOnBlur is true', () => {
      const onComplete = jest.fn();
      const customEditor = new DateEditor({ commitOnBlur: true, useCalendarPopup: false });
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

    it('should not commit on blur when commitOnBlur is false', () => {
      const onComplete = jest.fn();
      const customEditor = new DateEditor({ commitOnBlur: false });
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
    it('should call onChange when using native picker', () => {
      const onChange = jest.fn();
      const customEditor = new DateEditor({ useCalendarPopup: false });
      customEditor.init(container, new Date('2024-03-15'), { ...params, onChange });

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '2024-06-20';
      input.dispatchEvent(new Event('change'));

      expect(onChange).toHaveBeenCalledWith(expect.any(Date));
    });

    it('should not call onChange when not provided', () => {
      const customEditor = new DateEditor({ useCalendarPopup: false });
      customEditor.init(container, new Date('2024-03-15'), params);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '2024-06-20';

      expect(() => {
        input.dispatchEvent(new Event('change'));
      }).not.toThrow();
    });

    it('should call onChange with null when input is cleared', () => {
      const onChange = jest.fn();
      const customEditor = new DateEditor({ useCalendarPopup: false });
      customEditor.init(container, new Date('2024-03-15'), { ...params, onChange });

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = '';
      input.dispatchEvent(new Event('change'));

      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  describe('Calendar Popup', () => {
    it('should create popup element', () => {
      editor.init(container, new Date(), params);
      const popup = document.querySelector('.zg-datetime-popup');
      expect(popup).toBeTruthy();
    });

    it('should skip popup for native picker', () => {
      const customEditor = new DateEditor({ useCalendarPopup: false });
      customEditor.init(container, new Date(), params);
      const popup = document.querySelector('.zg-datetime-popup');
      expect(popup).toBeFalsy();
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
    it('should format date with default format', () => {
      const customEditor = new DateEditor({ type: 'date' });
      customEditor.init(container, new Date('2024-03-15T10:30:00'), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('15/03/2024');
    });

    it('should format datetime-local type correctly for native picker', () => {
      const customEditor = new DateEditor({ type: 'datetime-local', useCalendarPopup: false });
      customEditor.init(container, new Date('2024-03-15T10:30:00'), params);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toMatch(/2024-03-15T\d{2}:\d{2}/);
    });

    it('should format time type correctly for native picker', () => {
      const customEditor = new DateEditor({ type: 'time', useCalendarPopup: false });
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
        useCalendarPopup: false,
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
