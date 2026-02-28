import { Grid } from '../../../../../packages/core/src/grid/index';
import { FilterPanel } from './filter-panel';
import { applyFilters, clearFilters, updateFilterExports } from './filter-logic';

export function setupFilterUI(grid: Grid, columns: any[]): FilterPanel {
  const filterPanel = new FilterPanel(columns);
  filterPanel.setup();

  const btnApplyFilters = document.getElementById('btn-apply-filters')!;
  const btnClearFilters = document.getElementById('btn-clear-filters')!;

  // Apply filters button
  btnApplyFilters.addEventListener('click', () => {
    applyFilters(filterPanel, grid, columns);
  });

  // Clear filters button
  btnClearFilters.addEventListener('click', () => {
    clearFilters(grid, filterPanel);
  });

  // Listen to filter:export event
  grid.on('filter:export', (event) => {
    updateFilterExports(event);
  });

  return filterPanel;
}

export { FilterPanel } from './filter-panel';
export * from './filter-logic';
