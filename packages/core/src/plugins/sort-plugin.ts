import type { GridPlugin, PluginDisposable } from '../reactive/types';
import { SortManager } from '../features/sorting/sort-manager';
import { buildSortRequest, normalizeSortState } from '../features/sorting/sort-request';
import type { ColumnDef, SortRequest, SortState } from '../types';
import type { DataAccessor } from '../data/data-accessor/data-accessor.interface';

export interface SortPluginOptions {
  enableMultiSort?: boolean;
  initialSort?: SortState[];
  sortMode?: 'frontend' | 'backend';
  onSortRequest?: (sortState: SortState[], request: SortRequest) => Promise<void> | void;
  columns?: ColumnDef[];
  usePipeline?: boolean;
}

function toggleSortState(
  currentState: SortState[],
  column: number,
  enableMultiSort: boolean,
  additive: boolean
): SortState[] {
  const nextState = currentState.map((entry) => ({ ...entry }));

  if (!enableMultiSort || !additive) {
    const existing = nextState.find((entry) => entry.column === column);

    if (existing) {
      if (existing.direction === 'asc') {
        return [{ column, direction: 'desc' }];
      }
      return [];
    }

    return [{ column, direction: 'asc' }];
  }

  const existingIndex = nextState.findIndex((entry) => entry.column === column);
  if (existingIndex >= 0) {
    const existing = nextState[existingIndex];
    if (existing.direction === 'asc') {
      existing.direction = 'desc';
    } else {
      nextState.splice(existingIndex, 1);
    }
  } else {
    nextState.push({
      column,
      direction: 'asc',
      sortIndex: nextState.length,
    });
  }

  return normalizeSortState(nextState);
}

