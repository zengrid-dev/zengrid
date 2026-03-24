import { Grid } from '../grid-core';
import { resetTracking } from '../../reactive/tracking';
import { resetDebug } from '../../reactive/debug';
import { resetScheduler } from '../../reactive/effect-scheduler';

let container: HTMLElement;
let grid: Grid;

async function flushAsyncWork(): Promise<void> {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
}

beforeEach(() => {
  resetTracking();
  resetDebug();
  resetScheduler();
  container = document.createElement('div');
  Object.defineProperty(container, 'clientWidth', { value: 400, configurable: true });
  Object.defineProperty(container, 'clientHeight', { value: 300, configurable: true });
  document.body.appendChild(container);
});

afterEach(() => {
  if (grid) {
    grid.destroy();
  }

  if (container.parentNode) {
    container.parentNode.removeChild(container);
  }
});

describe('Grid Backend Sort Mode', () => {
  it('delegates backend sort requests for frontend data mode', async () => {
    const onSortRequest = jest.fn().mockResolvedValue(undefined);

    grid = new Grid(container, {
      rowCount: 3,
      colCount: 2,
      rowHeight: 30,
      colWidth: 100,
      columns: [
        { field: 'name', header: 'Name' },
        { field: 'score', header: 'Score' },
      ],
      sortMode: 'backend',
      onSortRequest,
    });

    grid.setData([
      ['Alice', 10],
      ['Bob', 20],
      ['Cara', 15],
    ]);
    grid.render();
    await flushAsyncWork();

    grid.sort.apply([{ column: 1, direction: 'desc' }]);
    await flushAsyncWork();

    expect(grid.sort.getMode()).toBe('backend');
    expect(onSortRequest).toHaveBeenCalledTimes(1);
    expect(onSortRequest).toHaveBeenCalledWith(
      [{ column: 1, direction: 'desc' }],
      {
        sortState: [{ column: 1, direction: 'desc' }],
        sort: [
          { column: 1, field: 'score', direction: 'desc', sortIndex: 0 },
        ],
      }
    );
  });

  it('serializes multi-column backend sort requests for frontend data mode', async () => {
    const onSortRequest = jest.fn().mockResolvedValue(undefined);

    grid = new Grid(container, {
      rowCount: 4,
      colCount: 2,
      rowHeight: 30,
      colWidth: 100,
      columns: [
        { field: 'name', header: 'Name' },
        { field: 'score', header: 'Score' },
      ],
      sortMode: 'backend',
      onSortRequest,
    });

    grid.setData([
      ['Bob', 20],
      ['Alice', 20],
      ['Cara', 10],
      ['Alice', 10],
    ]);
    grid.render();
    await flushAsyncWork();

    grid.sort.apply([
      { column: 1, direction: 'desc', sortIndex: 1 },
      { column: 0, direction: 'asc', sortIndex: 0 },
    ]);
    await flushAsyncWork();

    expect(grid.sort.getMode()).toBe('backend');
    expect(onSortRequest).toHaveBeenCalledTimes(1);
    expect(onSortRequest).toHaveBeenCalledWith(
      [
        { column: 0, direction: 'asc', sortIndex: 0 },
        { column: 1, direction: 'desc', sortIndex: 1 },
      ],
      {
        sortState: [
          { column: 0, direction: 'asc', sortIndex: 0 },
          { column: 1, direction: 'desc', sortIndex: 1 },
        ],
        sort: [
          { column: 0, field: 'name', direction: 'asc', sortIndex: 0 },
          { column: 1, field: 'score', direction: 'desc', sortIndex: 1 },
        ],
      }
    );
  });


  it('uses the same normalized multi-sort state for frontend runtime and backend callback requests', async () => {
    const columns = [
      { field: 'name', header: 'Name' },
      { field: 'score', header: 'Score' },
    ];
    const data = [
      ['Bob', 20],
      ['Alice', 20],
      ['Cara', 10],
      ['Alice', 10],
    ];
    const inputState = [
      { column: 1, direction: 'desc' as const, sortIndex: 1 },
      { column: 0, direction: 'asc' as const, sortIndex: 0 },
    ];

    const frontendGrid = new Grid(container, {
      rowCount: 4,
      colCount: 2,
      rowHeight: 30,
      colWidth: 100,
      columns,
    });

    frontendGrid.setData(data);
    frontendGrid.render();
    await flushAsyncWork();

    frontendGrid.sort.apply(inputState);
    await flushAsyncWork();

    const frontendState = frontendGrid.sort.getState();
    frontendGrid.destroy();

    const onSortRequest = jest.fn().mockResolvedValue(undefined);
    grid = new Grid(container, {
      rowCount: 4,
      colCount: 2,
      rowHeight: 30,
      colWidth: 100,
      columns,
      sortMode: 'backend',
      onSortRequest,
    });

    grid.setData(data);
    grid.render();
    await flushAsyncWork();

    grid.sort.apply(inputState);
    await flushAsyncWork();

    expect(onSortRequest).toHaveBeenCalledTimes(1);
    expect(onSortRequest.mock.calls[0][0]).toEqual(frontendState);
    expect(onSortRequest.mock.calls[0][1]).toEqual({
      sortState: frontendState,
      sort: [
        { column: 0, field: 'name', direction: 'asc', sortIndex: 0 },
        { column: 1, field: 'score', direction: 'desc', sortIndex: 1 },
      ],
    });
  });

  it('uses the same normalized multi-sort state for frontend runtime and backend data requests', async () => {
    const columns = [
      { field: 'name', header: 'Name' },
      { field: 'score', header: 'Score' },
    ];
    const data = [
      ['Bob', 20],
      ['Alice', 20],
      ['Cara', 10],
      ['Alice', 10],
    ];
    const inputState = [
      { column: 1, direction: 'desc' as const, sortIndex: 1 },
      { column: 0, direction: 'asc' as const, sortIndex: 0 },
    ];

    const frontendGrid = new Grid(container, {
      rowCount: 4,
      colCount: 2,
      rowHeight: 30,
      colWidth: 100,
      columns,
    });

    frontendGrid.setData(data);
    frontendGrid.render();
    await flushAsyncWork();

    frontendGrid.sort.apply(inputState);
    await flushAsyncWork();

    const frontendState = frontendGrid.sort.getState();
    frontendGrid.destroy();

    const onDataRequest = jest.fn().mockResolvedValue({
      data: data,
      totalRows: data.length,
      startRow: 0,
      endRow: data.length,
    });

    grid = new Grid(container, {
      rowCount: data.length,
      colCount: 2,
      rowHeight: 30,
      colWidth: 100,
      columns,
      dataMode: 'backend',
      sortMode: 'backend',
      onDataRequest,
    });

    grid.render();
    await flushAsyncWork();

    grid.sort.apply(inputState);
    await flushAsyncWork();

    expect(onDataRequest).toHaveBeenCalledTimes(2);
    expect(onDataRequest.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        sortState: frontendState,
        sort: [
          { column: 0, field: 'name', direction: 'asc', sortIndex: 0 },
          { column: 1, field: 'score', direction: 'desc', sortIndex: 1 },
        ],
      })
    );
  });

  it('serializes backend sort state into onDataRequest for backend data mode', async () => {
    const onDataRequest = jest.fn().mockResolvedValue({
      data: [['Alice', 10]],
      totalRows: 1,
      startRow: 0,
      endRow: 1,
    });
    const onSortRequest = jest.fn();

    grid = new Grid(container, {
      rowCount: 1,
      colCount: 2,
      rowHeight: 30,
      colWidth: 100,
      columns: [
        { field: 'name', header: 'Name' },
        { field: 'score', header: 'Score' },
      ],
      dataMode: 'backend',
      sortMode: 'backend',
      onDataRequest,
      onSortRequest,
    });

    grid.render();
    await flushAsyncWork();

    grid.sort.apply([{ column: 0, direction: 'asc' }]);
    await flushAsyncWork();

    expect(onSortRequest).not.toHaveBeenCalled();
    expect(onDataRequest).toHaveBeenCalledTimes(2);
    expect(onDataRequest.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        sortState: [{ column: 0, direction: 'asc' }],
        sort: [
          { column: 0, field: 'name', direction: 'asc', sortIndex: 0 },
        ],
      })
    );
  });
});
