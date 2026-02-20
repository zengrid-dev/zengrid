/**
 * @jest-environment jsdom
 */

import {
  ChipRenderer,
  createChipRenderer,
  type Chip,
} from '../chip';
import type { RenderParams } from '../renderer.interface';

describe('ChipRenderer', () => {
  let renderer: ChipRenderer;
  let element: HTMLElement;
  let params: RenderParams;

  const defaultChips: Chip[] = [
    { label: 'Active', value: 'active', color: '#4caf50', textColor: '#fff' },
    { label: 'Premium', value: 'premium', color: '#ffc107', textColor: '#000' },
    { label: 'Verified', value: 'verified', color: '#2196f3', textColor: '#fff' },
  ];

  beforeEach(() => {
    renderer = new ChipRenderer({ chips: defaultChips });
    element = document.createElement('div');
    params = {
      cell: { row: 0, col: 0 },
      position: { x: 0, y: 0, width: 200, height: 40 },
      value: defaultChips,
      column: { field: 'tags', header: 'Tags' },
      rowData: { id: 1, tags: defaultChips },
      isSelected: false,
      isActive: false,
      isEditing: false,
    } as RenderParams;
  });

  describe('Constructor', () => {
    it('should create instance with default options', () => {
      const renderer = new ChipRenderer();
      expect(renderer).toBeInstanceOf(ChipRenderer);
    });

    it('should apply default color options', () => {
      const renderer = new ChipRenderer({});
      renderer.render(element, params);

      const chip = element.querySelector('.zg-chip') as HTMLElement;
      expect(chip).toBeTruthy();
    });

    it('should accept static chips array', () => {
      const staticChips: Chip[] = [
        { label: 'Chip 1', value: '1' },
        { label: 'Chip 2', value: '2' },
      ];
      const renderer = new ChipRenderer({ chips: staticChips });
      const staticParams = { ...params, value: 'non-array-value' };
      renderer.render(element, staticParams);

      const chips = element.querySelectorAll('.zg-chip:not(.zg-chip--overflow)');
      expect(chips.length).toBe(2);
    });

    it('should accept chips function', () => {
      const renderer = new ChipRenderer({
        chips: (params) => params.value || [],
      });
      renderer.render(element, params);

      const chips = element.querySelectorAll('.zg-chip:not(.zg-chip--overflow)');
      expect(chips.length).toBe(3);
    });

    it('should set custom default colors', () => {
      const renderer = new ChipRenderer({
        chips: [{ label: 'Test', value: 'test' }],
        defaultColor: '#ff0000',
        defaultTextColor: '#ffffff',
      });
      const params2 = { ...params, value: [{ label: 'Test', value: 'test' }] };
      renderer.render(element, params2);

      const chip = element.querySelector('.zg-chip') as HTMLElement;
      expect(chip.style.backgroundColor).toBe('rgb(255, 0, 0)'); // #ff0000
    });

    it('should set size option', () => {
      const renderer = new ChipRenderer({
        chips: defaultChips,
        size: 'large',
      });
      renderer.render(element, params);

      const container = element.querySelector('.zg-chip-container');
      expect(container?.classList.contains('zg-chip-container--large')).toBe(true);
    });

    it('should set removable option', () => {
      const renderer = new ChipRenderer({
        chips: defaultChips,
        removable: true,
        onRemove: jest.fn(),
      });
      renderer.render(element, params);

      const removeButtons = element.querySelectorAll('.zg-chip__remove');
      expect(removeButtons.length).toBe(3);
    });

    it('should set maxChips option', () => {
      const renderer = new ChipRenderer({
        chips: defaultChips,
        maxChips: 2,
        overflowMode: 'collapse',
      });
      renderer.render(element, params);

      const chips = element.querySelectorAll('.zg-chip:not(.zg-chip--overflow)');
      expect(chips.length).toBe(2);

      const overflow = element.querySelector('.zg-chip--overflow');
      expect(overflow?.textContent).toBe('+1 more');
    });

    it('should accept onClick handler', () => {
      const onClick = jest.fn();
      const renderer = new ChipRenderer({
        chips: defaultChips,
        onClick,
      });
      renderer.render(element, params);

      const chip = element.querySelector('.zg-chip') as HTMLElement;
      expect(chip.getAttribute('role')).toBe('button');
      expect(chip.style.cursor).toBe('pointer');
    });
  });

  describe('render()', () => {
    it('should add cell class', () => {
      renderer.render(element, params);
      expect(element.classList.contains('zg-cell-chip')).toBe(true);
    });

    it('should create chip container', () => {
      renderer.render(element, params);

      const container = element.querySelector('.zg-chip-container');
      expect(container).toBeTruthy();
      expect(container?.getAttribute('role')).toBe('list');
      expect(container?.getAttribute('aria-label')).toBe('Chip list');
    });

    it('should render all chips', () => {
      renderer.render(element, params);

      const chips = element.querySelectorAll('.zg-chip:not(.zg-chip--overflow)');
      expect(chips.length).toBe(3);
    });

    it('should render chip labels', () => {
      renderer.render(element, params);

      const labels = Array.from(element.querySelectorAll('.zg-chip__label')).map(
        (el) => el.textContent
      );
      expect(labels).toEqual(['Active', 'Premium', 'Verified']);
    });

    it('should apply chip colors', () => {
      renderer.render(element, params);

      const chips = element.querySelectorAll('.zg-chip:not(.zg-chip--overflow)');
      expect((chips[0] as HTMLElement).style.backgroundColor).toBe('rgb(76, 175, 80)'); // #4caf50
      expect((chips[1] as HTMLElement).style.backgroundColor).toBe('rgb(255, 193, 7)'); // #ffc107
      expect((chips[2] as HTMLElement).style.backgroundColor).toBe('rgb(33, 150, 243)'); // #2196f3
    });

    it('should apply chip text colors', () => {
      renderer.render(element, params);

      const chips = element.querySelectorAll('.zg-chip:not(.zg-chip--overflow)');
      expect((chips[0] as HTMLElement).style.color).toBe('rgb(255, 255, 255)'); // #fff
      expect((chips[1] as HTMLElement).style.color).toBe('rgb(0, 0, 0)'); // #000
      expect((chips[2] as HTMLElement).style.color).toBe('rgb(255, 255, 255)'); // #fff
    });

    it('should set ARIA attributes on chips', () => {
      renderer.render(element, params);

      const chips = element.querySelectorAll('.zg-chip:not(.zg-chip--overflow)');
      chips.forEach((chip) => {
        expect(chip.getAttribute('role')).toBe('listitem');
      });
    });

    it('should set data attributes', () => {
      renderer.render(element, params);

      const chips = element.querySelectorAll('.zg-chip:not(.zg-chip--overflow)');
      expect(chips[0].getAttribute('data-chip-index')).toBe('0');
      expect(chips[0].getAttribute('data-chip-value')).toBe('active');
      expect(chips[1].getAttribute('data-chip-index')).toBe('1');
      expect(chips[1].getAttribute('data-chip-value')).toBe('premium');
    });

    it('should handle empty chips array', () => {
      const renderer2 = new ChipRenderer({
        chips: (params) => params.value || [],
      });
      const params2 = { ...params, value: [] };
      renderer2.render(element, params2);

      const container = element.querySelector('.zg-chip-container');
      expect(container?.children.length).toBe(0);
    });

    it('should handle null value', () => {
      const renderer2 = new ChipRenderer({
        chips: (params) => params.value || [],
      });
      const params2 = { ...params, value: null };
      renderer2.render(element, params2);

      const container = element.querySelector('.zg-chip-container');
      expect(container?.children.length).toBe(0);
    });

    it('should apply custom container class', () => {
      const renderer = new ChipRenderer({
        chips: defaultChips,
        containerClassName: 'custom-container',
      });
      renderer.render(element, params);

      const container = element.querySelector('.zg-chip-container');
      expect(container?.classList.contains('custom-container')).toBe(true);
    });

    it('should apply size classes', () => {
      const renderer = new ChipRenderer({
        chips: defaultChips,
        size: 'small',
      });
      renderer.render(element, params);

      const container = element.querySelector('.zg-chip-container');
      const chip = element.querySelector('.zg-chip');

      expect(container?.classList.contains('zg-chip-container--small')).toBe(true);
      expect(chip?.classList.contains('zg-chip--small')).toBe(true);
    });
  });

  describe('update()', () => {
    it('should update chip content', () => {
      renderer.render(element, params);

      const newChips: Chip[] = [
        { label: 'Updated 1', value: 'u1' },
        { label: 'Updated 2', value: 'u2' },
      ];
      const params2 = { ...params, value: newChips };
      renderer.update(element, params2);

      const labels = Array.from(element.querySelectorAll('.zg-chip__label')).map(
        (el) => el.textContent
      );
      expect(labels).toEqual(['Updated 1', 'Updated 2']);
    });

    it('should handle chip count changes', () => {
      renderer.render(element, params);
      let chips = element.querySelectorAll('.zg-chip:not(.zg-chip--overflow)');
      expect(chips.length).toBe(3);

      const newChips: Chip[] = [
        { label: 'Chip 1', value: '1' },
        { label: 'Chip 2', value: '2' },
        { label: 'Chip 3', value: '3' },
        { label: 'Chip 4', value: '4' },
        { label: 'Chip 5', value: '5' },
      ];
      const params2 = { ...params, value: newChips };
      renderer.update(element, params2);

      chips = element.querySelectorAll('.zg-chip:not(.zg-chip--overflow)');
      expect(chips.length).toBe(5);
    });

    it('should update data attributes', () => {
      renderer.render(element, params);

      const params2 = { ...params, cell: { row: 5, col: 3 } };
      renderer.update(element, params2);

      const container = element.querySelector('.zg-chip-container') as HTMLElement;
      expect(container.dataset.row).toBe('5');
      expect(container.dataset.col).toBe('3');
    });

    it('should handle empty to non-empty transition', () => {
      const params2 = { ...params, value: [] };
      renderer.render(element, params2);

      let chips = element.querySelectorAll('.zg-chip');
      expect(chips.length).toBe(0);

      const params3 = { ...params, value: defaultChips };
      renderer.update(element, params3);

      chips = element.querySelectorAll('.zg-chip:not(.zg-chip--overflow)');
      expect(chips.length).toBe(3);
    });

    it('should handle non-empty to empty transition', () => {
      renderer.render(element, params);

      let chips = element.querySelectorAll('.zg-chip:not(.zg-chip--overflow)');
      expect(chips.length).toBe(3);

      const params2 = { ...params, value: [] };
      renderer.update(element, params2);

      chips = element.querySelectorAll('.zg-chip');
      expect(chips.length).toBe(0);
    });

    it('should update field in data attributes', () => {
      renderer.render(element, params);

      const params2 = { ...params, column: { field: 'newField', header: 'New Field' } };
      renderer.update(element, params2);

      const container = element.querySelector('.zg-chip-container') as HTMLElement;
      expect(container.dataset.field).toBe('newField');
    });
  });

  describe('destroy()', () => {
    it('should remove all content', () => {
      renderer.render(element, params);
      renderer.destroy(element);

      expect(element.innerHTML).toBe('');
    });

    it('should remove cell class', () => {
      renderer.render(element, params);
      renderer.destroy(element);

      expect(element.classList.contains('zg-cell-chip')).toBe(false);
    });

    it('should clean up event handlers', () => {
      const onClick = jest.fn();
      const renderer = new ChipRenderer({
        chips: defaultChips,
        onClick,
      });

      renderer.render(element, params);
      const chip = element.querySelector('.zg-chip') as HTMLElement;

      renderer.destroy(element);

      // Try to trigger click after destroy
      chip.dispatchEvent(new Event('click'));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('should clean up remove button handlers', () => {
      const onRemove = jest.fn();
      const renderer = new ChipRenderer({
        chips: defaultChips,
        removable: true,
        onRemove,
      });

      renderer.render(element, params);
      const removeBtn = element.querySelector('.zg-chip__remove') as HTMLElement;

      renderer.destroy(element);

      // Try to trigger click after destroy
      removeBtn.dispatchEvent(new Event('click'));
      expect(onRemove).not.toHaveBeenCalled();
    });
  });

  describe('getCellClass()', () => {
    it('should return empty class for no chips', () => {
      const params2 = { ...params, value: [] };
      const cssClass = renderer.getCellClass(params2);
      expect(cssClass).toBe('zg-chip-empty');
    });

    it('should return empty class for null value', () => {
      const params2 = { ...params, value: null };
      const cssClass = renderer.getCellClass(params2);
      expect(cssClass).toBe('zg-chip-empty');
    });

    it('should return single class for one chip', () => {
      const params2 = { ...params, value: [defaultChips[0]] };
      const cssClass = renderer.getCellClass(params2);
      expect(cssClass).toBe('zg-chip-single');
    });

    it('should return multiple class for multiple chips', () => {
      const cssClass = renderer.getCellClass(params);
      expect(cssClass).toBe('zg-chip-multiple');
    });

    it('should handle function chips option', () => {
      const renderer = new ChipRenderer({
        chips: (params) => params.value || [],
      });

      const params2 = { ...params, value: defaultChips };
      const cssClass = renderer.getCellClass(params2);
      expect(cssClass).toBe('zg-chip-multiple');
    });

    it('should handle static chips option', () => {
      const renderer = new ChipRenderer({
        chips: [{ label: 'Static', value: 'static' }],
      });

      const staticParams = { ...params, value: 'non-array-value' };
      const cssClass = renderer.getCellClass(staticParams);
      expect(cssClass).toBe('zg-chip-single');
    });
  });

  describe('Removable Chips', () => {
    it('should render remove buttons when removable is true', () => {
      const renderer = new ChipRenderer({
        chips: defaultChips,
        removable: true,
        onRemove: jest.fn(),
      });
      renderer.render(element, params);

      const removeButtons = element.querySelectorAll('.zg-chip__remove');
      expect(removeButtons.length).toBe(3);
    });

    it('should not render remove buttons when removable is false', () => {
      const renderer = new ChipRenderer({
        chips: defaultChips,
        removable: false,
      });
      renderer.render(element, params);

      const removeButtons = element.querySelectorAll('.zg-chip__remove');
      expect(removeButtons.length).toBe(0);
    });

    it('should call onRemove when remove button clicked', () => {
      const onRemove = jest.fn();
      const renderer = new ChipRenderer({
        chips: defaultChips,
        removable: true,
        onRemove,
      });
      renderer.render(element, params);

      const removeBtn = element.querySelector('.zg-chip__remove') as HTMLElement;
      removeBtn.click();

      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onRemove).toHaveBeenCalledWith(defaultChips[0], params);
    });

    it('should set ARIA label on remove button', () => {
      const renderer = new ChipRenderer({
        chips: defaultChips,
        removable: true,
        onRemove: jest.fn(),
      });
      renderer.render(element, params);

      const removeBtn = element.querySelector('.zg-chip__remove') as HTMLElement;
      expect(removeBtn.getAttribute('aria-label')).toBe('Remove Active');
    });

    it('should stop propagation on remove button click', () => {
      const onRemove = jest.fn();
      const onClick = jest.fn();
      const renderer = new ChipRenderer({
        chips: defaultChips,
        removable: true,
        onRemove,
        onClick,
      });
      renderer.render(element, params);

      const removeBtn = element.querySelector('.zg-chip__remove') as HTMLElement;
      removeBtn.click();

      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onClick).not.toHaveBeenCalled(); // Should not trigger chip onClick
    });

    it('should handle per-chip removable override', () => {
      const chipsWithOverride: Chip[] = [
        { label: 'Removable', value: '1', removable: true },
        { label: 'Not Removable', value: '2', removable: false },
        { label: 'Default', value: '3' }, // Uses global removable setting
      ];

      const renderer = new ChipRenderer({
        chips: chipsWithOverride,
        removable: false, // Global setting
        onRemove: jest.fn(),
      });
      const params2 = { ...params, value: chipsWithOverride };
      renderer.render(element, params2);

      const removeButtons = element.querySelectorAll('.zg-chip__remove');
      expect(removeButtons.length).toBe(1); // Only first chip has remove button
    });

    it('should handle errors in onRemove gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const onRemove = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      const renderer = new ChipRenderer({
        chips: defaultChips,
        removable: true,
        onRemove,
      });
      renderer.render(element, params);

      const removeBtn = element.querySelector('.zg-chip__remove') as HTMLElement;
      removeBtn.click();

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Clickable Chips', () => {
    it('should make chips clickable when onClick provided', () => {
      const onClick = jest.fn();
      const renderer = new ChipRenderer({
        chips: defaultChips,
        onClick,
      });
      renderer.render(element, params);

      const chips = element.querySelectorAll('.zg-chip:not(.zg-chip--overflow)');
      chips.forEach((chip) => {
        expect((chip as HTMLElement).style.cursor).toBe('pointer');
        expect(chip.getAttribute('role')).toBe('button');
        expect(chip.getAttribute('tabindex')).toBe('0');
      });
    });

    it('should call onClick when chip clicked', () => {
      const onClick = jest.fn();
      const renderer = new ChipRenderer({
        chips: defaultChips,
        onClick,
      });
      renderer.render(element, params);

      const chip = element.querySelector('.zg-chip') as HTMLElement;
      chip.click();

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(defaultChips[0], params);
    });

    it('should support keyboard interaction (Enter)', () => {
      const onClick = jest.fn();
      const renderer = new ChipRenderer({
        chips: defaultChips,
        onClick,
      });
      renderer.render(element, params);

      const chip = element.querySelector('.zg-chip') as HTMLElement;
      const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      chip.dispatchEvent(keyEvent);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should support keyboard interaction (Space)', () => {
      const onClick = jest.fn();
      const renderer = new ChipRenderer({
        chips: defaultChips,
        onClick,
      });
      renderer.render(element, params);

      const chip = element.querySelector('.zg-chip') as HTMLElement;
      const keyEvent = new KeyboardEvent('keydown', { key: ' ' });
      chip.dispatchEvent(keyEvent);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger onClick when remove button clicked', () => {
      const onClick = jest.fn();
      const onRemove = jest.fn();
      const renderer = new ChipRenderer({
        chips: defaultChips,
        removable: true,
        onClick,
        onRemove,
      });
      renderer.render(element, params);

      const removeBtn = element.querySelector('.zg-chip__remove') as HTMLElement;
      removeBtn.click();

      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('should handle errors in onClick gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const onClick = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      const renderer = new ChipRenderer({
        chips: defaultChips,
        onClick,
      });
      renderer.render(element, params);

      const chip = element.querySelector('.zg-chip') as HTMLElement;
      chip.click();

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Overflow Handling', () => {
    it('should show overflow indicator when maxChips exceeded', () => {
      const renderer = new ChipRenderer({
        chips: defaultChips,
        maxChips: 2,
        overflowMode: 'collapse',
      });
      renderer.render(element, params);

      const visibleChips = element.querySelectorAll('.zg-chip:not(.zg-chip--overflow)');
      const overflow = element.querySelector('.zg-chip--overflow');

      expect(visibleChips.length).toBe(2);
      expect(overflow).toBeTruthy();
      expect(overflow?.textContent).toBe('+1 more');
    });

    it('should not show overflow when chips count equals maxChips', () => {
      const renderer = new ChipRenderer({
        chips: defaultChips,
        maxChips: 3,
        overflowMode: 'collapse',
      });
      renderer.render(element, params);

      const overflow = element.querySelector('.zg-chip--overflow');
      expect(overflow).toBeNull();
    });

    it('should not show overflow when maxChips not set', () => {
      const renderer = new ChipRenderer({
        chips: defaultChips,
      });
      renderer.render(element, params);

      const visibleChips = element.querySelectorAll('.zg-chip:not(.zg-chip--overflow)');
      const overflow = element.querySelector('.zg-chip--overflow');

      expect(visibleChips.length).toBe(3);
      expect(overflow).toBeNull();
    });

    it('should use custom overflowText function', () => {
      const renderer = new ChipRenderer({
        chips: defaultChips,
        maxChips: 1,
        overflowMode: 'collapse',
        overflowText: (count) => `and ${count} others`,
      });
      renderer.render(element, params);

      const overflow = element.querySelector('.zg-chip--overflow');
      expect(overflow?.textContent).toBe('and 2 others');
    });

    it('should set ARIA label on overflow element', () => {
      const renderer = new ChipRenderer({
        chips: defaultChips,
        maxChips: 2,
        overflowMode: 'collapse',
      });
      renderer.render(element, params);

      const overflow = element.querySelector('.zg-chip--overflow');
      expect(overflow?.getAttribute('aria-label')).toBe('1 more items');
    });

    it('should apply size class to overflow element', () => {
      const renderer = new ChipRenderer({
        chips: defaultChips,
        maxChips: 2,
        overflowMode: 'collapse',
        size: 'large',
      });
      renderer.render(element, params);

      const overflow = element.querySelector('.zg-chip--overflow');
      expect(overflow?.classList.contains('zg-chip--large')).toBe(true);
    });

    it('should handle maxChips = 0 (show all)', () => {
      const renderer = new ChipRenderer({
        chips: defaultChips,
        maxChips: 0,
      });
      renderer.render(element, params);

      const visibleChips = element.querySelectorAll('.zg-chip:not(.zg-chip--overflow)');
      expect(visibleChips.length).toBe(3);

      const overflow = element.querySelector('.zg-chip--overflow');
      expect(overflow).toBeNull();
    });
  });

  describe('Chip Customization', () => {
    it('should apply chip className', () => {
      const customChips: Chip[] = [
        { label: 'Custom', value: 'custom', className: 'my-custom-chip' },
      ];

      const renderer = new ChipRenderer({ chips: customChips });
      const params2 = { ...params, value: customChips };
      renderer.render(element, params2);

      const chip = element.querySelector('.zg-chip');
      expect(chip?.classList.contains('my-custom-chip')).toBe(true);
    });

    it('should use default colors when chip colors not specified', () => {
      const chipsWithoutColors: Chip[] = [{ label: 'No Color', value: 'nocolor' }];

      const renderer = new ChipRenderer({
        chips: chipsWithoutColors,
        defaultColor: '#ff00ff',
        defaultTextColor: '#00ff00',
      });
      const params2 = { ...params, value: chipsWithoutColors };
      renderer.render(element, params2);

      const chip = element.querySelector('.zg-chip') as HTMLElement;
      expect(chip.style.backgroundColor).toBe('rgb(255, 0, 255)'); // #ff00ff
      expect(chip.style.color).toBe('rgb(0, 255, 0)'); // #00ff00
    });

    it('should use chip.value when provided', () => {
      const chips: Chip[] = [{ label: 'Display Label', value: 'internal-value' }];

      const renderer = new ChipRenderer({ chips });
      const params2 = { ...params, value: chips };
      renderer.render(element, params2);

      const chip = element.querySelector('.zg-chip');
      expect(chip?.getAttribute('data-chip-value')).toBe('internal-value');
    });

    it('should default to chip.label when value not provided', () => {
      const chips: Chip[] = [{ label: 'Label Only' }];

      const renderer = new ChipRenderer({ chips });
      const params2 = { ...params, value: chips };
      renderer.render(element, params2);

      const chip = element.querySelector('.zg-chip');
      expect(chip?.getAttribute('data-chip-value')).toBe('Label Only');
    });

    it('should store custom data in chip object', () => {
      const chips: Chip[] = [
        { label: 'With Data', value: 'data', data: { id: 123, type: 'custom' } },
      ];

      const onClick = jest.fn();
      const renderer = new ChipRenderer({ chips, onClick });
      const params2 = { ...params, value: chips };
      renderer.render(element, params2);

      const chip = element.querySelector('.zg-chip') as HTMLElement;
      chip.click();

      expect(onClick).toHaveBeenCalledWith(chips[0], params2);
      expect(onClick.mock.calls[0][0].data).toEqual({ id: 123, type: 'custom' });
    });
  });

  describe('Size Variants', () => {
    it('should apply small size', () => {
      const renderer = new ChipRenderer({
        chips: defaultChips,
        size: 'small',
      });
      renderer.render(element, params);

      const container = element.querySelector('.zg-chip-container');
      const chip = element.querySelector('.zg-chip');

      expect(container?.classList.contains('zg-chip-container--small')).toBe(true);
      expect(chip?.classList.contains('zg-chip--small')).toBe(true);
    });

    it('should apply medium size (default)', () => {
      const renderer = new ChipRenderer({
        chips: defaultChips,
      });
      renderer.render(element, params);

      const container = element.querySelector('.zg-chip-container');
      const chip = element.querySelector('.zg-chip');

      expect(container?.classList.contains('zg-chip-container--medium')).toBe(true);
      expect(chip?.classList.contains('zg-chip--medium')).toBe(true);
    });

    it('should apply large size', () => {
      const renderer = new ChipRenderer({
        chips: defaultChips,
        size: 'large',
      });
      renderer.render(element, params);

      const container = element.querySelector('.zg-chip-container');
      const chip = element.querySelector('.zg-chip');

      expect(container?.classList.contains('zg-chip-container--large')).toBe(true);
      expect(chip?.classList.contains('zg-chip--large')).toBe(true);
    });
  });

  describe('Dynamic Chips', () => {
    it('should get chips from function using params.value', () => {
      const renderer = new ChipRenderer({
        chips: (params) => params.value || [],
      });

      const dynamicChips: Chip[] = [
        { label: 'Dynamic 1', value: 'd1' },
        { label: 'Dynamic 2', value: 'd2' },
      ];
      const params2 = { ...params, value: dynamicChips };
      renderer.render(element, params2);

      const labels = Array.from(element.querySelectorAll('.zg-chip__label')).map(
        (el) => el.textContent
      );
      expect(labels).toEqual(['Dynamic 1', 'Dynamic 2']);
    });

    it('should get chips from function using params.rowData', () => {
      const renderer = new ChipRenderer({
        chips: (params) => params.rowData?.tags || [],
      });

      const rowData = {
        id: 1,
        tags: [
          { label: 'Tag 1', value: 't1' },
          { label: 'Tag 2', value: 't2' },
        ],
      };
      const params2 = { ...params, rowData };
      renderer.render(element, params2);

      const labels = Array.from(element.querySelectorAll('.zg-chip__label')).map(
        (el) => el.textContent
      );
      expect(labels).toEqual(['Tag 1', 'Tag 2']);
    });

    it('should update when dynamic chips change', () => {
      const renderer = new ChipRenderer({
        chips: (params) => params.value || [],
      });

      const chips1: Chip[] = [{ label: 'First', value: '1' }];
      const params1 = { ...params, value: chips1 };
      renderer.render(element, params1);

      let labels = Array.from(element.querySelectorAll('.zg-chip__label')).map(
        (el) => el.textContent
      );
      expect(labels).toEqual(['First']);

      const chips2: Chip[] = [
        { label: 'Second', value: '2' },
        { label: 'Third', value: '3' },
      ];
      const params2 = { ...params, value: chips2 };
      renderer.update(element, params2);

      labels = Array.from(element.querySelectorAll('.zg-chip__label')).map(
        (el) => el.textContent
      );
      expect(labels).toEqual(['Second', 'Third']);
    });
  });

  describe('Lifecycle', () => {
    it('should support full render → update → destroy cycle', () => {
      renderer.render(element, params);
      expect(element.querySelector('.zg-chip-container')).toBeTruthy();

      const newChips: Chip[] = [{ label: 'Updated', value: 'updated' }];
      const params2 = { ...params, value: newChips };
      renderer.update(element, params2);
      expect(element.querySelector('.zg-chip__label')?.textContent).toBe('Updated');

      renderer.destroy(element);
      expect(element.innerHTML).toBe('');
    });

    it('should support multiple update cycles', () => {
      renderer.render(element, params);

      for (let i = 0; i < 5; i++) {
        const chips: Chip[] = [{ label: `Chip ${i}`, value: i }];
        const params2 = { ...params, value: chips };
        renderer.update(element, params2);

        const label = element.querySelector('.zg-chip__label')?.textContent;
        expect(label).toBe(`Chip ${i}`);
      }

      renderer.destroy(element);
      expect(element.innerHTML).toBe('');
    });

    it('should clean up handlers between updates', () => {
      const onClick = jest.fn();
      const renderer = new ChipRenderer({
        chips: (params) => params.value || [],
        onClick,
      });

      renderer.render(element, params);
      const oldChip = element.querySelector('.zg-chip') as HTMLElement;

      const newChips: Chip[] = [{ label: 'New', value: 'new' }];
      const params2 = { ...params, value: newChips };
      renderer.update(element, params2);

      // Old chip element no longer in DOM
      oldChip.click();
      expect(onClick).not.toHaveBeenCalled();

      // New chip works
      const newChip = element.querySelector('.zg-chip') as HTMLElement;
      newChip.click();
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined params.value with static chips', () => {
      const renderer = new ChipRenderer({ chips: defaultChips });
      const params2 = { ...params, value: undefined };
      renderer.render(element, params2);

      const chips = element.querySelectorAll('.zg-chip:not(.zg-chip--overflow)');
      expect(chips.length).toBe(3); // Uses static chips
    });

    it('should handle undefined params.value with chip function', () => {
      const renderer = new ChipRenderer({
        chips: (params) => params.value || [],
      });
      const params2 = { ...params, value: undefined };
      renderer.render(element, params2);

      const chips = element.querySelectorAll('.zg-chip');
      expect(chips.length).toBe(0); // Function returns empty array
    });

    it('should handle non-array params.value', () => {
      const renderer = new ChipRenderer({
        chips: (params) => (Array.isArray(params.value) ? params.value : []),
      });
      const params2 = { ...params, value: 'not an array' };
      renderer.render(element, params2);

      const chips = element.querySelectorAll('.zg-chip');
      expect(chips.length).toBe(0);
    });

    it('should handle missing column field', () => {
      const params2 = { ...params, column: undefined };
      renderer.render(element, params2);

      const container = element.querySelector('.zg-chip-container') as HTMLElement;
      expect(container.dataset.field).toBeUndefined();
    });

    it('should handle chips with empty labels', () => {
      const chips: Chip[] = [{ label: '', value: 'empty' }];
      const renderer = new ChipRenderer({ chips });
      const params2 = { ...params, value: chips };
      renderer.render(element, params2);

      const label = element.querySelector('.zg-chip__label');
      expect(label?.textContent).toBe('');
    });

    it('should handle chips with very long labels', () => {
      const longLabel = 'A'.repeat(100);
      const chips: Chip[] = [{ label: longLabel, value: 'long' }];
      const renderer = new ChipRenderer({ chips });
      const params2 = { ...params, value: chips };
      renderer.render(element, params2);

      const label = element.querySelector('.zg-chip__label');
      expect(label?.textContent).toBe(longLabel);
    });

    it('should handle special characters in labels', () => {
      const specialChars = '<script>alert("XSS")</script>';
      const chips: Chip[] = [{ label: specialChars, value: 'special' }];
      const renderer = new ChipRenderer({ chips });
      const params2 = { ...params, value: chips };
      renderer.render(element, params2);

      const label = element.querySelector('.zg-chip__label');
      expect(label?.textContent).toBe(specialChars);
      expect(label?.innerHTML).not.toContain('<script>'); // XSS protection
    });

    it('should handle numeric values', () => {
      const chips: Chip[] = [{ label: 'Number', value: 12345 }];
      const renderer = new ChipRenderer({ chips });
      const params2 = { ...params, value: chips };
      renderer.render(element, params2);

      const chip = element.querySelector('.zg-chip');
      expect(chip?.getAttribute('data-chip-value')).toBe('12345');
    });

    it('should handle duplicate chip values', () => {
      const chips: Chip[] = [
        { label: 'First', value: 'duplicate' },
        { label: 'Second', value: 'duplicate' },
        { label: 'Third', value: 'duplicate' },
      ];

      const renderer = new ChipRenderer({ chips });
      const params2 = { ...params, value: chips };
      renderer.render(element, params2);

      const chipElements = element.querySelectorAll('.zg-chip:not(.zg-chip--overflow)');
      expect(chipElements.length).toBe(3);

      chipElements.forEach((chip) => {
        expect(chip.getAttribute('data-chip-value')).toBe('duplicate');
      });
    });

    it('should handle negative maxChips (show all)', () => {
      const renderer = new ChipRenderer({
        chips: defaultChips,
        maxChips: -1,
      });
      renderer.render(element, params);

      const visibleChips = element.querySelectorAll('.zg-chip:not(.zg-chip--overflow)');
      expect(visibleChips.length).toBe(3);
    });
  });

  describe('Factory Function', () => {
    it('should create renderer instance', () => {
      const renderer = createChipRenderer({ chips: defaultChips });
      expect(renderer).toBeInstanceOf(ChipRenderer);
    });

    it('should create renderer with options', () => {
      const renderer = createChipRenderer({
        chips: defaultChips,
        size: 'large',
        removable: true,
        onRemove: jest.fn(),
      });
      renderer.render(element, params);

      const container = element.querySelector('.zg-chip-container');
      expect(container?.classList.contains('zg-chip-container--large')).toBe(true);

      const removeButtons = element.querySelectorAll('.zg-chip__remove');
      expect(removeButtons.length).toBe(3);
    });
  });
});
