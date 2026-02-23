import type { GridPlugin } from '../../reactive/types';

export function createViewportPlugin(): GridPlugin {
  return {
    name: 'viewport',
    phase: 110,
    dependencies: ['scroll'],
    setup(store, api) {
      store.extend('viewport.visibleRows', { start: 0, end: 0 }, 'viewport', 110);
      store.extend('viewport.visibleCols', { start: 0, end: 0 }, 'viewport', 110);

      store.action(
        'viewport:updateRange',
        (range: { startRow: number; endRow: number; startCol: number; endCol: number }) => {
          store.set('viewport.visibleRows', { start: range.startRow, end: range.endRow });
          store.set('viewport.visibleCols', { start: range.startCol, end: range.endCol });
        },
        'viewport'
      );

      api.register('viewport', {
        getVisibleRows: () => store.get('viewport.visibleRows'),
        getVisibleCols: () => store.get('viewport.visibleCols'),
        getRange: () => {
          const rows = store.get('viewport.visibleRows') as { start: number; end: number };
          const cols = store.get('viewport.visibleCols') as { start: number; end: number };
          return { startRow: rows.start, endRow: rows.end, startCol: cols.start, endCol: cols.end };
        },
        updateRange: (range: any) => store.exec('viewport:updateRange', range),
      });
    },
  };
}
