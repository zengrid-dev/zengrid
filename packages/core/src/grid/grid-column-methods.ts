import type { ColumnStateSnapshot, GridStateSnapshot, SortState, FilterModel } from '../types';
import type { ColumnConstraints } from '../features/column-resize';
import type { GridContext } from './grid-context';
import {
  getColumnState,
  applyColumnState,
  getStateSnapshot,
  applyStateSnapshot,
} from './grid-state';

export function createColumnMethods(ctx: GridContext) {
  return {
    // --- Column Resize ---

    attachColumnResize(headerElement: HTMLElement): void {
      ctx.resizeOps.attachColumnResize(headerElement);
    },

    detachColumnResize(): void {
      ctx.resizeOps.detachColumnResize();
    },

    resizeColumn(col: number, width: number): void {
      ctx.resizeOps.resizeColumn(col, width);
    },

    autoFitColumn(col: number): void {
      ctx.resizeOps.autoFitColumn(col);
    },

    autoFitAllColumns(): void {
      ctx.resizeOps.autoFitAllColumns();
    },

    setColumnConstraints(col: number, constraints: ColumnConstraints): void {
      ctx.resizeOps.setColumnConstraints(col, constraints);
    },

    updateColumnResizeHandles(): void {
      ctx.resizeOps.updateColumnResizeHandles();
    },

    // --- Column Drag ---

    attachColumnDrag(headerElement: HTMLElement): void {
      ctx.dragOps.attachColumnDrag(headerElement);
    },

    detachColumnDrag(): void {
      ctx.dragOps.detachColumnDrag();
    },

    isDragging(): boolean {
      return ctx.dragOps.isDragging();
    },

    // --- State Persistence ---

    getColumnState(): ColumnStateSnapshot[] {
      return getColumnState(ctx.columnModel);
    },

    applyColumnState(
      state: ColumnStateSnapshot[],
      options?: { applyWidth?: boolean; applyVisibility?: boolean; applyOrder?: boolean }
    ): void {
      applyColumnState(ctx.columnModel, state, options);
    },

    getStateSnapshot(
      sortMethods: { getSortState(): SortState[]; setSortState(s: SortState[]): void },
      filterMethods: { getFilterState(): FilterModel[]; setFilterState(m: FilterModel[]): void }
    ): GridStateSnapshot {
      return getStateSnapshot(ctx.columnModel, {
        getSortState: () => sortMethods.getSortState(),
        getFilterState: () => filterMethods.getFilterState(),
        setSortState: (s) => sortMethods.setSortState(s),
        setFilterState: (m) => filterMethods.setFilterState(m),
      });
    },

    applyStateSnapshot(
      snapshot: GridStateSnapshot,
      sortMethods: { getSortState(): SortState[]; setSortState(s: SortState[]): void },
      filterMethods: { getFilterState(): FilterModel[]; setFilterState(m: FilterModel[]): void }
    ): void {
      applyStateSnapshot(ctx.columnModel, snapshot, {
        getSortState: () => sortMethods.getSortState(),
        getFilterState: () => filterMethods.getFilterState(),
        setSortState: (s) => sortMethods.setSortState(s),
        setFilterState: (m) => filterMethods.setFilterState(m),
      });
    },
  };
}

export type ColumnMethods = ReturnType<typeof createColumnMethods>;
