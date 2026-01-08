/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DateRenderer, createDateRenderer, type DateRendererOptions } from '../date-renderer';
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

    it('should create renderer with custom locale', () => {
      const renderer = new DateRenderer({ locale: 'de-DE' });
      expect(renderer).toBeInstanceOf(DateRenderer);
    });

    it('should create renderer with min/max dates', () => {
      const renderer = new DateRenderer({
        minDate: new Date('2020-01-01'),
        maxDate: new Date('2025-12-31'),
      });
      expect(renderer).toBeInstanceOf(DateRenderer);
    });

    it('should create renderer with calendar icon', () => {
      const renderer = new DateRenderer({ showCalendar: true });
      expect(renderer).toBeInstanceOf(DateRenderer);
    });

    it('should create renderer with custom className', () => {
      const renderer = new DateRenderer({ className: 'custom-date' });
      expect(renderer).toBeInstanceOf(DateRenderer);
    });

    it('should create renderer with custom text options', () => {
      const renderer = new DateRenderer({
        invalidDateText: 'Bad Date',
        emptyDateText: 'No Date',
      });
      expect(renderer).toBeInstanceOf(DateRenderer);
    });

    it('should create renderer with timeZone', () => {
      const renderer = new DateRenderer({ timeZone: 'America/New_York' });
      expect(renderer).toBeInstanceOf(DateRenderer);
    });

    it('should create renderer with onClick callback', () => {
      const onClick = vi.fn();
      const renderer = new DateRenderer({ onClick });
      expect(renderer).toBeInstanceOf(DateRenderer);
    });
  });

  describe('render()', () => {
    it('should create date container structure', () => {
      renderer.render(element, params);

      const container = element.querySelector('.zg-date-wrapper');
      expect(container).toBeTruthy();
    });

    it('should add zg-cell-date class to element', () => {
      renderer.render(element, params);
      expect(element.classList.contains('zg-cell-date')).toBe(true);
    });

    it('should create date text span', () => {
      renderer.render(element, params);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan).toBeTruthy();
    });

    it('should format date value', () => {
      renderer.render(element, params);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('01/15/2024');
    });

    it('should apply custom className', () => {
      const renderer = new DateRenderer({ className: 'custom-date' });
      renderer.render(element, params);

      const container = element.querySelector('.zg-date-wrapper');
      expect(container?.classList.contains('custom-date')).toBe(true);
    });

    it('should not show calendar icon by default', () => {
      renderer.render(element, params);

      const icon = element.querySelector('.zg-date-calendar-icon');
      expect(icon).toBeNull();
    });

    it('should show calendar icon when enabled', () => {
      const renderer = new DateRenderer({ showCalendar: true });
      renderer.render(element, params);

      const icon = element.querySelector('.zg-date-calendar-icon');
      expect(icon).toBeTruthy();
      expect(icon?.textContent).toBe('📅');
    });

    it('should set calendar icon aria-hidden', () => {
      const renderer = new DateRenderer({ showCalendar: true });
      renderer.render(element, params);

      const icon = element.querySelector('.zg-date-calendar-icon');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should add click handler when onClick provided', () => {
      const onClick = vi.fn();
      const renderer = new DateRenderer({ onClick });
      renderer.render(element, params);

      const container = element.querySelector('.zg-date-wrapper') as HTMLElement;
      container.click();

      expect(onClick).toHaveBeenCalledWith(params.value, params);
    });

    it('should set cursor pointer when onClick provided', () => {
      const onClick = vi.fn();
      const renderer = new DateRenderer({ onClick });
      renderer.render(element, params);

      const container = element.querySelector('.zg-date-wrapper') as HTMLElement;
      expect(container.style.cursor).toBe('pointer');
    });

    it('should not set cursor pointer when no onClick', () => {
      renderer.render(element, params);

      const container = element.querySelector('.zg-date-wrapper') as HTMLElement;
      expect(container.style.cursor).toBe('');
    });
  });

  describe('update()', () => {
    beforeEach(() => {
      renderer.render(element, params);
    });

    it('should update date text when value changes', () => {
      const newParams = { ...params, value: new Date('2024-06-30') };
      renderer.update(element, newParams);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('06/30/2024');
    });

    it('should update from null to date', () => {
      const nullParams = { ...params, value: null };
      renderer.update(element, nullParams);

      let textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('');

      const newParams = { ...params, value: new Date('2024-03-20') };
      renderer.update(element, newParams);

      textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('03/20/2024');
    });

    it('should update from date to null', () => {
      renderer.update(element, params);

      const nullParams = { ...params, value: null };
      renderer.update(element, nullParams);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('');
    });

    it('should update data attributes', () => {
      const newParams = {
        ...params,
        cell: { row: 5, col: 3 },
        column: { field: 'updatedAt', header: 'Updated' },
      };
      renderer.update(element, newParams);

      const container = element.querySelector('.zg-date-wrapper') as HTMLElement;
      expect(container.dataset.row).toBe('5');
      expect(container.dataset.col).toBe('3');
      expect(container.dataset.field).toBe('updatedAt');
    });

    it('should update ISO date data attribute', () => {
      const date = new Date('2024-07-15T10:30:00Z');
      const newParams = { ...params, value: date };
      renderer.update(element, newParams);

      const container = element.querySelector('.zg-date-wrapper') as HTMLElement;
      expect(container.dataset.date).toBe(date.toISOString());
    });

    it('should remove date data attribute when null', () => {
      renderer.update(element, params);

      const nullParams = { ...params, value: null };
      renderer.update(element, nullParams);

      const container = element.querySelector('.zg-date-wrapper') as HTMLElement;
      expect(container.dataset.date).toBeUndefined();
    });

    it('should add out-of-range class for dates before minDate', () => {
      const renderer = new DateRenderer({ minDate: new Date('2024-06-01') });
      renderer.render(element, params);

      const earlyParams = { ...params, value: new Date('2024-01-15') };
      renderer.update(element, earlyParams);

      const container = element.querySelector('.zg-date-wrapper');
      expect(container?.classList.contains('zg-date-out-of-range')).toBe(true);
    });

    it('should add out-of-range class for dates after maxDate', () => {
      const renderer = new DateRenderer({ maxDate: new Date('2024-06-01') });
      renderer.render(element, params);

      const lateParams = { ...params, value: new Date('2024-12-31') };
      renderer.update(element, lateParams);

      const container = element.querySelector('.zg-date-wrapper');
      expect(container?.classList.contains('zg-date-out-of-range')).toBe(true);
    });

    it('should remove out-of-range class for valid dates', () => {
      const renderer = new DateRenderer({
        minDate: new Date('2024-01-01'),
        maxDate: new Date('2024-12-31'),
      });
      renderer.render(element, params);

      const validParams = { ...params, value: new Date('2024-06-15') };
      renderer.update(element, validParams);

      const container = element.querySelector('.zg-date-wrapper');
      expect(container?.classList.contains('zg-date-out-of-range')).toBe(false);
    });

    it('should set aria-invalid for out-of-range dates', () => {
      const renderer = new DateRenderer({ maxDate: new Date('2020-01-01') });
      renderer.render(element, params);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.getAttribute('aria-invalid')).toBe('true');
    });

    it('should remove aria-invalid for valid dates', () => {
      const renderer = new DateRenderer({
        minDate: new Date('2020-01-01'),
        maxDate: new Date('2025-12-31'),
      });
      renderer.render(element, params);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('destroy()', () => {
    it('should remove date content', () => {
      renderer.render(element, params);
      renderer.destroy(element);

      expect(element.innerHTML).toBe('');
    });

    it('should remove zg-cell-date class', () => {
      renderer.render(element, params);
      renderer.destroy(element);

      expect(element.classList.contains('zg-cell-date')).toBe(false);
    });

    it('should remove click event listener', () => {
      const onClick = vi.fn();
      const renderer = new DateRenderer({ onClick });
      renderer.render(element, params);

      renderer.destroy(element);

      const container = element.querySelector('.zg-date-wrapper') as HTMLElement;
      if (container) {
        container.click();
        expect(onClick).not.toHaveBeenCalled();
      }
    });

    it('should handle destroy without onClick handler', () => {
      renderer.render(element, params);
      expect(() => renderer.destroy(element)).not.toThrow();
    });
  });

  describe('getCellClass()', () => {
    it('should return zg-date-empty for null date', () => {
      const nullParams = { ...params, value: null };
      const className = renderer.getCellClass(nullParams);

      expect(className).toBe('zg-date-empty');
    });

    it('should return zg-date-empty for undefined date', () => {
      const undefinedParams = { ...params, value: undefined };
      const className = renderer.getCellClass(undefinedParams);

      expect(className).toBe('zg-date-empty');
    });

    it('should return zg-date-invalid for out-of-range date', () => {
      const renderer = new DateRenderer({
        minDate: new Date('2025-01-01'),
        maxDate: new Date('2025-12-31'),
      });

      const className = renderer.getCellClass(params);
      expect(className).toBe('zg-date-invalid');
    });

    it('should return undefined for valid date', () => {
      const renderer = new DateRenderer({
        minDate: new Date('2020-01-01'),
        maxDate: new Date('2025-12-31'),
      });

      const className = renderer.getCellClass(params);
      expect(className).toBeUndefined();
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

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('03/15/2024');
    });

    it('should parse ISO string', () => {
      const newParams = { ...params, value: '2024-08-20' };
      renderer.update(element, newParams);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('08/20/2024');
    });

    it('should parse timestamp number', () => {
      const timestamp = new Date('2024-12-25').getTime();
      const newParams = { ...params, value: timestamp };
      renderer.update(element, newParams);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('12/25/2024');
    });

    it('should handle null value', () => {
      const newParams = { ...params, value: null };
      renderer.update(element, newParams);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('');
    });

    it('should handle undefined value', () => {
      const newParams = { ...params, value: undefined };
      renderer.update(element, newParams);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('');
    });

    it('should handle invalid date string', () => {
      const newParams = { ...params, value: 'not-a-date' };
      renderer.update(element, newParams);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('');
    });

    it('should handle invalid Date object', () => {
      const newParams = { ...params, value: new Date('invalid') };
      renderer.update(element, newParams);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('');
    });

    it('should use custom emptyDateText for null', () => {
      const renderer = new DateRenderer({ emptyDateText: 'N/A' });
      renderer.render(element, params);

      const newParams = { ...params, value: null };
      renderer.update(element, newParams);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('N/A');
    });
  });

  describe('Date Formatting', () => {
    it('should format MM/DD/YYYY (default)', () => {
      const renderer = new DateRenderer({ format: 'MM/DD/YYYY' });
      renderer.render(element, params);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('01/15/2024');
    });

    it('should format DD/MM/YYYY', () => {
      const renderer = new DateRenderer({ format: 'DD/MM/YYYY' });
      renderer.render(element, params);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('15/01/2024');
    });

    it('should format YYYY-MM-DD', () => {
      const renderer = new DateRenderer({ format: 'YYYY-MM-DD' });
      renderer.render(element, params);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('2024-01-15');
    });

    it('should format DD-MM-YYYY', () => {
      const renderer = new DateRenderer({ format: 'DD-MM-YYYY' });
      renderer.render(element, params);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('15-01-2024');
    });

    it('should format MM-DD-YYYY', () => {
      const renderer = new DateRenderer({ format: 'MM-DD-YYYY' });
      renderer.render(element, params);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('01-15-2024');
    });

    it('should format YYYY/MM/DD', () => {
      const renderer = new DateRenderer({ format: 'YYYY/MM/DD' });
      renderer.render(element, params);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('2024/01/15');
    });

    it('should format with locale (en-US)', () => {
      const renderer = new DateRenderer({ format: 'locale', locale: 'en-US' });
      renderer.render(element, params);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toMatch(/01\/15\/2024/);
    });

    it('should format with locale (de-DE)', () => {
      const renderer = new DateRenderer({ format: 'locale', locale: 'de-DE' });
      renderer.render(element, params);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toMatch(/15\.01\.2024/);
    });

    it('should format with locale (en-GB)', () => {
      const renderer = new DateRenderer({ format: 'locale', locale: 'en-GB' });
      renderer.render(element, params);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toMatch(/15\/01\/2024/);
    });

    it('should pad single-digit months and days', () => {
      const renderer = new DateRenderer({ format: 'YYYY-MM-DD' });
      const newParams = { ...params, value: new Date('2024-03-05') };
      renderer.render(element, newParams);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('2024-03-05');
    });
  });

  describe('LRU Caching', () => {
    it('should cache formatted date strings', () => {
      const renderer = new DateRenderer({ format: 'MM/DD/YYYY' });
      const date = new Date('2024-01-15');

      // Render multiple times with same date
      renderer.render(element, { ...params, value: date });
      const firstText = element.querySelector('.zg-date-text')?.textContent;

      element.innerHTML = '';
      renderer.render(element, { ...params, value: date });
      const secondText = element.querySelector('.zg-date-text')?.textContent;

      expect(firstText).toBe(secondText);
      expect(firstText).toBe('01/15/2024');
    });

    it('should cache Intl.DateTimeFormat instances', () => {
      const renderer = new DateRenderer({ format: 'locale', locale: 'en-US' });
      const date = new Date('2024-01-15');

      // Render multiple times with same locale
      renderer.render(element, { ...params, value: date });
      const firstText = element.querySelector('.zg-date-text')?.textContent;

      element.innerHTML = '';
      renderer.render(element, { ...params, value: date });
      const secondText = element.querySelector('.zg-date-text')?.textContent;

      expect(firstText).toBe(secondText);
    });

    it('should handle different dates with caching', () => {
      const renderer = new DateRenderer({ format: 'MM/DD/YYYY' });

      const date1 = new Date('2024-01-15');
      renderer.render(element, { ...params, value: date1 });
      const text1 = element.querySelector('.zg-date-text')?.textContent;

      const date2 = new Date('2024-06-30');
      renderer.update(element, { ...params, value: date2 });
      const text2 = element.querySelector('.zg-date-text')?.textContent;

      expect(text1).toBe('01/15/2024');
      expect(text2).toBe('06/30/2024');
    });
  });

  describe('Date Range Validation', () => {
    it('should accept date within range', () => {
      const renderer = new DateRenderer({
        minDate: new Date('2024-01-01'),
        maxDate: new Date('2024-12-31'),
      });
      renderer.render(element, params);

      const container = element.querySelector('.zg-date-wrapper');
      expect(container?.classList.contains('zg-date-out-of-range')).toBe(false);
    });

    it('should reject date before minDate', () => {
      const renderer = new DateRenderer({
        minDate: new Date('2024-06-01'),
        maxDate: new Date('2024-12-31'),
      });
      renderer.render(element, params);

      const container = element.querySelector('.zg-date-wrapper');
      expect(container?.classList.contains('zg-date-out-of-range')).toBe(true);
    });

    it('should reject date after maxDate', () => {
      const renderer = new DateRenderer({
        minDate: new Date('2020-01-01'),
        maxDate: new Date('2023-12-31'),
      });
      renderer.render(element, params);

      const container = element.querySelector('.zg-date-wrapper');
      expect(container?.classList.contains('zg-date-out-of-range')).toBe(true);
    });

    it('should accept date equal to minDate', () => {
      const renderer = new DateRenderer({
        minDate: new Date('2024-01-15'),
        maxDate: new Date('2024-12-31'),
      });
      renderer.render(element, params);

      const container = element.querySelector('.zg-date-wrapper');
      expect(container?.classList.contains('zg-date-out-of-range')).toBe(false);
    });

    it('should accept date equal to maxDate', () => {
      const renderer = new DateRenderer({
        minDate: new Date('2020-01-01'),
        maxDate: new Date('2024-01-15'),
      });
      renderer.render(element, params);

      const container = element.querySelector('.zg-date-wrapper');
      expect(container?.classList.contains('zg-date-out-of-range')).toBe(false);
    });
  });

  describe('ARIA Attributes', () => {
    it('should set role="text" on date text', () => {
      renderer.render(element, params);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.getAttribute('role')).toBe('text');
    });

    it('should set aria-label with formatted date', () => {
      renderer.render(element, params);

      const textSpan = element.querySelector('.zg-date-text');
      const ariaLabel = textSpan?.getAttribute('aria-label');

      expect(ariaLabel).toContain('Created Date');
      expect(ariaLabel).toContain('January');
      expect(ariaLabel).toContain('15');
      expect(ariaLabel).toContain('2024');
    });

    it('should set aria-label for empty date', () => {
      const nullParams = { ...params, value: null };
      renderer.render(element, nullParams);

      const textSpan = element.querySelector('.zg-date-text');
      const ariaLabel = textSpan?.getAttribute('aria-label');

      expect(ariaLabel).toBe('Created Date: Empty date');
    });

    it('should use field name when no header', () => {
      const noHeaderParams = {
        ...params,
        column: { field: 'createdAt' },
      };
      renderer.render(element, noHeaderParams);

      const textSpan = element.querySelector('.zg-date-text');
      const ariaLabel = textSpan?.getAttribute('aria-label');

      expect(ariaLabel).toContain('createdAt');
    });

    it('should handle missing column', () => {
      const noColumnParams = { ...params, column: undefined };
      renderer.render(element, noColumnParams);

      const textSpan = element.querySelector('.zg-date-text');
      const ariaLabel = textSpan?.getAttribute('aria-label');

      expect(ariaLabel).toContain('Date');
    });
  });

  describe('onClick Callback', () => {
    it('should call onClick with date and params', () => {
      const onClick = vi.fn();
      const renderer = new DateRenderer({ onClick });
      renderer.render(element, params);

      const container = element.querySelector('.zg-date-wrapper') as HTMLElement;
      container.click();

      expect(onClick).toHaveBeenCalledWith(params.value, params);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick with null for empty date', () => {
      const onClick = vi.fn();
      const renderer = new DateRenderer({ onClick });
      const nullParams = { ...params, value: null };
      renderer.render(element, nullParams);

      const container = element.querySelector('.zg-date-wrapper') as HTMLElement;
      container.click();

      expect(onClick).toHaveBeenCalledWith(null, nullParams);
    });

    it('should stop event propagation on click', () => {
      const onClick = vi.fn();
      const renderer = new DateRenderer({ onClick });
      renderer.render(element, params);

      const outerClick = vi.fn();
      element.addEventListener('click', outerClick);

      const container = element.querySelector('.zg-date-wrapper') as HTMLElement;
      container.click();

      expect(onClick).toHaveBeenCalled();
      expect(outerClick).not.toHaveBeenCalled();
    });
  });

  describe('Lifecycle', () => {
    it('should support full render -> update -> destroy cycle', () => {
      // Render
      renderer.render(element, params);
      expect(element.querySelector('.zg-date-wrapper')).toBeTruthy();

      // Update
      const newParams = { ...params, value: new Date('2024-06-30') };
      renderer.update(element, newParams);
      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('06/30/2024');

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

        const textSpan = element.querySelector('.zg-date-text');
        expect(textSpan?.textContent).toBe(`0${i}/15/2024`);
      }
    });

    it('should handle re-render after destroy', () => {
      renderer.render(element, params);
      renderer.destroy(element);
      renderer.render(element, params);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('01/15/2024');
    });
  });

  describe('Edge Cases', () => {
    it('should handle leap year dates', () => {
      const renderer = new DateRenderer({ format: 'YYYY-MM-DD' });
      const leapDate = new Date('2024-02-29');
      const newParams = { ...params, value: leapDate };
      renderer.render(element, newParams);

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('2024-02-29');
    });

    it('should handle year boundaries', () => {
      const renderer = new DateRenderer({ format: 'MM/DD/YYYY' });

      // Last day of year
      const endYear = new Date('2024-12-31');
      renderer.render(element, { ...params, value: endYear });
      expect(element.querySelector('.zg-date-text')?.textContent).toBe('12/31/2024');

      // First day of year
      const startYear = new Date('2024-01-01');
      renderer.update(element, { ...params, value: startYear });
      expect(element.querySelector('.zg-date-text')?.textContent).toBe('01/01/2024');
    });

    it('should handle very old dates', () => {
      const renderer = new DateRenderer({ format: 'YYYY-MM-DD' });
      const oldDate = new Date('1900-01-01');
      renderer.render(element, { ...params, value: oldDate });

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('1900-01-01');
    });

    it('should handle far future dates', () => {
      const renderer = new DateRenderer({ format: 'YYYY-MM-DD' });
      const futureDate = new Date('2100-12-31');
      renderer.render(element, { ...params, value: futureDate });

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('2100-12-31');
    });

    it('should handle timezone parameter', () => {
      const renderer = new DateRenderer({
        format: 'locale',
        locale: 'en-US',
        timeZone: 'America/New_York',
      });
      const date = new Date('2024-01-15T12:00:00Z');
      renderer.render(element, { ...params, value: date });

      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBeTruthy();
    });

    it('should handle update without container', () => {
      renderer.render(element, params);
      element.innerHTML = ''; // Remove container

      expect(() => renderer.update(element, params)).not.toThrow();
    });

    it('should handle destroy without event handler', () => {
      renderer.render(element, params);
      expect(() => renderer.destroy(element)).not.toThrow();
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
      const textSpan = element.querySelector('.zg-date-text');
      expect(textSpan?.textContent).toBe('15/01/2024');
    });
  });
});
