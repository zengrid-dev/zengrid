/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProgressBarRenderer, createProgressBarRenderer } from '../progress-bar-renderer';
import type { RenderParams } from '../renderer.interface';
import type { ProgressColorThreshold } from '../progress-bar-renderer';

describe('ProgressBarRenderer', () => {
  let renderer: ProgressBarRenderer;
  let element: HTMLElement;
  let params: RenderParams;

  beforeEach(() => {
    renderer = new ProgressBarRenderer();
    element = document.createElement('div');
    params = {
      cell: { row: 0, col: 0 },
      position: { x: 0, y: 0, width: 150, height: 30 },
      value: 50,
      column: { field: 'progress', header: 'Progress' },
      rowData: { id: 1, progress: 50 },
      isSelected: false,
      isActive: false,
      isEditing: false,
    } as RenderParams;
  });

  describe('constructor', () => {
    it('should create renderer with default options', () => {
      const renderer = new ProgressBarRenderer();
      expect(renderer).toBeInstanceOf(ProgressBarRenderer);
    });

    it('should accept custom options', () => {
      const onClick = vi.fn();
      const renderer = new ProgressBarRenderer({
        min: 0,
        max: 200,
        color: '#ff0000',
        height: 30,
        showValue: false,
        animated: true,
        onClick,
      });
      expect(renderer).toBeInstanceOf(ProgressBarRenderer);
    });
  });

  describe('render()', () => {
    it('should create progress bar container', () => {
      renderer.render(element, params);

      const container = element.querySelector('.zg-progress-bar-container');
      expect(container).toBeTruthy();
    });

    it('should create progress bar wrapper', () => {
      renderer.render(element, params);

      const wrapper = element.querySelector('.zg-progress-bar-wrapper');
      expect(wrapper).toBeTruthy();
    });

    it('should create progress bar fill', () => {
      renderer.render(element, params);

      const fill = element.querySelector('.zg-progress-bar-fill');
      expect(fill).toBeTruthy();
    });

    it('should create value text when showValue is true', () => {
      renderer.render(element, params);

      const text = element.querySelector('.zg-progress-bar-text');
      expect(text).toBeTruthy();
      expect(text?.textContent).toBe('50%');
    });

    it('should not create value text when showValue is false', () => {
      renderer = new ProgressBarRenderer({ showValue: false });
      renderer.render(element, params);

      const text = element.querySelector('.zg-progress-bar-text');
      expect(text).toBeNull();
    });

    it('should set progress bar width based on value', () => {
      params.value = 75;
      renderer.render(element, params);

      const fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.style.width).toBe('75%');
    });

    it('should set data attributes', () => {
      params.value = 60;
      renderer.render(element, params);

      const fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.dataset.percentage).toBe('60.00');
      expect(fill.dataset.value).toBe('60');
      expect(fill.dataset.row).toBe('0');
      expect(fill.dataset.col).toBe('0');
      expect(fill.dataset.field).toBe('progress');
    });

    it('should set ARIA attributes', () => {
      params.value = 45;
      renderer.render(element, params);

      const container = element.querySelector('.zg-progress-bar-container');
      expect(container?.getAttribute('role')).toBe('progressbar');
      expect(container?.getAttribute('aria-valuenow')).toBe('45');
      expect(container?.getAttribute('aria-valuemin')).toBe('0');
      expect(container?.getAttribute('aria-valuemax')).toBe('100');
      expect(container?.getAttribute('aria-valuetext')).toBe('45% complete');
    });

    it('should attach click event listener when onClick is provided', () => {
      const onClick = vi.fn();
      renderer = new ProgressBarRenderer({ onClick });

      renderer.render(element, params);

      const container = element.querySelector('.zg-progress-bar-container') as HTMLElement;
      container.click();

      expect(onClick).toHaveBeenCalledWith(50, params);
    });

    it('should set cursor pointer when onClick is provided', () => {
      const onClick = vi.fn();
      renderer = new ProgressBarRenderer({ onClick });

      renderer.render(element, params);

      const container = element.querySelector('.zg-progress-bar-container') as HTMLElement;
      expect(container.style.cursor).toBe('pointer');
    });
  });

  describe('update()', () => {
    beforeEach(() => {
      renderer.render(element, params);
    });

    it('should update progress bar width when value changes', () => {
      const fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.style.width).toBe('50%');

      params.value = 80;
      renderer.update(element, params);

      expect(fill.style.width).toBe('80%');
    });

    it('should update value text when value changes', () => {
      const text = element.querySelector('.zg-progress-bar-text') as HTMLElement;
      expect(text.textContent).toBe('50%');

      params.value = 90;
      renderer.update(element, params);

      expect(text.textContent).toBe('90%');
    });

    it('should update data attributes', () => {
      params.value = 65;
      renderer.update(element, params);

      const fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.dataset.percentage).toBe('65.00');
      expect(fill.dataset.value).toBe('65');
    });

    it('should update ARIA attributes', () => {
      params.value = 33;
      renderer.update(element, params);

      const container = element.querySelector('.zg-progress-bar-container');
      expect(container?.getAttribute('aria-valuenow')).toBe('33');
      expect(container?.getAttribute('aria-valuetext')).toBe('33% complete');
    });

    it('should do nothing if container not found', () => {
      element.innerHTML = ''; // Remove container

      expect(() => {
        renderer.update(element, params);
      }).not.toThrow();
    });
  });

  describe('destroy()', () => {
    it('should remove event listeners', () => {
      const onClick = vi.fn();
      renderer = new ProgressBarRenderer({ onClick });

      renderer.render(element, params);
      renderer.destroy(element);

      const container = element.querySelector('.zg-progress-bar-container') as HTMLElement;
      if (container) {
        container.click();
        expect(onClick).not.toHaveBeenCalled();
      }
    });

    it('should clear element content', () => {
      renderer.render(element, params);
      renderer.destroy(element);

      expect(element.innerHTML).toBe('');
    });

    it('should handle destroy when no progress bar exists', () => {
      expect(() => {
        renderer.destroy(element);
      }).not.toThrow();
    });
  });

  describe('getCellClass()', () => {
    it('should return class for complete progress (100%)', () => {
      params.value = 100;
      const className = renderer.getCellClass(params);
      expect(className).toBe('zg-progress-complete');
    });

    it('should return class for high progress (>=75%)', () => {
      params.value = 85;
      const className = renderer.getCellClass(params);
      expect(className).toBe('zg-progress-high');
    });

    it('should return class for medium progress (>=50%)', () => {
      params.value = 60;
      const className = renderer.getCellClass(params);
      expect(className).toBe('zg-progress-medium');
    });

    it('should return class for low progress (>=25%)', () => {
      params.value = 40;
      const className = renderer.getCellClass(params);
      expect(className).toBe('zg-progress-low');
    });

    it('should return class for minimal progress (<25%)', () => {
      params.value = 10;
      const className = renderer.getCellClass(params);
      expect(className).toBe('zg-progress-minimal');
    });
  });

  describe('value parsing', () => {
    it('should handle numeric values', () => {
      params.value = 75;
      renderer.render(element, params);

      const fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.style.width).toBe('75%');
    });

    it('should handle string numeric values', () => {
      params.value = '65';
      renderer.render(element, params);

      const fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.style.width).toBe('65%');
    });

    it('should handle null value as min', () => {
      params.value = null;
      renderer.render(element, params);

      const fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.style.width).toBe('0%');
    });

    it('should handle undefined value as min', () => {
      params.value = undefined;
      renderer.render(element, params);

      const fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.style.width).toBe('0%');
    });

    it('should handle empty string as min', () => {
      params.value = '';
      renderer.render(element, params);

      const fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.style.width).toBe('0%');
    });

    it('should handle invalid string as min', () => {
      params.value = 'invalid';
      renderer.render(element, params);

      const fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.style.width).toBe('0%');
    });

    it('should clamp value above max to 100%', () => {
      params.value = 150;
      renderer.render(element, params);

      const fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.style.width).toBe('100%');
    });

    it('should clamp value below min to 0%', () => {
      params.value = -50;
      renderer.render(element, params);

      const fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.style.width).toBe('0%');
    });
  });

  describe('custom min/max', () => {
    it('should calculate percentage with custom min/max', () => {
      renderer = new ProgressBarRenderer({ min: 0, max: 200 });
      params.value = 100;
      renderer.render(element, params);

      const fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.style.width).toBe('50%');
    });

    it('should handle custom min value', () => {
      renderer = new ProgressBarRenderer({ min: 50, max: 150 });
      params.value = 100;
      renderer.render(element, params);

      const fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.style.width).toBe('50%');
    });

    it('should return 0% when min equals max', () => {
      renderer = new ProgressBarRenderer({ min: 100, max: 100 });
      params.value = 100;
      renderer.render(element, params);

      const fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.style.width).toBe('0%');
    });
  });

  describe('custom colors', () => {
    it('should use single color when specified', () => {
      renderer = new ProgressBarRenderer({ color: '#ff0000' });
      params.value = 50;
      renderer.render(element, params);

      const fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.style.backgroundColor).toBe('rgb(255, 0, 0)');
    });

    it('should use color thresholds when specified', () => {
      const colorThresholds: ProgressColorThreshold[] = [
        { value: 0, color: '#dc3545' },
        { value: 30, color: '#ffc107' },
        { value: 70, color: '#28a745' },
      ];
      renderer = new ProgressBarRenderer({ colorThresholds });

      // Test low value (red)
      params.value = 20;
      renderer.render(element, params);
      let fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.style.backgroundColor).toBe('rgb(220, 53, 69)');

      // Test medium value (yellow)
      params.value = 50;
      renderer.update(element, params);
      fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.style.backgroundColor).toBe('rgb(255, 193, 7)');

      // Test high value (green)
      params.value = 85;
      renderer.update(element, params);
      fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.style.backgroundColor).toBe('rgb(40, 167, 69)');
    });

    it('should use default color when no color options specified', () => {
      params.value = 50;
      renderer.render(element, params);

      const fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.style.backgroundColor).toBe('rgb(0, 123, 255)');
    });
  });

  describe('value formatting', () => {
    it('should use default formatter (percentage)', () => {
      params.value = 66;
      renderer.render(element, params);

      const text = element.querySelector('.zg-progress-bar-text') as HTMLElement;
      expect(text.textContent).toBe('66%');
    });

    it('should use custom valueFormatter', () => {
      const valueFormatter = (value: number, percentage: number) => {
        return `${value} / 100 (${percentage.toFixed(1)}%)`;
      };
      renderer = new ProgressBarRenderer({ valueFormatter });

      params.value = 75;
      renderer.render(element, params);

      const text = element.querySelector('.zg-progress-bar-text') as HTMLElement;
      expect(text.textContent).toBe('75 / 100 (75.0%)');
    });

    it('should update formatted text on value change', () => {
      const valueFormatter = (value: number) => `${value} items`;
      renderer = new ProgressBarRenderer({ valueFormatter });

      params.value = 30;
      renderer.render(element, params);

      let text = element.querySelector('.zg-progress-bar-text') as HTMLElement;
      expect(text.textContent).toBe('30 items');

      params.value = 80;
      renderer.update(element, params);

      text = element.querySelector('.zg-progress-bar-text') as HTMLElement;
      expect(text.textContent).toBe('80 items');
    });
  });

  describe('animation support', () => {
    it('should add transition CSS when animated is true', () => {
      renderer = new ProgressBarRenderer({ animated: true });
      renderer.render(element, params);

      const fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.style.transition).toContain('width');
      expect(fill.style.transition).toContain('background-color');
    });

    it('should not add transition CSS when animated is false', () => {
      renderer = new ProgressBarRenderer({ animated: false });
      renderer.render(element, params);

      const fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.style.transition).toBe('');
    });
  });

  describe('styling options', () => {
    it('should use custom height', () => {
      renderer = new ProgressBarRenderer({ height: 30 });
      renderer.render(element, params);

      const wrapper = element.querySelector('.zg-progress-bar-wrapper') as HTMLElement;
      expect(wrapper.style.height).toBe('30px');
    });

    it('should use custom backgroundColor', () => {
      renderer = new ProgressBarRenderer({ backgroundColor: '#f0f0f0' });
      renderer.render(element, params);

      const wrapper = element.querySelector('.zg-progress-bar-wrapper') as HTMLElement;
      expect(wrapper.style.backgroundColor).toBe('rgb(240, 240, 240)');
    });

    it('should use custom borderRadius', () => {
      renderer = new ProgressBarRenderer({ borderRadius: 8 });
      renderer.render(element, params);

      const wrapper = element.querySelector('.zg-progress-bar-wrapper') as HTMLElement;
      expect(wrapper.style.borderRadius).toBe('8px');
    });

    it('should use custom className', () => {
      renderer = new ProgressBarRenderer({ className: 'custom-progress' });
      renderer.render(element, params);

      const container = element.querySelector('.custom-progress-container');
      expect(container).toBeTruthy();
    });
  });

  describe('onClick callback', () => {
    it('should call onClick with value and params', () => {
      const onClick = vi.fn();
      renderer = new ProgressBarRenderer({ onClick });

      params.value = 75;
      renderer.render(element, params);

      const container = element.querySelector('.zg-progress-bar-container') as HTMLElement;
      container.click();

      expect(onClick).toHaveBeenCalledWith(75, params);
    });

    it('should stop event propagation', () => {
      const onClick = vi.fn();
      const elementClickHandler = vi.fn();
      element.addEventListener('click', elementClickHandler);

      renderer = new ProgressBarRenderer({ onClick });
      renderer.render(element, params);

      const container = element.querySelector('.zg-progress-bar-container') as HTMLElement;
      container.click();

      expect(onClick).toHaveBeenCalled();
      expect(elementClickHandler).not.toHaveBeenCalled();
    });
  });

  describe('createProgressBarRenderer factory', () => {
    it('should create renderer instance', () => {
      const renderer = createProgressBarRenderer();
      expect(renderer).toBeInstanceOf(ProgressBarRenderer);
    });

    it('should pass options to constructor', () => {
      const renderer = createProgressBarRenderer({
        color: '#ff0000',
        height: 25,
      });

      params.value = 50;
      renderer.render(element, params);

      const wrapper = element.querySelector('.zg-progress-bar-wrapper') as HTMLElement;
      expect(wrapper.style.height).toBe('25px');
    });
  });

  describe('render/update lifecycle', () => {
    it('should support render -> update -> destroy cycle', () => {
      // Initial render
      params.value = 30;
      renderer.render(element, params);

      let fill = element.querySelector('.zg-progress-bar-fill') as HTMLElement;
      expect(fill.style.width).toBe('30%');

      // Update 1
      params.value = 60;
      renderer.update(element, params);
      expect(fill.style.width).toBe('60%');

      // Update 2
      params.value = 90;
      renderer.update(element, params);
      expect(fill.style.width).toBe('90%');

      // Destroy
      renderer.destroy(element);
      expect(element.innerHTML).toBe('');
    });

    it('should handle multiple render calls on same element', () => {
      renderer.render(element, params);

      // Second render should replace content
      params.value = 80;
      renderer.render(element, params);

      const fills = element.querySelectorAll('.zg-progress-bar-fill');
      expect(fills.length).toBe(1);

      const fill = fills[0] as HTMLElement;
      expect(fill.style.width).toBe('80%');
    });
  });

  describe('accessibility', () => {
    it('should set appropriate ARIA role', () => {
      renderer.render(element, params);

      const container = element.querySelector('.zg-progress-bar-container');
      expect(container?.getAttribute('role')).toBe('progressbar');
    });

    it('should provide ARIA value attributes', () => {
      params.value = 42;
      renderer.render(element, params);

      const container = element.querySelector('.zg-progress-bar-container');
      expect(container?.getAttribute('aria-valuenow')).toBe('42');
      expect(container?.getAttribute('aria-valuemin')).toBe('0');
      expect(container?.getAttribute('aria-valuemax')).toBe('100');
    });

    it('should provide descriptive aria-valuetext', () => {
      params.value = 55;
      renderer.render(element, params);

      const container = element.querySelector('.zg-progress-bar-container');
      const valueText = container?.getAttribute('aria-valuetext');
      expect(valueText).toBe('55% complete');
    });

    it('should update ARIA attributes on value change', () => {
      params.value = 20;
      renderer.render(element, params);

      const container = element.querySelector('.zg-progress-bar-container');
      expect(container?.getAttribute('aria-valuenow')).toBe('20');

      params.value = 70;
      renderer.update(element, params);
      expect(container?.getAttribute('aria-valuenow')).toBe('70');
      expect(container?.getAttribute('aria-valuetext')).toBe('70% complete');
    });
  });
});
