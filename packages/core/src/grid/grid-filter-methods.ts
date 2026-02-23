import type { FilterModel } from '../types';
import type { GridContext } from './grid-context';

export function createFilterMethods(ctx: GridContext) {
  function syncFilterState(): void {
    const viewIndices = ctx.store.get('rows.viewIndices') as number[] | undefined;
    const visibleCount = viewIndices ? viewIndices.length : ctx.options.rowCount;
    if (ctx.init.scroller) {
      ctx.init.scroller.setRowCount(visibleCount);
      ctx.dom.updateCanvasSize(
        ctx.init.scroller.getTotalWidth(),
        ctx.init.scroller.getTotalHeight()
      );
    }
    if (ctx.init.positioner) {
      ctx.init.positioner.refresh();
    }
    ctx.clearCache();
    ctx.refresh();
  }

  return {
    setFilter(column: number, operator: string, value: any): void {
      if (!ctx.pluginHost.has('filter')) return;
      ctx.store.exec('filter:setColumn', column, [{ operator, value }], 'AND');
      syncFilterState();
    },

    setColumnFilter(
      column: number,
      conditions: Array<{ operator: string; value: any }>,
      logic: 'AND' | 'OR' = 'AND'
    ): void {
      if (!ctx.pluginHost.has('filter')) return;
      ctx.store.exec('filter:setColumn', column, conditions, logic);
      syncFilterState();
    },

    getFilterState(): FilterModel[] {
      if (!ctx.pluginHost.has('filter')) return [];
      return ctx.store.get('filter.state') as FilterModel[];
    },

    setFilterState(models: FilterModel[]): void {
      if (!ctx.pluginHost.has('filter')) return;
      ctx.store.exec('filter:setState', models);
      syncFilterState();
    },

    getFieldFilterState() {
      if (!ctx.pluginHost.has('filter')) return null;
      const method = ctx.gridApi.getMethod('filter', 'getFieldFilterState');
      return method ? method() : null;
    },

    getFilterExports() {
      if (!ctx.pluginHost.has('filter')) return null;
      const method = ctx.gridApi.getMethod('filter', 'getFilterExports');
      return method ? method() : null;
    },

    getFilterMode(): 'frontend' | 'backend' {
      const mode = ctx.options.filterMode ?? 'frontend';
      if (mode === 'auto') return ctx.options.onFilterRequest ? 'backend' : 'frontend';
      return mode;
    },

    clearFilters(): void {
      if (!ctx.pluginHost.has('filter')) return;
      ctx.store.exec('filter:clear');
      syncFilterState();
    },

    clearColumnFilter(column: number): void {
      if (!ctx.pluginHost.has('filter')) return;
      ctx.store.exec('filter:clearColumn', column);
      syncFilterState();
    },

    setQuickFilter(query: string, columns?: number[]): void {
      if (!ctx.pluginHost.has('filter')) return;
      ctx.store.exec('filter:setQuickFilter', query, columns);
      syncFilterState();
    },

    clearQuickFilter(): void {
      if (!ctx.pluginHost.has('filter')) return;
      ctx.store.exec('filter:clearQuickFilter');
      syncFilterState();
    },

    getQuickFilter(): { query: string; columns: number[] | null } {
      if (!ctx.pluginHost.has('filter')) return { query: '', columns: null };
      return ctx.store.get('filter.quickFilter') as { query: string; columns: number[] | null };
    },
  };
}

export type FilterMethods = ReturnType<typeof createFilterMethods>;
