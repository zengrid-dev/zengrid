import type { SortState } from '../types';
import type { GridContext } from './grid-context';

export function createSortMethods(ctx: GridContext) {
  return {
    sort(column: number, direction: 'asc' | 'desc' | null = 'asc'): void {
      if (!ctx.pluginHost.has('sort')) return;
      if (direction === null) {
        ctx.store.exec('sort:clear');
      } else {
        ctx.store.exec('sort:apply', [{ column, direction }]);
      }
      ctx.clearCache();
      ctx.refresh();
    },

    toggleSort(column: number): void {
      if (!ctx.pluginHost.has('sort')) return;
      ctx.store.exec('sort:toggle', column);
      ctx.clearCache();
      ctx.refresh();
    },

    getSortState(): SortState[] {
      if (!ctx.pluginHost.has('sort')) return [];
      return ctx.store.get('sort.state') as SortState[];
    },

    getColumnSort(column: number) {
      if (!ctx.pluginHost.has('sort')) return null;
      const sortApi = ctx.gridApi.getMethod('sort', 'getColumnSort');
      return sortApi ? sortApi(column) : null;
    },

    getSortIcons(): { asc: string; desc: string } {
      return {
        asc: ctx.options.sortIcons?.asc ?? '▲',
        desc: ctx.options.sortIcons?.desc ?? '▼',
      };
    },

    getSortMode(): 'frontend' | 'backend' {
      const mode = ctx.options.sortMode ?? 'frontend';
      if (mode === 'auto') return ctx.options.onSortRequest ? 'backend' : 'frontend';
      return mode;
    },

    clearSort(): void {
      if (!ctx.pluginHost.has('sort')) return;
      ctx.store.exec('sort:clear');
      ctx.clearCache();
      ctx.refresh();
    },

    setSortState(sortState: SortState[]): void {
      if (!ctx.pluginHost.has('sort')) return;
      ctx.store.exec('sort:apply', sortState);
      ctx.clearCache();
      ctx.refresh();
    },
  };
}

export type SortMethods = ReturnType<typeof createSortMethods>;
