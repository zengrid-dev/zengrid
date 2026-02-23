import type { GridPlugin, PluginDisposable } from '../reactive/types';
import { SortManager } from '../features/sorting/sort-manager';
import type { SortState } from '../types';
import type { DataAccessor } from '../data/data-accessor/data-accessor.interface';

export interface SortPluginOptions {
  enableMultiSort?: boolean;
  initialSort?: SortState[];
  sortMode?: 'frontend' | 'backend';
}

export function createSortPlugin(options?: SortPluginOptions): GridPlugin {
  return {
    name: 'sort',
    phase: 10,
    dependencies: ['core'],
    setup(store, api): PluginDisposable {
      store.extend('sort.state', options?.initialSort ?? [], 'sort');
      store.extend('pipeline.sort', undefined, 'sort', 10);

      let mgr: SortManager;

      mgr = new SortManager({
        rowCount: store.get('rows.count') as number,
        getValue: (row, col) => {
          const raw = store.get('rows.raw') as unknown[][];
          return raw[row]?.[col];
        },
        enableMultiSort: options?.enableMultiSort ?? false,
        initialSort: options?.initialSort,
      });

      function syncToStore(): void {
        const state = mgr.getSortState();
        const map = mgr.getIndexMap();
        store.set('sort.state', state);
        store.set('pipeline.sort', map ? [...map.indices] : undefined);
      }

      store.action(
        'sort:toggle',
        (column: number, additive = false) => {
          mgr.updateRowCount(store.get('rows.count') as number);
          mgr.toggleSort(column, additive);
          syncToStore();
          api.fireEvent('sort:changed', { state: mgr.getSortState() });
        },
        'sort'
      );

      store.action(
        'sort:apply',
        (sortState: SortState[]) => {
          mgr.updateRowCount(store.get('rows.count') as number);
          mgr.setSortState(sortState);
          syncToStore();
          api.fireEvent('sort:changed', { state: mgr.getSortState() });
        },
        'sort'
      );

      store.action(
        'sort:clear',
        () => {
          mgr.clearSort();
          store.set('sort.state', []);
          store.set('pipeline.sort', undefined);
          api.fireEvent('sort:changed', { state: [] });
        },
        'sort'
      );

      store.action(
        'sort:init',
        (rowCount: number, dataAccessor?: DataAccessor | null) => {
          const getValue = dataAccessor
            ? (row: number, col: number) => dataAccessor.getValue(row, col)
            : (row: number, col: number) => {
                const raw = store.get('rows.raw') as unknown[][];
                return raw[row]?.[col];
              };

          mgr = new SortManager({
            rowCount,
            getValue,
            enableMultiSort: options?.enableMultiSort ?? false,
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
        getColumnSort: (column: number) => mgr?.getColumnSort(column) ?? null,
        getIcons: () => ({ asc: '▲', desc: '▼' }),
        getMode: () => options?.sortMode ?? 'frontend',
      });

      // If initial sort provided, sync immediately
      if (options?.initialSort?.length) syncToStore();

      return { teardown: [() => mgr.destroy()] };
    },
  };
}
