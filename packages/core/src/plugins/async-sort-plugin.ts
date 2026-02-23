import type { GridPlugin, PluginDisposable, AsyncState } from '../reactive/types';
import { SortManager } from '../features/sorting/sort-manager';
import { yieldToMain } from '../reactive/yield';
import type { SortState } from '../types';

export interface AsyncSortPluginOptions {
  enableMultiSort?: boolean;
  initialSort?: SortState[];
}

export function createAsyncSortPlugin(options?: AsyncSortPluginOptions): GridPlugin {
  return {
    name: 'sort',
    phase: 10,
    dependencies: ['core'],
    setup(store, api): PluginDisposable {
      store.extend('sort.state', options?.initialSort ?? [], 'sort');

      const mgr = new SortManager({
        rowCount: 0,
        getValue: (row, col) => {
          const raw = store.get('rows.raw') as unknown[][];
          return raw[row]?.[col];
        },
        enableMultiSort: options?.enableMultiSort ?? false,
        initialSort: options?.initialSort,
      });

      // Async computed: reads sort.state + rows.count reactively,
      // then runs sort in an async worker with a yield point.
      store.asyncComputed(
        'pipeline.sort',
        () => {
          const sortState = store.get('sort.state') as SortState[];
          const rowCount = store.get('rows.count') as number;

          return async () => {
            if (!sortState.length) return undefined;
            mgr.updateRowCount(rowCount);
            mgr.setSortState(sortState);
            await yieldToMain();
            const map = mgr.getIndexMap();
            return map ? [...map.indices] : undefined;
          };
        },
        'sort',
        10
      );

      store.action(
        'sort:toggle',
        (column: number, additive = false) => {
          const rowCount = store.get('rows.count') as number;
          mgr.updateRowCount(rowCount);
          mgr.toggleSort(column, additive);
          store.set('sort.state', mgr.getSortState());
          api.fireEvent('sort:changed', { state: mgr.getSortState() });
        },
        'sort'
      );

      store.action(
        'sort:apply',
        (sortState: SortState[]) => {
          const rowCount = store.get('rows.count') as number;
          mgr.updateRowCount(rowCount);
          mgr.setSortState(sortState);
          store.set('sort.state', mgr.getSortState());
          api.fireEvent('sort:changed', { state: mgr.getSortState() });
        },
        'sort'
      );

      store.action(
        'sort:clear',
        () => {
          mgr.clearSort();
          store.set('sort.state', []);
          api.fireEvent('sort:changed', { state: [] });
        },
        'sort'
      );

      api.register('sort', {
        toggle: (col: number, additive?: boolean) => store.exec('sort:toggle', col, additive),
        apply: (state: SortState[]) => store.exec('sort:apply', state),
        clear: () => store.exec('sort:clear'),
        getState: () => store.get('sort.state'),
        getAsyncState: () => store.get('pipeline.sort.__async') as AsyncState,
        isPending: () => (store.get('pipeline.sort.__async') as AsyncState)?.pending ?? false,
      });

      // If initial sort provided, write to sort.state to trigger asyncComputed
      if (options?.initialSort?.length) {
        store.set('sort.state', [...options.initialSort]);
      }

      return { teardown: [() => mgr.destroy()] };
    },
  };
}
