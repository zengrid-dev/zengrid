import { Grid } from '../grid-core';
import { resetTracking } from '../../reactive/tracking';
import { resetDebug } from '../../reactive/debug';
import { resetScheduler } from '../../reactive/effect-scheduler';
import type { FieldFilterState } from '../../features/filtering/types';

let container: HTMLElement;
let grid: Grid;

async function flushAsyncWork(): Promise<void> {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
}

function normalizeFieldState(state: any): any {
  if (!state) return state;

  return {
    ...state,
    timestamp: undefined,
  };
}

function normalizeFilterExpression(expression: any): any {
  if (!expression) return expression;

  return {
    ...expression,
    fieldState: expression.fieldState
      ? {
          ...expression.fieldState,
          timestamp: undefined,
        }
      : expression.fieldState,
    filterExport: expression.filterExport
      ? {
          ...expression.filterExport,
          state: expression.filterExport.state
            ? {
                ...expression.filterExport.state,
                timestamp: undefined,
              }
            : expression.filterExport.state,
        }
      : expression.filterExport,
  };
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

describe('Grid Backend Filter Mode', () => {
  it('delegates backend filter requests for frontend data mode with a shared expression', async () => {
    const onFilterRequest = jest.fn().mockResolvedValue(undefined);

    grid = new Grid(container, {
      rowCount: 3,
      colCount: 2,
      rowHeight: 30,
      colWidth: 100,
      columns: [
        { field: 'name', header: 'Name' },
        { field: 'score', header: 'Score' },
      ],
      filterMode: 'backend',
      onFilterRequest,
    });

    grid.setData([
      ['Alice', 10],
      ['Bob', 20],
      ['Cara', 15],
    ]);
    grid.render();
    await flushAsyncWork();

    grid.filter.setColumn(1, [{ operator: 'greaterThan', value: 15 }]);
    await flushAsyncWork();

    expect(grid.filter.getMode()).toBe('backend');
    expect(grid.filter.getState()).toEqual([
      {
        column: 1,
        conditions: [{ operator: 'greaterThan', value: 15 }],
        logic: 'AND',
      },
    ]);
    expect(onFilterRequest).toHaveBeenCalledTimes(1);
    expect(onFilterRequest.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        type: 'model',
        models: [
          {
            column: 1,
            conditions: [{ operator: 'greaterThan', value: 15 }],
            logic: 'AND',
          },
        ],
        quickFilter: { query: '', columns: null },
        fieldState: expect.objectContaining({
          activeFields: ['score'],
          root: expect.objectContaining({
            logic: 'AND',
            conditions: [
              expect.objectContaining({
                field: 'score',
                operator: 'gt',
                value: 15,
              }),
            ],
          }),
        }),
        filterExport: expect.objectContaining({
          rest: expect.objectContaining({
            queryString: expect.stringContaining('score'),
          }),
          sql: expect.objectContaining({
            whereClause: expect.stringContaining('score'),
          }),
        }),
      })
    );

    grid.filter.setQuick('ali', [0]);
    await flushAsyncWork();

    expect(onFilterRequest).toHaveBeenCalledTimes(2);
    expect(onFilterRequest.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        quickFilter: { query: 'ali', columns: [0] },
        models: [
          {
            column: 1,
            conditions: [{ operator: 'greaterThan', value: 15 }],
            logic: 'AND',
          },
        ],
      })
    );
  });

  it('keeps backend callback payloads deterministic between model-state and field-state entry', async () => {
    const fieldState: FieldFilterState = {
      root: {
        logic: 'AND',
        conditions: [{ field: 'score', operator: 'gt', value: 15 }],
      },
      activeFields: ['score'],
      timestamp: Date.now(),
    };
    const modelOnFilterRequest = jest.fn().mockResolvedValue(undefined);

    grid = new Grid(container, {
      rowCount: 3,
      colCount: 2,
      rowHeight: 30,
      colWidth: 100,
      columns: [
        { field: 'name', header: 'Name' },
        { field: 'score', header: 'Score' },
      ],
      filterMode: 'backend',
      onFilterRequest: modelOnFilterRequest,
    });

    grid.setData([
      ['Alice', 10],
      ['Bob', 20],
      ['Alicia', 25],
    ]);
    grid.render();
    await flushAsyncWork();

    grid.filter.setColumn(1, [{ operator: 'greaterThan', value: 15 }]);
    await flushAsyncWork();
    grid.filter.setQuick('ali', [0]);
    await flushAsyncWork();

    const modelExpression = normalizeFilterExpression(
      modelOnFilterRequest.mock.calls[1]?.[0]
    );

    grid.destroy();

    const fieldOnFilterRequest = jest.fn().mockResolvedValue(undefined);
    grid = new Grid(container, {
      rowCount: 3,
      colCount: 2,
      rowHeight: 30,
      colWidth: 100,
      columns: [
        { field: 'name', header: 'Name' },
        { field: 'score', header: 'Score' },
      ],
      filterMode: 'backend',
      onFilterRequest: fieldOnFilterRequest,
    });

    grid.setData([
      ['Alice', 10],
      ['Bob', 20],
      ['Alicia', 25],
    ]);
    grid.render();
    await flushAsyncWork();

    grid.filter.setFieldState(fieldState);
    await flushAsyncWork();
    grid.filter.setQuick('ali', [0]);
    await flushAsyncWork();

    const fieldExpression = normalizeFilterExpression(
      fieldOnFilterRequest.mock.calls[1]?.[0]
    );

    expect(grid.filter.getState()).toEqual([
      {
        column: 1,
        conditions: [{ operator: 'greaterThan', value: 15 }],
        logic: 'AND',
      },
    ]);
    expect(fieldExpression).toEqual(modelExpression);
  });


  it('keeps global quick search composed with column filters in backend filter callbacks', async () => {
    const onFilterRequest = jest.fn().mockResolvedValue(undefined);

    grid = new Grid(container, {
      rowCount: 4,
      colCount: 3,
      rowHeight: 30,
      colWidth: 100,
      columns: [
        { field: 'name', header: 'Name' },
        { field: 'department', header: 'Department' },
        { field: 'city', header: 'City' },
      ],
      filterMode: 'backend',
      onFilterRequest,
    });

    grid.setData([
      ['Alice', 'Sales', 'Boston'],
      ['Bob', 'Sales', 'Austin'],
      ['Cara', 'Support', 'Boston'],
      ['Alicia', 'Sales', 'Boston'],
    ]);
    grid.render();
    await flushAsyncWork();

    grid.filter.setColumn(1, [{ operator: 'equals', value: 'Sales' }]);
    await flushAsyncWork();
    grid.filter.setQuick('boston');
    await flushAsyncWork();

    expect(onFilterRequest).toHaveBeenCalledTimes(2);
    expect(onFilterRequest.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        models: [
          {
            column: 1,
            conditions: [{ operator: 'equals', value: 'Sales' }],
            logic: 'AND',
          },
        ],
        quickFilter: { query: 'boston', columns: null },
      })
    );
  });

  it('serializes backend filter state into onDataRequest for backend data mode', async () => {
    const onDataRequest = jest.fn().mockResolvedValue({
      data: [['Bob', 20]],
      totalRows: 1,
      startRow: 0,
      endRow: 1,
    });
    const onFilterRequest = jest.fn();

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
      filterMode: 'backend',
      onDataRequest,
      onFilterRequest,
    });

    grid.render();
    await flushAsyncWork();

    grid.filter.setColumn(1, [{ operator: 'greaterThan', value: 15 }]);
    await flushAsyncWork();

    expect(onFilterRequest).not.toHaveBeenCalled();
    expect(onDataRequest).toHaveBeenCalledTimes(2);
    expect(onDataRequest.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        filterExpression: expect.objectContaining({
          type: 'model',
          models: [
            {
              column: 1,
              conditions: [{ operator: 'greaterThan', value: 15 }],
              logic: 'AND',
            },
          ],
          quickFilter: { query: '', columns: null },
          fieldState: expect.objectContaining({
            activeFields: ['score'],
          }),
          filterExport: expect.objectContaining({
            rest: expect.objectContaining({
              queryString: expect.stringContaining('score'),
            }),
          }),
        }),
        filterState: [
          {
            column: 1,
            conditions: [{ operator: 'greaterThan', value: 15 }],
            logic: 'AND',
          },
        ],
        filter: expect.objectContaining({
          activeFields: ['score'],
        }),
        filterExport: expect.objectContaining({
          queryString: expect.stringContaining('score'),
        }),
      })
    );
  });

  it('keeps backend data-request payloads deterministic between model-state and field-state entry', async () => {
    const fieldState: FieldFilterState = {
      root: {
        logic: 'AND',
        conditions: [{ field: 'score', operator: 'gt', value: 15 }],
      },
      activeFields: ['score'],
      timestamp: Date.now(),
    };
    const modelOnDataRequest = jest.fn().mockResolvedValue({
      data: [['Bob', 20]],
      totalRows: 1,
      startRow: 0,
      endRow: 1,
    });

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
      filterMode: 'backend',
      onDataRequest: modelOnDataRequest,
    });

    grid.render();
    await flushAsyncWork();

    grid.filter.setColumn(1, [{ operator: 'greaterThan', value: 15 }]);
    await flushAsyncWork();
    grid.filter.setQuick('ali', [0]);
    await flushAsyncWork();

    const modelRequest = modelOnDataRequest.mock.calls[2]?.[0];

    grid.destroy();

    const fieldOnDataRequest = jest.fn().mockResolvedValue({
      data: [['Bob', 20]],
      totalRows: 1,
      startRow: 0,
      endRow: 1,
    });

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
      filterMode: 'backend',
      onDataRequest: fieldOnDataRequest,
    });

    grid.render();
    await flushAsyncWork();

    grid.filter.setFieldState(fieldState);
    await flushAsyncWork();
    grid.filter.setQuick('ali', [0]);
    await flushAsyncWork();

    const fieldRequest = fieldOnDataRequest.mock.calls[2]?.[0];

    expect(fieldRequest.filterState).toEqual(modelRequest.filterState);
    expect(normalizeFieldState(fieldRequest.filter)).toEqual(normalizeFieldState(modelRequest.filter));
    expect(fieldRequest.filterExport).toEqual(modelRequest.filterExport);
    expect(
      normalizeFilterExpression(fieldRequest.filterExpression)
    ).toEqual(normalizeFilterExpression(modelRequest.filterExpression));
  });


  it('keeps clear-filter expressions consistent between backend filter callbacks and backend data requests', async () => {
    const frontendOnFilterRequest = jest.fn().mockResolvedValue(undefined);

    const frontendGrid = new Grid(container, {
      rowCount: 3,
      colCount: 2,
      rowHeight: 30,
      colWidth: 100,
      columns: [
        { field: 'name', header: 'Name' },
        { field: 'score', header: 'Score' },
      ],
      filterMode: 'backend',
      onFilterRequest: frontendOnFilterRequest,
    });

    frontendGrid.setData([
      ['Alice', 10],
      ['Bob', 20],
      ['Cara', 15],
    ]);
    frontendGrid.render();
    await flushAsyncWork();

    frontendGrid.filter.setColumn(1, [{ operator: 'greaterThan', value: 15 }]);
    await flushAsyncWork();
    frontendGrid.filter.clear();
    await flushAsyncWork();

    const clearedFrontendExpression = frontendOnFilterRequest.mock.calls[1]?.[0];
    expect(clearedFrontendExpression).toEqual(
      expect.objectContaining({
        type: 'model',
        models: [],
        quickFilter: { query: '', columns: null },
      })
    );

    frontendGrid.destroy();

    const backendOnDataRequest = jest.fn().mockResolvedValue({
      data: [['Bob', 20]],
      totalRows: 1,
      startRow: 0,
      endRow: 1,
    });

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
      filterMode: 'backend',
      onDataRequest: backendOnDataRequest,
    });

    grid.render();
    await flushAsyncWork();

    grid.filter.setColumn(1, [{ operator: 'greaterThan', value: 15 }]);
    await flushAsyncWork();
    grid.filter.clear();
    await flushAsyncWork();

    expect(backendOnDataRequest).toHaveBeenCalledTimes(3);
    expect(backendOnDataRequest.mock.calls[2][0]).toEqual(
      expect.objectContaining({
        filterState: undefined,
        filter: undefined,
        filterExport: undefined,
      })
    );
    expect(
      normalizeFilterExpression(backendOnDataRequest.mock.calls[2][0].filterExpression)
    ).toEqual(normalizeFilterExpression(clearedFrontendExpression));
  });

  it('keeps active filter expressions consistent between backend filter callbacks and backend data requests', async () => {
    const frontendOnFilterRequest = jest.fn().mockResolvedValue(undefined);

    const frontendGrid = new Grid(container, {
      rowCount: 4,
      colCount: 3,
      rowHeight: 30,
      colWidth: 100,
      columns: [
        { field: 'name', header: 'Name' },
        { field: 'department', header: 'Department' },
        { field: 'city', header: 'City' },
      ],
      filterMode: 'backend',
      onFilterRequest: frontendOnFilterRequest,
    });

    frontendGrid.setData([
      ['Alice', 'Sales', 'Boston'],
      ['Bob', 'Sales', 'Austin'],
      ['Cara', 'Support', 'Boston'],
      ['Alicia', 'Sales', 'Boston'],
    ]);
    frontendGrid.render();
    await flushAsyncWork();

    frontendGrid.filter.setColumn(1, [{ operator: 'equals', value: 'Sales' }]);
    await flushAsyncWork();
    frontendGrid.filter.setQuick('boston');
    await flushAsyncWork();

    const frontendExpression = frontendOnFilterRequest.mock.calls[1]?.[0];
    expect(frontendExpression).toEqual(
      expect.objectContaining({
        type: 'model',
        models: [
          {
            column: 1,
            conditions: [{ operator: 'equals', value: 'Sales' }],
            logic: 'AND',
          },
        ],
        quickFilter: { query: 'boston', columns: null },
      })
    );

    frontendGrid.destroy();

    const backendOnDataRequest = jest.fn().mockResolvedValue({
      data: [['Alice', 'Sales', 'Boston']],
      totalRows: 4,
      startRow: 0,
      endRow: 1,
    });

    grid = new Grid(container, {
      rowCount: 4,
      colCount: 3,
      rowHeight: 30,
      colWidth: 100,
      columns: [
        { field: 'name', header: 'Name' },
        { field: 'department', header: 'Department' },
        { field: 'city', header: 'City' },
      ],
      dataMode: 'backend',
      filterMode: 'backend',
      onDataRequest: backendOnDataRequest,
    });

    grid.render();
    await flushAsyncWork();

    grid.filter.setColumn(1, [{ operator: 'equals', value: 'Sales' }]);
    await flushAsyncWork();
    grid.filter.setQuick('boston');
    await flushAsyncWork();

    expect(backendOnDataRequest).toHaveBeenCalledTimes(3);
    expect(
      normalizeFilterExpression(backendOnDataRequest.mock.calls[2][0].filterExpression)
    ).toEqual(normalizeFilterExpression(frontendExpression));
  });
});
