import type { GridStateSnapshot, SortState, FilterModel } from '../../types';
import type { SlimGridContext } from '../grid-context';
import type { SortApi } from './sort-api';
import type { FilterApi } from './filter-api';

export interface StateApi {
  getSnapshot(): GridStateSnapshot;
  applySnapshot(snapshot: GridStateSnapshot): void;
}

export function createStateApi(ctx: SlimGridContext, sortApi: SortApi, filterApi: FilterApi): StateApi {
  return {
    getSnapshot(): GridStateSnapshot {
      const api = ctx.gridApi.getMethod('column', 'getStateSnapshot');
      return api
        ? api(() => sortApi.getState(), () => filterApi.getState())
        : { columns: [], sortState: [], filterState: [] };
    },

    applySnapshot(snapshot: GridStateSnapshot): void {
      const api = ctx.gridApi.getMethod('column', 'applyStateSnapshot');
      if (api) {
        api(
          snapshot,
          (s: SortState[]) => sortApi.setState(s),
          (m: FilterModel[]) => filterApi.setState(m)
        );
      }
    },
  };
}
