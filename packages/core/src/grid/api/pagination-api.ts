import type { SlimGridContext } from '../grid-context';

export interface PaginationApi {
  goTo(page: number): void;
  next(): void;
  previous(): void;
  first(): void;
  last(): void;
  setPageSize(pageSize: number): void;
  getCurrentPage(): number;
  getPageSize(): number;
  getTotalPages(): number;
}

export function createPaginationApi(ctx: SlimGridContext): PaginationApi {
  function hasPagination(): boolean {
    return ctx.pluginHost.has('pagination');
  }

  return {
    goTo(page: number): void {
      if (hasPagination()) ctx.store.exec('pagination:goToPage', page);
    },

    next(): void {
      if (hasPagination()) ctx.store.exec('pagination:nextPage');
    },

    previous(): void {
      if (hasPagination()) ctx.store.exec('pagination:previousPage');
    },

    first(): void {
      if (hasPagination()) ctx.store.exec('pagination:firstPage');
    },

    last(): void {
      if (hasPagination()) ctx.store.exec('pagination:lastPage');
    },

    setPageSize(pageSize: number): void {
      if (hasPagination()) ctx.store.exec('pagination:setPageSize', pageSize);
    },

    getCurrentPage(): number {
      return (hasPagination() ? ctx.store.get('pagination.currentPage') : 0) as number;
    },

    getPageSize(): number {
      return (hasPagination() ? ctx.store.get('pagination.pageSize') : 100) as number;
    },

    getTotalPages(): number {
      const api = ctx.gridApi.getMethod('pagination', 'getTotalPages');
      return api ? api() : 0;
    },
  };
}
