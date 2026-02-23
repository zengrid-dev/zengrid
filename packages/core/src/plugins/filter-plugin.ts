import type { GridPlugin, PluginDisposable } from '../reactive/types';
import { FilterManager } from '../features/filtering/filter-manager';
import type { FilterCondition, FilterModel, ColumnDef } from '../types';
import type { DataAccessor } from '../data/data-accessor/data-accessor.interface';

export interface FilterPluginOptions {
  colCount?: number;
  filterMode?: 'frontend' | 'backend';
  columns?: ColumnDef[];
  enableExport?: boolean;
}

export function createFilterPlugin(options?: FilterPluginOptions): GridPlugin {
  return {
    name: 'filter',
    phase: 20,
    dependencies: ['core'],
    setup(store, api): PluginDisposable {
      store.extend('filter.state', [], 'filter');
      store.extend('filter.quickFilter', { query: '', columns: null as number[] | null }, 'filter');
      store.extend('pipeline.filter', undefined, 'filter', 20);

      let mgr = new FilterManager({
        colCount: options?.colCount ?? 0,
        getValue: (row, col) => {
          const raw = store.get('rows.raw') as unknown[][];
          return raw[row]?.[col];
        },
        mode: options?.filterMode ?? 'frontend',
        columns: options?.columns,
        enableExport: options?.enableExport ?? true,
      });

      // Quick filter state
      let quickFilterQuery = '';
      let quickFilterColumns: number[] | null = null;
      let quickFilterCache: string[] | null = null;
      let quickFilterCacheKey: string | null = null;

      function clearQuickFilterCache(): void {
        quickFilterCache = null;
        quickFilterCacheKey = null;
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

      function applyFilter(): void {
        const rowCount = store.get('rows.count') as number;
        const hasColumnFilters = mgr.hasActiveFilters();
        const hasQuickFilter = quickFilterQuery.trim().length > 0;

        if (!hasColumnFilters && !hasQuickFilter) {
          store.set('pipeline.filter', undefined);
          store.set('filter.state', []);
          return;
        }

        // Start with previous pipeline stage (sort or raw indices)
        const input =
          (store.getUnphased('pipeline.sort') as number[] | undefined) ??
          (store.get('rows.indices') as number[]);

        let result = input;

        // Apply column filters
        if (hasColumnFilters) {
          const visibleSet = new Set(mgr.getVisibleRows(rowCount));
          result = result.filter((idx) => visibleSet.has(idx));
        }

        // Apply quick filter
        if (hasQuickFilter) {
          result = applyQuickFilterToRows(result);
        }

        store.set('pipeline.filter', result);
        store.set('filter.state', mgr.getFilterState());
      }

      store.action(
        'filter:setColumn',
        (col: number, conditions: FilterCondition[], logic: 'AND' | 'OR' = 'AND') => {
          mgr.setColumnFilter(col, conditions, logic);
          applyFilter();
          api.fireEvent('filter:changed', { state: mgr.getFilterState() });
        },
        'filter'
      );

      store.action(
        'filter:clear',
        () => {
          mgr.clearAll();
          quickFilterQuery = '';
          quickFilterColumns = null;
          clearQuickFilterCache();
          store.set('pipeline.filter', undefined);
          store.set('filter.state', []);
          store.set('filter.quickFilter', { query: '', columns: null });
          api.fireEvent('filter:changed', { state: [] });
        },
        'filter'
      );

      store.action(
        'filter:clearColumn',
        (col: number) => {
          mgr.clearColumnFilter(col);
          applyFilter();
          api.fireEvent('filter:changed', { state: mgr.getFilterState() });
        },
        'filter'
      );

      store.action(
        'filter:reapply',
        () => {
          applyFilter();
        },
        'filter'
      );

      store.action(
        'filter:init',
        (colCount: number, dataAccessor?: DataAccessor | null) => {
          const getValue = dataAccessor
            ? (row: number, col: number) => dataAccessor.getValue(row, col)
            : (row: number, col: number) => {
                const raw = store.get('rows.raw') as unknown[][];
                return raw[row]?.[col];
              };

          mgr = new FilterManager({
            colCount,
            getValue,
            mode: options?.filterMode ?? 'frontend',
            columns: options?.columns,
            enableExport: options?.enableExport ?? true,
          });

          clearQuickFilterCache();
          applyFilter();
        },
        'filter'
      );

      store.action(
        'filter:setQuickFilter',
        (query: string, columns?: number[]) => {
          quickFilterQuery = query ?? '';
          quickFilterColumns = columns ?? null;
          store.set('filter.quickFilter', { query: quickFilterQuery, columns: quickFilterColumns });
          applyFilter();
          api.fireEvent('filter:changed', { state: mgr.getFilterState() });
        },
        'filter'
      );

      store.action(
        'filter:clearQuickFilter',
        () => {
          quickFilterQuery = '';
          quickFilterColumns = null;
          clearQuickFilterCache();
          store.set('filter.quickFilter', { query: '', columns: null });
          applyFilter();
          api.fireEvent('filter:changed', { state: mgr.getFilterState() });
        },
        'filter'
      );

      store.action(
        'filter:setState',
        (models: FilterModel[]) => {
          mgr.clearAll();
          for (const model of models) {
            mgr.setColumnFilter(
              model.column,
              model.conditions as FilterCondition[],
              model.logic ?? 'AND'
            );
          }
          applyFilter();
          api.fireEvent('filter:changed', { state: mgr.getFilterState() });
        },
        'filter'
      );

      api.register('filter', {
        setColumnFilter: (col: number, conds: FilterCondition[], logic?: 'AND' | 'OR') =>
          store.exec('filter:setColumn', col, conds, logic),
        clearColumnFilter: (col: number) => store.exec('filter:clearColumn', col),
        clear: () => store.exec('filter:clear'),
        reapply: () => store.exec('filter:reapply'),
        getState: () => store.get('filter.state'),
        hasActiveFilters: () => mgr.hasActiveFilters(),
        getFieldFilterState: () => mgr.getFieldFilterState(),
        getFilterExports: () => mgr.getFilterExport(),
        getQuickFilter: () => store.get('filter.quickFilter'),
      });

      return { teardown: [() => mgr.destroy()] };
    },
  };
}
