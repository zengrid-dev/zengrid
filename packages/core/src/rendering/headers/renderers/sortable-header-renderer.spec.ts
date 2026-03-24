import { SortableHeaderRenderer } from './sortable-header-renderer';
import type { HeaderRenderParams } from '../header-renderer.interface';

function createParams(overrides: Partial<HeaderRenderParams> = {}): HeaderRenderParams {
  return {
    columnIndex: 0,
    column: { field: 'name', header: 'Name', sortable: true },
    config: {
      text: 'Name',
      type: 'sortable',
      interactive: true,
      sortIndicator: { show: true, position: 'trailing' },
    },
    width: 120,
    height: 40,
    ...overrides,
  };
}

describe('SortableHeaderRenderer', () => {
  let renderer: SortableHeaderRenderer;
  let element: HTMLElement;

  beforeEach(() => {
    renderer = new SortableHeaderRenderer();
    element = document.createElement('div');
  });

  afterEach(() => {
    renderer.destroy(element);
  });

  it('renders a primary multi-sort badge as 1', () => {
    renderer.render(
      element,
      createParams({
        sortDirection: 'asc',
        sortPriority: 0,
      })
    );

    const badge = element.querySelector('.zg-sort-priority');
    expect(badge?.textContent).toBe('1');
  });

  it('renders a secondary multi-sort badge as 2', () => {
    renderer.render(
      element,
      createParams({
        sortDirection: 'desc',
        sortPriority: 1,
      })
    );

    const badge = element.querySelector('.zg-sort-priority');
    expect(badge?.textContent).toBe('2');
  });

  it('does not render a priority badge for an unsorted column', () => {
    renderer.render(
      element,
      createParams({
        sortDirection: null,
        sortPriority: 0,
      })
    );

    expect(element.querySelector('.zg-sort-priority')).toBeNull();
  });

  it('emits a plain click sort interaction without additive multi-sort', () => {
    const emit = jest.fn();

    renderer.render(
      element,
      createParams({
        emit,
      })
    );

    const clickEvent = new MouseEvent('click', { bubbles: true });
    element.dispatchEvent(clickEvent);

    expect(element.tabIndex).toBe(0);
    expect(emit).toHaveBeenNthCalledWith(
      1,
      'header:click',
      expect.objectContaining({
        columnIndex: 0,
        nativeEvent: clickEvent,
      })
    );
    expect(emit).toHaveBeenNthCalledWith(
      2,
      'header:sort:click',
      expect.objectContaining({
        columnIndex: 0,
        nextDirection: 'asc',
        additive: false,
        trigger: 'click',
        nativeEvent: clickEvent,
      })
    );
  });

  it('emits additive multi-sort intent for Shift+Enter keyboard activation', () => {
    const emit = jest.fn();

    renderer.render(
      element,
      createParams({
        sortDirection: 'asc',
        emit,
      })
    );

    const keyboardEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(keyboardEvent);

    expect(keyboardEvent.defaultPrevented).toBe(true);
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(
      'header:sort:click',
      expect.objectContaining({
        columnIndex: 0,
        currentDirection: 'asc',
        nextDirection: 'desc',
        additive: true,
        trigger: 'keyboard',
        nativeEvent: keyboardEvent,
      })
    );
  });
});
