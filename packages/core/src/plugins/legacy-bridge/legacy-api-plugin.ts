import type { GridPlugin, PluginDisposable, GridStore, GridApi } from '../../reactive/types';
import type { SortState, FilterModel } from '../../types';

export function createLegacyApiPlugin(): GridPlugin {
  return {
    name: 'legacy-bridge',
    phase: 200,
    dependencies: ['core'],
    setup(store: GridStore, api: GridApi): PluginDisposable {
      // Sort handlers — soft dependency on 'sort' plugin
      api.onLegacy('sort', (column: unknown, direction: unknown) => {
        try {
          if (direction === null) {
            store.exec('sort:clear');
          } else {
            store.exec('sort:apply', [{ column, direction }]);
          }
        } catch (_) {
          // sort plugin not loaded — no-op
        }
      });

      api.onLegacy('toggleSort', (column: unknown) => {
        try {
          store.exec('sort:toggle', column);
        } catch (_) {
          // sort plugin not loaded
        }
      });

      api.onLegacy('clearSort', () => {
        try {
          store.exec('sort:clear');
        } catch (_) {
          // sort plugin not loaded
        }
      });

      api.onLegacy('setSortState', (sortState: unknown) => {
        try {
          store.exec('sort:apply', sortState as SortState[]);
        } catch (_) {
          // sort plugin not loaded
        }
      });

      // Data handler
      api.onLegacy('setData', (data: unknown) => {
        try {
          store.exec('core:setData', data);
        } catch (_) {
          // core plugin not loaded
        }
      });

      // Filter handlers — soft dependency on 'filter' plugin
      api.onLegacy('setColumnFilter', (column: unknown, conditions: unknown, logic: unknown) => {
        try {
          store.exec('filter:setColumn', column, conditions, logic ?? 'AND');
        } catch (_) {
          // filter plugin not loaded
        }
      });

      api.onLegacy('setFilter', (column: unknown, operator: unknown, value: unknown) => {
        try {
          store.exec('filter:setColumn', column, [{ operator, value }], 'AND');
        } catch (_) {
          // filter plugin not loaded
        }
      });

      api.onLegacy('clearFilters', () => {
        try {
          store.exec('filter:clear');
        } catch (_) {
          // filter plugin not loaded
        }
      });

      api.onLegacy('clearColumnFilter', (column: unknown) => {
        try {
          store.exec('filter:clearColumn', column);
        } catch (_) {
          // filter plugin not loaded
        }
      });

      api.onLegacy('setFilterState', (models: unknown) => {
        try {
          store.exec('filter:clear');
          for (const model of models as FilterModel[]) {
            store.exec('filter:setColumn', model.column, model.conditions, model.logic ?? 'AND');
          }
        } catch (_) {
          // filter plugin not loaded
        }
      });

      return { teardown: [] };
    },
  };
}
