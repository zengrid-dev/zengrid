import type { GridPlugin, PluginDisposable } from '../../reactive/types';
import { GridFilterUI } from '../../grid/filter-ui';
import type { ColumnDef, FilterModel } from '../../types';
import type { ColumnModel } from '../../features/columns/column-model';

export interface FilterUIPluginOptions {
  getColumnDef: (dataCol: number) => ColumnDef | undefined;
  getColumnModel: () => ColumnModel | null;
  getContainer: () => HTMLElement;
}

export function createFilterUIPlugin(options: FilterUIPluginOptions): GridPlugin {
  return {
    name: 'filter-ui',
    phase: 25,
    dependencies: ['filter'],
    setup(store, api): PluginDisposable {
      let filterUI: GridFilterUI | null = null;

      store.action(
        'filterUI:attach',
        (container: HTMLElement, events: any) => {
          if (filterUI) {
            filterUI.destroy();
          }

          filterUI = new GridFilterUI({
            container,
            events,
            getFilterState: () => store.get('filter.state') as FilterModel[],
            setColumnFilter: (column, conditions, logic) => {
              store.exec('filter:setColumn', column, conditions, logic ?? 'AND');
            },
            clearColumnFilter: (column) => {
              store.exec('filter:clearColumn', column);
            },
            getColumnDef: options.getColumnDef,
            mapVisualToDataCol: (visualCol: number) => {
              const columnModel = options.getColumnModel();
              if (columnModel) {
                const orderedColumns = columnModel.getVisibleColumnsInOrder();
                if (orderedColumns[visualCol]) {
                  return orderedColumns[visualCol].dataIndex;
                }
              }
              return visualCol;
            },
          });
        },
        'filter-ui'
      );

      api.register('filterUI', {
        destroy: () => {
          if (filterUI) {
            filterUI.destroy();
            filterUI = null;
          }
        },
      });

      return {
        teardown: [
          () => {
            if (filterUI) {
              filterUI.destroy();
              filterUI = null;
            }
          },
        ],
      };
    },
  };
}
