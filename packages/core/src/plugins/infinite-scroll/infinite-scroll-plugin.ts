import type { GridPlugin, PluginDisposable } from '../../reactive/types';
import type { ViewportModel } from '../../features/viewport/viewport-model';
import type { ViewportEvent } from '../../features/viewport/types';
import type { VirtualScroller } from '../../rendering/virtual-scroller';
export interface InfiniteScrollDOM {
  updateCanvasSize(width: number, height: number): void;
}

export interface InfiniteScrollPluginOptions {
  enabled: boolean;
  threshold?: number;
  enableSlidingWindow?: boolean;
  windowSize?: number;
  pruneThreshold?: number;
  onLoadMoreRows: (currentRowCount: number) => Promise<any[][]>;
  onDataPruned?: (rowsRemoved: number, virtualOffset: number) => void;
  getViewportModel: () => ViewportModel;
  getScroller: () => VirtualScroller | null;
  getDOM: () => InfiniteScrollDOM | null;
  setData: (data: any[][]) => void;
  refresh: () => void;
  getState: () => { data: any[][]; rowCount: number };
  setRowCount: (count: number) => void;
}

export function createInfiniteScrollPlugin(options: InfiniteScrollPluginOptions): GridPlugin {
  return {
    name: 'infinite-scroll',
    phase: 130,
    dependencies: ['core'],
    setup(store, api): PluginDisposable {
      let isLoadingMoreRows = false;
      let hasMoreRows = true;
      let virtualRowOffset = 0;
      let actualRowCount = 0;
      let viewportSubscription: (() => void) | null = null;

      store.extend('infiniteScroll.loading', false, 'infinite-scroll');
      store.extend(
        'infiniteScroll.stats',
        {
          virtualOffset: 0,
          rowsInMemory: 0,
          totalRowsLoaded: 0,
          prunedRows: 0,
        },
        'infinite-scroll'
      );

      function updateStats(): void {
        const state = options.getState();
        store.set('infiniteScroll.stats', {
          virtualOffset: virtualRowOffset,
          rowsInMemory: state.data.length,
          totalRowsLoaded: actualRowCount,
          prunedRows: virtualRowOffset,
        });
      }

      async function loadMoreRows(): Promise<void> {
        if (!options.onLoadMoreRows || isLoadingMoreRows) return;

        isLoadingMoreRows = true;
        store.set('infiniteScroll.loading', true);

        try {
          const state = options.getState();
          const currentRowCount = state.rowCount;
          const newRows = await options.onLoadMoreRows(currentRowCount);

          if (!newRows || newRows.length === 0) {
            hasMoreRows = false;
            return;
          }

          const currentData = state.data;
          let updatedData = [...currentData, ...newRows];
          actualRowCount += newRows.length;

          // Sliding Window: Prune old rows if enabled
          if (options.enableSlidingWindow) {
            const windowSize = options.windowSize ?? 1000;
            const pruneThreshold = options.pruneThreshold ?? windowSize + 200;

            if (updatedData.length > pruneThreshold) {
              const rowsToRemove = updatedData.length - windowSize;
              updatedData = updatedData.slice(rowsToRemove);
              virtualRowOffset += rowsToRemove;

              if (options.onDataPruned) {
                options.onDataPruned(rowsToRemove, virtualRowOffset);
              }
            }
          }

          options.setRowCount(updatedData.length);
          options.setData(updatedData);

          const scroller = options.getScroller();
          if (scroller) {
            scroller.setRowCount(updatedData.length);
            const dom = options.getDOM();
            if (dom) dom.updateCanvasSize(scroller.getTotalWidth(), scroller.getTotalHeight());
          }

          options.refresh();
          updateStats();
        } catch (error) {
          console.error('Error loading more rows:', error);
          hasMoreRows = false;
        } finally {
          isLoadingMoreRows = false;
          store.set('infiniteScroll.loading', false);
        }
      }

      store.action(
        'infiniteScroll:init',
        (dataLength: number) => {
          if (actualRowCount === 0) {
            actualRowCount = dataLength;
            updateStats();
          }
        },
        'infinite-scroll'
      );

      store.action(
        'infiniteScroll:setup',
        () => {
          if (!options.enabled || !options.onLoadMoreRows) return;

          const threshold = options.threshold ?? 20;
          const viewportModel = options.getViewportModel();

          viewportSubscription = viewportModel.subscribe({
            onChange: (event: ViewportEvent) => {
              if (event.type !== 'rows' && event.type !== 'range') return;

              const { newRange } = event;
              const state = options.getState();
              const isNearBottom = newRange.endRow >= state.rowCount - threshold;

              if (isNearBottom && !isLoadingMoreRows && hasMoreRows) {
                loadMoreRows();
              }
            },
          });
        },
        'infinite-scroll'
      );

      store.action(
        'infiniteScroll:reset',
        () => {
          isLoadingMoreRows = false;
          hasMoreRows = true;
          virtualRowOffset = 0;
          actualRowCount = 0;
          updateStats();
        },
        'infinite-scroll'
      );

      api.register('infiniteScroll', {
        getStats: () => store.get('infiniteScroll.stats'),
        isLoading: () => store.get('infiniteScroll.loading'),
        reset: () => store.exec('infiniteScroll:reset'),
      });

      return {
        teardown: [
          () => {
            if (viewportSubscription) {
              viewportSubscription();
              viewportSubscription = null;
            }
          },
        ],
      };
    },
  };
}