export function createSortPlugin(options?: SortPluginOptions): GridPlugin {
  return {
    name: 'sort',
    phase: 10,
    dependencies: ['core'],
    setup(store, api): PluginDisposable {
      const usePipeline = options?.usePipeline !== false;
      const initialSort = normalizeSortState(options?.initialSort ?? []);
      const enableMultiSort = options?.enableMultiSort ?? false;
      const resolvedSortMode = options?.sortMode ?? 'frontend';

      store.extend('sort.state', initialSort, 'sort');
      store.extend('pipeline.sort', undefined, 'sort', 10);

      let mgr: SortManager | null = null;
      let backendRequestId = 0;

      if (usePipeline) {
        mgr = new SortManager({
          rowCount: store.get('rows.count') as number,
          getValue: (row, col) => {
            const raw = store.get('rows.raw') as unknown[][];
            return raw[row]?.[col];
          },
          enableMultiSort,
          initialSort,
        });
      }

      function getDataMode(): 'frontend' | 'backend' {
        const getMode = api.getMethod('data', 'getMode');
        return getMode ? (getMode() as 'frontend' | 'backend') : 'frontend';
      }

      function runBackendSortRequest(sortState: SortState[]): void {
        if (
          resolvedSortMode !== 'backend' ||
          typeof options?.onSortRequest !== 'function' ||
          getDataMode() === 'backend'
        ) {
          return;
        }

        const request = buildSortRequest(sortState, options?.columns);
        const requestId = ++backendRequestId;

        try {
          const result = options.onSortRequest(request.sortState, request);

          if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
            Promise.resolve(result)
              .then(() => {
                if (requestId !== backendRequestId) {
                  return;
                }

                api.fireEvent('sort:afterSort', {
                  sortState: request.sortState,
                  rowsAffected: (store.get('rows.count') as number | undefined) ?? 0,
                });
              })
              .catch((error) => {
                if (requestId !== backendRequestId) {
                  return;
                }

                const requestError =
                  error instanceof Error ? error : new Error('Backend sort failed');
                api.fireEvent('error', {
                  message: 'Backend sort failed',
                  error: requestError,
                  context: { sortState: request.sortState, request },
                });
              });

            return;
          }

          api.fireEvent('sort:afterSort', {
            sortState: request.sortState,
            rowsAffected: (store.get('rows.count') as number | undefined) ?? 0,
          });
        } catch (error) {
          const requestError = error instanceof Error ? error : new Error('Backend sort failed');
          api.fireEvent('error', {
            message: 'Backend sort failed',
            error: requestError,
            context: { sortState: request.sortState, request },
          });
        }
      }

      function syncToStore(): void {
        if (!usePipeline || !mgr) {
          store.set('pipeline.sort', undefined);
          return;
        }

        const state = mgr.getSortState();
        const map = mgr.getIndexMap();
        store.set('sort.state', state);
        store.set('pipeline.sort', map ? [...map.indices] : undefined);
      }

      store.action(
        'sort:toggle',
        (column: number, additive = false) => {
          const prev = (store.get('sort.state') as SortState[]) ?? [];

          if (!usePipeline || !mgr) {
            const next = toggleSortState(prev, column, enableMultiSort, additive);
            store.set('sort.state', next);
            store.set('pipeline.sort', undefined);
            api.fireEvent('sort:change', { sortState: next, previousSortState: prev });
            runBackendSortRequest(next);
            return;
          }

          mgr.updateRowCount(store.get('rows.count') as number);
          mgr.toggleSort(column, additive);
          syncToStore();
          runBackendSortRequest(mgr.getSortState());
          api.fireEvent('sort:change', {
            sortState: mgr.getSortState(),
            previousSortState: prev,
          });
        },
        'sort'
      );

      store.action(
        'sort:apply',
        (sortState: SortState[]) => {
          const prev = (store.get('sort.state') as SortState[]) ?? [];
          const next = normalizeSortState(sortState);

          if (!usePipeline || !mgr) {
            store.set('sort.state', next);
            store.set('pipeline.sort', undefined);
            api.fireEvent('sort:change', { sortState: next, previousSortState: prev });
            runBackendSortRequest(next);
            return;
          }

          mgr.updateRowCount(store.get('rows.count') as number);
          mgr.setSortState(next);
          syncToStore();
          runBackendSortRequest(mgr.getSortState());
          api.fireEvent('sort:change', {
            sortState: mgr.getSortState(),
            previousSortState: prev,
          });
        },
        'sort'
      );

      store.action(
        'sort:clear',
        () => {
          const prev = (store.get('sort.state') as SortState[]) ?? [];

          if (mgr) {
            mgr.clearSort();
          }

          store.set('sort.state', []);
          store.set('pipeline.sort', undefined);
          api.fireEvent('sort:change', { sortState: [], previousSortState: prev });
          runBackendSortRequest([]);
        },
        'sort'
      );

      store.action(
        'sort:init',
        (rowCount: number, dataAccessor?: DataAccessor | null) => {
          if (!usePipeline) {
            store.set('pipeline.sort', undefined);
            return;
          }

          const getValue = dataAccessor
            ? (row: number, col: number) => dataAccessor.getValue(row, col)
            : (row: number, col: number) => {
                const raw = store.get('rows.raw') as unknown[][];
                return raw[row]?.[col];
              };

          mgr?.destroy();
          mgr = new SortManager({
            rowCount,
            getValue,
            enableMultiSort,
            initialSort: store.get('sort.state') as SortState[],
          });

          syncToStore();
        },
        'sort'
      );

      api.register('sort', {
        toggle: (col: number, additive?: boolean) => store.exec('sort:toggle', col, additive),
        apply: (state: SortState[]) => store.exec('sort:apply', state),
        clear: () => store.exec('sort:clear'),
        getState: () => store.get('sort.state'),
        getColumnSort: (column: number) => {
          const sortState = (store.get('sort.state') as SortState[]) ?? [];
          return sortState.find((entry) => entry.column === column)?.direction ?? null;
        },
        getIcons: () => ({ asc: '▲', desc: '▼' }),
        getMode: () => (getDataMode() === 'backend' ? 'backend' : resolvedSortMode),
      });

      if (usePipeline && initialSort.length) {
        syncToStore();
      }

      return {
        teardown: [() => mgr?.destroy()],
      };
    },
  };
}
