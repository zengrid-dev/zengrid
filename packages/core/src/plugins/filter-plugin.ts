import type { GridPlugin, PluginDisposable } from '../reactive/types';
import { FilterManager } from '../features/filtering/filter-manager';
import { buildModelFilterExpression } from '../features/filtering/filter-expression';
import type {
  FilterCondition,
  FilterExpression,
  FilterModel,
  FilterQuickState,
  ColumnDef,
} from '../types';
import type { FieldFilterState } from '../features/filtering/types';
import type { DataAccessor } from '../data/data-accessor/data-accessor.interface';

export interface FilterPluginOptions {
  colCount?: number;
  filterMode?: 'frontend' | 'backend';
  columns?: ColumnDef[];
  enableExport?: boolean;
  usePipeline?: boolean;
  onFilterRequest?: (filterExpression: FilterExpression) => Promise<void> | void;
  useRequestCallback?: boolean;
}

export function createFilterPlugin(options?: FilterPluginOptions): GridPlugin {
  return {
    name: 'filter',
    phase: 20,
    dependencies: ['core'],
    setup(store, api): PluginDisposable {
      store.extend('filter.state', [], 'filter');
      store.extend('filter.quickFilter', { query: '', columns: null as number[] | null }, 'filter');
      store.extend('filter.expression', null as FilterExpression | null, 'filter');
      store.extend('pipeline.filter', undefined, 'filter', 20);

      const usePipeline = options?.usePipeline !== false;
      const useRequestCallback = options?.useRequestCallback !== false;

      let mgr = createManager(options?.colCount ?? 0);

      // Quick filter state
      let quickFilterQuery = '';
      let quickFilterColumns: number[] | null = null;
      let quickFilterCache: string[] | null = null;
      let quickFilterCacheKey: string | null = null;

      function createManager(colCount: number, dataAccessor?: DataAccessor | null): FilterManager {
        const getValue = dataAccessor
          ? (row: number, col: number) => dataAccessor.getValue(row, col)
          : (row: number, col: number) => {
              const raw = store.get('rows.raw') as unknown[][];
              return raw[row]?.[col];
            };

        return new FilterManager({
          colCount,
          getValue,
          mode: options?.filterMode ?? 'frontend',
          columns: options?.columns,
          enableExport: options?.enableExport ?? true,
          onFilterRequest: options?.onFilterRequest,
        });
      }

      function clearQuickFilterCache(): void {
        quickFilterCache = null;
        quickFilterCacheKey = null;
      }

      function getQuickFilterState(): FilterQuickState {
        return {
          query: quickFilterQuery,
          columns: quickFilterColumns ? [...quickFilterColumns] : null,
        };
      }

      function buildExpression(): FilterExpression {
        const hasColumns = Array.isArray(options?.columns) && options.columns.length > 0;

        return buildModelFilterExpression({
          models: mgr.getFilterState(),
          quickFilter: getQuickFilterState(),
          fieldState: hasColumns ? mgr.getFieldFilterState() : null,
          filterExport: hasColumns ? mgr.getFilterExport() : null,
        });
      }

      function persistState(): FilterExpression {
        const expression = buildExpression();
        store.set('filter.state', mgr.getFilterState());
        store.set('filter.expression', expression);
        return expression;
      }

      function dispatchBackendFilterRequest(expression: FilterExpression): void {
        if (options?.filterMode !== 'backend' || !useRequestCallback || !options.onFilterRequest) {
          return;
        }

        try {
          const result = options.onFilterRequest(expression);
          if (result && typeof result === 'object' && 'then' in result) {
            result.catch((error) => {
              api.fireEvent('filter:error', {
                timestamp: Date.now(),
                error: error instanceof Error ? error : new Error('Backend filter failed'),
              });
            });
          }
        } catch (error) {
          api.fireEvent('filter:error', {
            timestamp: Date.now(),
            error: error instanceof Error ? error : new Error('Backend filter failed'),
          });
        }
      }

      function resolveQuickFilterColumns(): number[] {
        if (quickFilterColumns && quickFilterColumns.length > 0) {
          return quickFilterColumns;
        }
        const colCount = options?.colCount ?? 0;
        if (options?.columns && options.columns.length > 0) {
          return options.columns.map((_c, index) => index);
        }
        return Array.from({ length: colCount }, (_, i) => i);
      }

      function ensureQuickFilterCache(columns: number[]): void {
        const cacheKey = columns.join(',');
        if (quickFilterCache && quickFilterCacheKey === cacheKey) {
          return;
        }

        const raw = store.get('rows.raw') as unknown[][];
        if (!raw || raw.length === 0) {
          quickFilterCache = null;
          quickFilterCacheKey = null;
          return;
        }

        const rowCount = raw.length;
        const cache: string[] = new Array(rowCount);

        for (let row = 0; row < rowCount; row++) {
          const parts: string[] = [];
          for (const col of columns) {
            const value = raw[row]?.[col];
            if (value !== undefined && value !== null) {
              parts.push(String(value));
            }
          }
          cache[row] = parts.join(' ').toLowerCase();
        }

        quickFilterCache = cache;
        quickFilterCacheKey = cacheKey;
      }

      function applyQuickFilterToRows(rows: number[]): number[] {
        const query = quickFilterQuery.trim().toLowerCase();
        if (!query) return rows;

        const columns = resolveQuickFilterColumns();
        if (columns.length === 0) return rows;

        ensureQuickFilterCache(columns);
        if (!quickFilterCache) return rows;

        const matches: number[] = [];
        for (const row of rows) {
          const rowText = quickFilterCache[row];
          if (rowText && rowText.includes(query)) {
            matches.push(row);
          }
        }
        return matches;
      }

      function applyFilter(): FilterExpression {
        const hasColumnFilters = mgr.hasActiveFilters();
        const hasQuickFilter = quickFilterQuery.trim().length > 0;
        const expression = persistState();

        if (!usePipeline) {
          store.set('pipeline.filter', undefined);
          return expression;
        }

        if (!hasColumnFilters && !hasQuickFilter) {
          store.set('pipeline.filter', undefined);
          return expression;
        }

        const rowCount = store.get('rows.count') as number;
        const input =
          (store.getUnphased('pipeline.sort') as number[] | undefined) ??
          (store.get('rows.indices') as number[]);

        let result = input;

        if (hasColumnFilters) {
          const visibleSet = new Set(mgr.getVisibleRows(rowCount));
          result = result.filter((idx) => visibleSet.has(idx));
        }

        if (hasQuickFilter) {
          result = applyQuickFilterToRows(result);
        }

        store.set('pipeline.filter', result);
        return expression;
      }

      store.action(
        'filter:setColumn',
        (col: number, conditions: FilterCondition[], logic: 'AND' | 'OR' = 'AND') => {
          const prev = mgr.getFilterState();
          mgr.setColumnFilter(col, conditions, logic);
          const expression = applyFilter();
          api.fireEvent('filter:change', { filterState: mgr.getFilterState(), previousFilterState: prev });
          dispatchBackendFilterRequest(expression);
        },
        'filter'
      );

      store.action(
        'filter:clear',
        () => {
          const prev = mgr.getFilterState();
          mgr.clearAll();
          quickFilterQuery = '';
          quickFilterColumns = null;
          clearQuickFilterCache();
          store.set('filter.quickFilter', { query: '', columns: null });
          const expression = applyFilter();
          api.fireEvent('filter:change', { filterState: [], previousFilterState: prev });
          dispatchBackendFilterRequest(expression);
        },
        'filter'
      );

      store.action(
        'filter:clearColumn',
        (col: number) => {
          const prev = mgr.getFilterState();
          mgr.clearColumnFilter(col);
          const expression = applyFilter();
          api.fireEvent('filter:change', { filterState: mgr.getFilterState(), previousFilterState: prev });
          dispatchBackendFilterRequest(expression);
        },
        'filter'
      );

      store.action(
        'filter:reapply',
        () => {
          const expression = applyFilter();
          dispatchBackendFilterRequest(expression);
        },
        'filter'
      );

      store.action(
        'filter:init',
        (colCount: number, dataAccessor?: DataAccessor | null) => {
          mgr?.destroy();
          mgr = createManager(colCount, dataAccessor);
          clearQuickFilterCache();
          applyFilter();
        },
        'filter'
      );

      store.action(
        'filter:setQuickFilter',
        (query: string, columns?: number[]) => {
          const prev = mgr.getFilterState();
          quickFilterQuery = query ?? '';
          quickFilterColumns = columns ?? null;
          store.set('filter.quickFilter', { query: quickFilterQuery, columns: quickFilterColumns });
          const expression = applyFilter();
          api.fireEvent('filter:change', { filterState: mgr.getFilterState(), previousFilterState: prev });
          dispatchBackendFilterRequest(expression);
        },
        'filter'
      );

      store.action(
        'filter:clearQuickFilter',
        () => {
          const prev = mgr.getFilterState();
          quickFilterQuery = '';
          quickFilterColumns = null;
          clearQuickFilterCache();
          store.set('filter.quickFilter', { query: '', columns: null });
          const expression = applyFilter();
          api.fireEvent('filter:change', { filterState: mgr.getFilterState(), previousFilterState: prev });
          dispatchBackendFilterRequest(expression);
        },
        'filter'
      );

      store.action(
        'filter:setState',
        (models: FilterModel[]) => {
          const prev = mgr.getFilterState();
          mgr.clearAll();
          for (const model of models) {
            mgr.setColumnFilter(
              model.column,
              model.conditions as FilterCondition[],
              model.logic ?? 'AND'
            );
          }
          const expression = applyFilter();
          api.fireEvent('filter:change', { filterState: mgr.getFilterState(), previousFilterState: prev });
          dispatchBackendFilterRequest(expression);
        },
        'filter'
      );

      store.action(
        'filter:setFieldState',
        (state: FieldFilterState) => {
          const prev = mgr.getFilterState();
          mgr.setFieldFilter(state);
          const expression = applyFilter();
          api.fireEvent('filter:change', { filterState: mgr.getFilterState(), previousFilterState: prev });
          dispatchBackendFilterRequest(expression);
        },
        'filter'
      );

      persistState();

      api.register('filter', {
        setColumnFilter: (col: number, conds: FilterCondition[], logic?: 'AND' | 'OR') =>
          store.exec('filter:setColumn', col, conds, logic),
        setFieldFilterState: (state: FieldFilterState) => store.exec('filter:setFieldState', state),
        clearColumnFilter: (col: number) => store.exec('filter:clearColumn', col),
        clear: () => store.exec('filter:clear'),
        reapply: () => store.exec('filter:reapply'),
        getState: () => store.get('filter.state'),
        hasActiveFilters: () => mgr.hasActiveFilters() || quickFilterQuery.trim().length > 0,
        getFieldFilterState: () => mgr.getFieldFilterState(),
        getFilterExports: () => mgr.getFilterExport(),
        getQuickFilter: () => store.get('filter.quickFilter'),
        getExpression: () => store.get('filter.expression'),
        getMode: () => options?.filterMode ?? 'frontend',
      });

      return { teardown: [() => mgr.destroy()] };
    },
  };
}
