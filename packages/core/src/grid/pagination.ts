import type { GridOptions } from '../types';
import type { EventEmitter } from '../events/event-emitter';
import type { GridEvents } from '../events/grid-events';
import { Paginator } from '../features/pagination';
import type { DataManager } from '../data/data-manager';

/**
 * GridPagination - Handles pagination logic for the grid
 */
export class GridPagination {
  private options: GridOptions;
  private paginator: Paginator | null = null;
  private dataManager: DataManager | null = null;

  public currentPage: number = 0;
  public pageSize: number = 100;
  public paginationTop: HTMLElement | null = null;
  public paginationBottom: HTMLElement | null = null;

  constructor(options: GridOptions, _events: EventEmitter<GridEvents>) {
    this.options = options;

    if (this.options.pagination?.enabled) {
      this.paginator = new Paginator(this.options.pagination);
      this.pageSize = this.options.pagination.pageSize ?? 100;
    }
  }

  setDataManager(dataManager: DataManager): void {
    this.dataManager = dataManager;
  }

  /**
   * Go to a specific page
   */
  goToPage(page: number): void {
    if (!this.paginator) return;

    const totalPages = this.getTotalPages();
    if (page < 0 || page >= totalPages) {
      console.warn(`Invalid page number: ${page}. Valid range: 0-${totalPages - 1}`);
      return;
    }

    if (this.currentPage !== page) {
      this.currentPage = page;
      this.updatePagination();

      if (this.options.onPageChange) {
        this.options.onPageChange(this.currentPage, this.pageSize);
      }
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  /**
   * Go to first page
   */
  firstPage(): void {
    this.goToPage(0);
  }

  /**
   * Go to last page
   */
  lastPage(): void {
    this.goToPage(this.getTotalPages() - 1);
  }

  /**
   * Change page size
   */
  setPageSize(pageSize: number): void {
    if (!this.paginator) {
      console.warn('Pagination not enabled');
      return;
    }

    if (!Number.isFinite(pageSize) || pageSize <= 0) {
      console.error('Invalid page size:', pageSize);
      return;
    }

    pageSize = Math.max(1, Math.floor(pageSize));

    const allowedSizes = this.options.pagination?.pageSizeOptions;
    if (allowedSizes && allowedSizes.length > 0 && !allowedSizes.includes(pageSize)) {
      console.warn(`Page size ${pageSize} not in allowed options:`, allowedSizes);
    }

    if (pageSize === this.pageSize) {
      return;
    }

    const oldPageSize = this.pageSize;
    this.pageSize = pageSize;

    // Maintain current position
    const currentFirstRow = this.currentPage * oldPageSize;
    this.currentPage = Math.floor(currentFirstRow / pageSize);

    const totalPages = this.getTotalPages();
    this.currentPage = Math.max(0, Math.min(this.currentPage, totalPages - 1));

    this.updatePagination();

    if (this.options.onPageChange) {
      this.options.onPageChange(this.currentPage, this.pageSize);
    }
  }

  /**
   * Get current page number
   */
  getCurrentPage(): number {
    return this.currentPage;
  }

  /**
   * Get page size
   */
  getPageSize(): number {
    return this.pageSize;
  }

  /**
   * Get total number of pages
   */
  getTotalPages(): number {
    if (!this.paginator || this.pageSize <= 0) {
      return 0;
    }

    const rowCount = this.dataManager?.getTotalRows() ?? this.options.rowCount;

    if (rowCount <= 0) {
      return 0;
    }

    return Math.ceil(rowCount / this.pageSize);
  }

  /**
   * Update pagination controls
   */
  updatePagination(): void {
    if (!this.paginator) return;

    this.validatePaginationState();

    const totalRows = this.dataManager?.getTotalRows() ?? this.options.rowCount;
    const totalPages = this.getTotalPages();

    const state = {
      currentPage: this.currentPage,
      totalPages: totalPages,
      pageSize: this.pageSize,
      totalRows: totalRows,
      pageSizeOptions: this.options.pagination?.pageSizeOptions ?? [25, 50, 100, 200, 500],
    };

    const handlers = {
      onPageChange: (page: number) => this.goToPage(page),
      onPageSizeChange: (size: number) => this.setPageSize(size),
      onFirstPage: () => this.firstPage(),
      onLastPage: () => this.lastPage(),
      onNextPage: () => this.nextPage(),
      onPreviousPage: () => this.previousPage(),
    };

    const paginationElement = this.paginator.render(state, handlers);

    if (
      this.paginationTop &&
      (this.options.pagination?.position === 'top' || this.options.pagination?.position === 'both')
    ) {
      this.paginationTop.innerHTML = '';
      this.paginationTop.appendChild(paginationElement.cloneNode(true));
    }

    if (
      this.paginationBottom &&
      (this.options.pagination?.position === 'bottom' ||
        this.options.pagination?.position === 'both' ||
        !this.options.pagination?.position)
    ) {
      this.paginationBottom.innerHTML = '';
      this.paginationBottom.appendChild(paginationElement);
    }
  }

  /**
   * Validate pagination state
   */
  private validatePaginationState(): void {
    if (!this.paginator) return;

    const totalPages = this.getTotalPages();

    if (totalPages === 0) {
      this.currentPage = 0;
      return;
    }

    if (this.currentPage >= totalPages) {
      const oldPage = this.currentPage;
      this.currentPage = Math.max(0, totalPages - 1);
      console.warn(
        `Current page ${oldPage} exceeds total pages ${totalPages}. Reset to page ${this.currentPage}`
      );
    }

    if (this.pageSize <= 0) {
      console.error('Invalid page size detected:', this.pageSize);
      this.pageSize = this.options.pagination?.pageSize ?? 100;
    }
  }
}
