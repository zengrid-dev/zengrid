import type { FilterModel } from '../../types';
import type { SlimGridContext } from '../grid-context';

export interface FilterApi {
  set(column: number, operator: string, value: any): void;
  setColumn(column: number, conditions: Array<{ operator: string; value: any }>, logic?: 'AND' | 'OR'): void;
  clear(): void;
  clearColumn(column: number): void;
  getState(): FilterModel[];
  setState(models: FilterModel[]): void;
  getFieldState(): any;
  getExports(): any;
  getMode(): 'frontend' | 'backend';
  setQuick(query: string, columns?: number[]): void;
  clearQuick(): void;
  getQuick(): { query: string; columns: number[] | null };
}

export function createFilterApi(ctx: SlimGridContext): FilterApi {
  function hasFilterPlugin(): boolean {
    return ctx.pluginHost.has('filter');
  }

  return {
    set(column: number, operator: string, value: any): void {
      if (!hasFilterPlugin()) return;
      ctx.store.exec('filter:setColumn', column, [{ operator, value }], 'AND');
    },

    setColumn(column: number, conditions: Array<{ operator: string; value: any }>, logic: 'AND' | 'OR' = 'AND'): void {
      if (!hasFilterPlugin()) return;
      ctx.store.exec('filter:setColumn', column, conditions, logic);
    },

    clear(): void {
      if (!hasFilterPlugin()) return;
      ctx.store.exec('filter:clear');
    },

    clearColumn(column: number): void {
      if (!hasFilterPlugin()) return;
      ctx.store.exec('filter:clearColumn', column);
    },

    getState(): FilterModel[] {
      if (!hasFilterPlugin()) return [];
      return ctx.store.get('filter.state') as FilterModel[];
    },

    setState(models: FilterModel[]): void {
      if (!hasFilterPlugin()) return;
      ctx.store.exec('filter:setState', models);
    },

    getFieldState() {
      if (!hasFilterPlugin()) return null;
      const api = ctx.gridApi.getMethod('filter', 'getFieldFilterState');
      return api ? api() : null;
    },

    getExports() {
      if (!hasFilterPlugin()) return null;
      const api = ctx.gridApi.getMethod('filter', 'getFilterExports');
      return api ? api() : null;
    },

    getMode(): 'frontend' | 'backend' {
      const mode = ctx.options.filterMode ?? 'frontend';
      if (mode === 'auto') return ctx.options.onFilterRequest ? 'backend' : 'frontend';
      return mode;
    },

    setQuick(query: string, columns?: number[]): void {
      if (!hasFilterPlugin()) return;
      ctx.store.exec('filter:setQuickFilter', query, columns);
    },

    clearQuick(): void {
      if (!hasFilterPlugin()) return;
      ctx.store.exec('filter:clearQuickFilter');
    },

    getQuick(): { query: string; columns: number[] | null } {
      if (!hasFilterPlugin()) return { query: '', columns: null };
      return ctx.store.get('filter.quickFilter') as { query: string; columns: number[] | null };
    },
  };
}
