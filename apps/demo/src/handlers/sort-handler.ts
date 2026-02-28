import { Grid } from '../../../../packages/core/src/grid/index';
import { ROW_COUNT, COL_COUNT } from '../config/constants';
import { generateData } from '../data/generators';

export interface SortHandlerContext {
  data: any[][];
  sortMode: 'frontend' | 'backend';
  getGrid: () => Grid;
  setData: (newData: any[][]) => void;
}

/**
 * Create sort handler factory function
 */
export function createSortHandler(context: SortHandlerContext) {
  return async function handleSortRequest(sortState: any[]): Promise<void> {
    if (context.sortMode !== 'backend') return;

    if (sortState.length === 0) {
      const newData = generateData(ROW_COUNT, COL_COUNT);
      context.setData(newData);
      const grid = context.getGrid();
      grid.setData(newData);
      grid.refresh();
      return;
    }

    const { column, direction } = sortState[0];

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const sortedData = [...context.data].sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];

      if (aVal === bVal) return 0;

      let result = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        result = aVal - bVal;
      } else {
        result = String(aVal).localeCompare(String(bVal));
      }

      return direction === 'asc' ? result : -result;
    });

    context.setData(sortedData);
    const grid = context.getGrid();
    grid.setData(sortedData);
    grid.refresh();
  };
}
