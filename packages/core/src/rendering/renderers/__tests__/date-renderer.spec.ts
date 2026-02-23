/**
 * @jest-environment jsdom
 */

import { DateRenderer, createDateRenderer } from '../datetime/date-renderer';
import type { RenderParams } from '../renderer.interface';

describe('DateRenderer', () => {
  let renderer: DateRenderer;
  let element: HTMLElement;
  let params: RenderParams;

  beforeEach(() => {
    renderer = new DateRenderer();
    element = document.createElement('div');
    params = {
      cell: { row: 0, col: 0 },
      position: { x: 0, y: 0, width: 150, height: 30 },
      value: new Date('2024-01-15'),
      column: { field: 'createdAt', header: 'Created Date' },
      rowData: { id: 1, createdAt: new Date('2024-01-15') },
      isSelected: false,
      isActive: false,
      isEditing: false,
    } as RenderParams;
  });

  describe('Constructor', () => {
    it('should create renderer with default options', () => {
      const renderer = new DateRenderer();
      expect(renderer).toBeInstanceOf(DateRenderer);
    });

    it('should create renderer with custom format', () => {
      const renderer = new DateRenderer({ format: 'DD/MM/YYYY' });
      expect(renderer).toBeInstanceOf(DateRenderer);
    });

    it('should create renderer with custom className', () => {
      const renderer = new DateRenderer({ className: 'custom-date' });
      expect(renderer).toBeInstanceOf(DateRenderer);
    });

    it('should create renderer with custom emptyText', () => {
      const renderer = new DateRenderer({ emptyText: 'No Date' });
      expect(renderer).toBeInstanceOf(DateRenderer);
    });

    it('should create renderer with useRelativeLabels', () => {
      const renderer = new DateRenderer({ useRelativeLabels: true });
      expect(renderer).toBeInstanceOf(DateRenderer);
    });
  });

  describe('render()', () => {
    it('should create date display span', () => {
      renderer.render(element, params);

      const span = element.querySelector('.zg-datetime-display');
      expect(span).toBeTruthy();
    });

    it('should add zg-cell-date-display class to element', () => {
      renderer.render(element, params);
      expect(element.classList.contains('zg-cell-date-display')).toBe(true);
    });

    it('should format date value with default format (DD/MM/YYYY)', () => {
      renderer.render(element, params);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('15/01/2024');
    });

    it('should apply custom className to span', () => {
      const renderer = new DateRenderer({ className: 'custom-date' });
      renderer.render(element, params);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.classList.contains('custom-date')).toBe(true);
    });

    it('should display emptyText for null value', () => {
      const renderer = new DateRenderer({ emptyText: 'N/A' });
      const nullParams = { ...params, value: null };
      renderer.render(element, nullParams);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('N/A');
      expect(span?.classList.contains('empty')).toBe(true);
    });

    it('should use empty string as default emptyText', () => {
      const nullParams = { ...params, value: null };
      renderer.render(element, nullParams);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('');
      expect(span?.classList.contains('empty')).toBe(true);
    });
  });

  describe('update()', () => {
    beforeEach(() => {
      renderer.render(element, params);
    });

    it('should update date text when value changes', () => {
      const newParams = { ...params, value: new Date('2024-06-30') };
      renderer.update(element, newParams);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('30/06/2024');
    });

    it('should update from null to date', () => {
      const nullParams = { ...params, value: null };
      renderer.update(element, nullParams);

      let span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('');
      expect(span?.classList.contains('empty')).toBe(true);

      const newParams = { ...params, value: new Date('2024-03-20') };
      renderer.update(element, newParams);

      span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('20/03/2024');
      expect(span?.classList.contains('empty')).toBe(false);
    });

    it('should update from date to null', () => {
      renderer.update(element, params);

      const nullParams = { ...params, value: null };
      renderer.update(element, nullParams);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('');
      expect(span?.classList.contains('empty')).toBe(true);
    });

    it('should handle update when span is missing', () => {
      element.innerHTML = ''; // Remove span
      expect(() => renderer.update(element, params)).not.toThrow();
    });
  });

  describe('destroy()', () => {
    it('should remove date content', () => {
      renderer.render(element, params);
      renderer.destroy(element);

      expect(element.innerHTML).toBe('');
    });

    it('should remove zg-cell-date-display class', () => {
      renderer.render(element, params);
      renderer.destroy(element);

      expect(element.classList.contains('zg-cell-date-display')).toBe(false);
    });
  });

  describe('getCellClass()', () => {
    it('should return zg-date-display-empty for null date', () => {
      const nullParams = { ...params, value: null };
      const className = renderer.getCellClass(nullParams);

      expect(className).toBe('zg-date-display-empty');
    });

    it('should return zg-date-display-empty for undefined date', () => {
      const undefinedParams = { ...params, value: undefined };
      const className = renderer.getCellClass(undefinedParams);

      expect(className).toBe('zg-date-display-empty');
    });

    it('should return zg-date-display-has-value for valid date', () => {
      const className = renderer.getCellClass(params);
      expect(className).toBe('zg-date-display-has-value');
    });
  });

  describe('Date Parsing', () => {
    beforeEach(() => {
      renderer.render(element, params);
    });

    it('should parse Date object', () => {
      const date = new Date('2024-03-15');
      const newParams = { ...params, value: date };
      renderer.update(element, newParams);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('15/03/2024');
    });

    it('should parse ISO string', () => {
      const newParams = { ...params, value: '2024-08-20' };
      renderer.update(element, newParams);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('20/08/2024');
    });

    it('should parse timestamp number', () => {
      const timestamp = new Date('2024-12-25').getTime();
      const newParams = { ...params, value: timestamp };
      renderer.update(element, newParams);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('25/12/2024');
    });

    it('should handle null value', () => {
      const newParams = { ...params, value: null };
      renderer.update(element, newParams);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('');
    });

    it('should handle undefined value', () => {
      const newParams = { ...params, value: undefined };
      renderer.update(element, newParams);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('');
    });

    it('should handle invalid date string', () => {
      const newParams = { ...params, value: 'not-a-date' };
      renderer.update(element, newParams);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('');
    });

    it('should handle invalid Date object', () => {
      const newParams = { ...params, value: new Date('invalid') };
      renderer.update(element, newParams);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('');
    });

    it('should use custom emptyText for null', () => {
      const renderer = new DateRenderer({ emptyText: 'N/A' });
      renderer.render(element, params);

      const newParams = { ...params, value: null };
      renderer.update(element, newParams);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('N/A');
    });
  });

  describe('Date Formatting', () => {
    it('should format MM/DD/YYYY', () => {
      const renderer = new DateRenderer({ format: 'MM/DD/YYYY' });
      renderer.render(element, params);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('01/15/2024');
    });

    it('should format DD/MM/YYYY (default)', () => {
      const renderer = new DateRenderer({ format: 'DD/MM/YYYY' });
      renderer.render(element, params);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('15/01/2024');
    });

    it('should format YYYY-MM-DD', () => {
      const renderer = new DateRenderer({ format: 'YYYY-MM-DD' });
      renderer.render(element, params);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('2024-01-15');
    });

    it('should format DD-MM-YYYY', () => {
      const renderer = new DateRenderer({ format: 'DD-MM-YYYY' });
      renderer.render(element, params);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('15-01-2024');
    });

    it('should format MM-DD-YYYY', () => {
      const renderer = new DateRenderer({ format: 'MM-DD-YYYY' });
      renderer.render(element, params);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('01-15-2024');
    });

    it('should format YYYY/MM/DD', () => {
      const renderer = new DateRenderer({ format: 'YYYY/MM/DD' });
      renderer.render(element, params);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('2024/01/15');
    });

    it('should pad single-digit months and days', () => {
      const renderer = new DateRenderer({ format: 'YYYY-MM-DD' });
      const newParams = { ...params, value: new Date('2024-03-05') };
      renderer.render(element, newParams);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('2024-03-05');
    });
  });

  describe('Lifecycle', () => {
    it('should support full render -> update -> destroy cycle', () => {
      // Render
      renderer.render(element, params);
      expect(element.querySelector('.zg-datetime-display')).toBeTruthy();

      // Update
      const newParams = { ...params, value: new Date('2024-06-30') };
      renderer.update(element, newParams);
      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('30/06/2024');

      // Destroy
      renderer.destroy(element);
      expect(element.innerHTML).toBe('');
    });

    it('should support multiple updates', () => {
      renderer.render(element, params);

      for (let i = 1; i <= 5; i++) {
        const newDate = new Date(`2024-0${i}-15`);
        const newParams = { ...params, value: newDate };
        renderer.update(element, newParams);

        const span = element.querySelector('.zg-datetime-display');
        expect(span?.textContent).toBe(`15/0${i}/2024`);
      }
    });

    it('should handle re-render after destroy', () => {
      renderer.render(element, params);
      renderer.destroy(element);
      renderer.render(element, params);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('15/01/2024');
    });
  });

  describe('Edge Cases', () => {
    it('should handle leap year dates', () => {
      const renderer = new DateRenderer({ format: 'YYYY-MM-DD' });
      const leapDate = new Date('2024-02-29');
      const newParams = { ...params, value: leapDate };
      renderer.render(element, newParams);

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('2024-02-29');
    });

    it('should handle year boundaries', () => {
      const renderer = new DateRenderer({ format: 'MM/DD/YYYY' });

      // Last day of year
      const endYear = new Date('2024-12-31');
      renderer.render(element, { ...params, value: endYear });
      expect(element.querySelector('.zg-datetime-display')?.textContent).toBe('12/31/2024');

      // First day of year
      const startYear = new Date('2024-01-01');
      renderer.update(element, { ...params, value: startYear });
      expect(element.querySelector('.zg-datetime-display')?.textContent).toBe('01/01/2024');
    });

    it('should handle very old dates', () => {
      const renderer = new DateRenderer({ format: 'YYYY-MM-DD' });
      const oldDate = new Date('1900-01-01');
      renderer.render(element, { ...params, value: oldDate });

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('1900-01-01');
    });

    it('should handle far future dates', () => {
      const renderer = new DateRenderer({ format: 'YYYY-MM-DD' });
      const futureDate = new Date('2100-12-31');
      renderer.render(element, { ...params, value: futureDate });

      const span = element.querySelector('.zg-datetime-display');
      expect(span?.textContent).toBe('2100-12-31');
    });

    it('should handle update without span', () => {
      renderer.render(element, params);
      element.innerHTML = ''; // Remove span

      expect(() => renderer.update(element, params)).not.toThrow();
    });
  });

  describe('Factory Function', () => {
    it('should create renderer via factory', () => {
      const renderer = createDateRenderer();
      expect(renderer).toBeInstanceOf(DateRenderer);
    });

    it('should create renderer with options via factory', () => {
      const renderer = createDateRenderer({ format: 'DD/MM/YYYY' });
      expect(renderer).toBeInstanceOf(DateRenderer);

      renderer.render(element, params);
      const textSpan = element.querySelector('.zg-datetime-display');
      expect(textSpan?.textContent).toBe('15/01/2024');
    });
  });
});
