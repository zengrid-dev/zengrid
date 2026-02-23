import type { CellRef } from '../types';
import type { GridContext } from './grid-context';

export function createLifecycleMethods(ctx: GridContext) {
  return {
    setData(data: any[][]): void {
      ctx.dataOps.setData(data);
      ctx.store.exec('core:setData', data);
      if (ctx.pluginHost.has('infinite-scroll')) ctx.store.exec('infiniteScroll:init', data.length);
      if (ctx.pluginHost.has('filter'))
        ctx.store.exec('filter:init', ctx.options.colCount, ctx.dataOps.dataAccessor);
      if (ctx.pluginHost.has('sort'))
        ctx.store.exec('sort:init', data.length, ctx.dataOps.dataAccessor);
      ctx.scrollOps.updateReferences(
        ctx.scrollOps.getScroller(),
        ctx.scrollOps.getPositioner(),
        ctx.dataOps.dataAccessor
      );
      ctx.resizeOps.updateScroller(ctx.scrollOps.getScroller());
    },

    render(): void {
      if (ctx.isDestroyed) throw new Error('Cannot render destroyed grid');

      if (!ctx.init.scroller || !ctx.init.pool || !ctx.init.positioner) {
        ctx.init.initializeComponents();
        ctx.scrollOps.updateReferences(
          ctx.init.scroller,
          ctx.init.positioner,
          ctx.dataOps.dataAccessor
        );
        ctx.resizeOps.updateScroller(ctx.init.scroller);
        if (ctx.init.scroller)
          ctx.init.scroller.setReactiveModels(ctx.scrollModel, ctx.viewportModel);
        if (ctx.init.positioner) ctx.init.positioner.subscribeToViewport(ctx.viewportModel);
        if (ctx.scrollContainer && ctx.pluginHost.has('scroll'))
          ctx.store.exec('scroll:attach', ctx.scrollContainer);
        if (ctx.scrollContainer && ctx.pluginHost.has('resize'))
          ctx.store.exec('resize:attach', ctx.scrollContainer);
        if (ctx.pluginHost.has('infinite-scroll')) ctx.store.exec('infiniteScroll:setup');
        if (ctx.options.columnResize) ctx.resizeOps.initializeColumnResize();
        if (ctx.options.enableColumnDrag !== false && ctx.columnModel)
          ctx.dragOps.initializeColumnDrag();
      }

      if (!ctx.init.scroller || !ctx.init.pool || !ctx.init.positioner) {
        throw new Error('Grid initialization failed. Viewport may have no dimensions.');
      }

      ctx.dom.updateCanvasSize(
        ctx.init.scroller.getTotalWidth(),
        ctx.init.scroller.getTotalHeight()
      );

      if (ctx.headerManager) {
        ctx.headerManager.renderHeaders();
        if (ctx.options.columnResize) {
          const hc = ctx.headerManager.getHeaderCellsContainer();
          if (hc) ctx.resizeOps.attachColumnResize(hc);
        }
        if (ctx.options.enableColumnDrag !== false && ctx.columnModel) {
          const hc = ctx.headerManager.getHeaderCellsContainer();
          if (hc) ctx.dragOps.attachColumnDrag(hc);
        }
      }

      ctx.init.positioner.renderVisibleCells(
        ctx.state.scrollPosition.top,
        ctx.state.scrollPosition.left
      );

      if (ctx.options.columnResize?.autoFitOnLoad) ctx.resizeOps.autoFitAllColumns();

      if (ctx.init.scroller && ctx.pluginHost.has('viewport')) {
        const initialRange = ctx.init.scroller.calculateVisibleRange(
          ctx.state.scrollPosition.top,
          ctx.state.scrollPosition.left
        );
        ctx.store.exec('viewport:updateRange', initialRange);
      }
    },

    updateCells(cells: CellRef[]): void {
      if (!ctx.init.positioner) return;
      ctx.init.positioner.updateCells(cells);
    },

    destroy(): void {
      if (ctx.isDestroyed) return;
      ctx.pluginHost.destroy();
      ctx.scrollOps.destroy();
      if (ctx.scrollContainer)
        ctx.scrollContainer.removeEventListener('scroll', ctx.scrollOps.handleScroll);
      if (ctx.init.positioner) ctx.init.positioner.destroy();
      if (ctx.init.pool) ctx.init.pool.clear();
      ctx.resizeOps.detachColumnResize();
      ctx.dragOps.detachColumnDrag();
      ctx.dragOps.destroy();
      if (ctx.headerManager) {
        ctx.headerManager.cleanup();
        ctx.headerManager = null;
      }
      if (ctx.editingOps) {
        ctx.editingOps.cleanup();
        ctx.editingOps = null;
      }
      ctx.resizeOps.destroy();
      ctx.container.innerHTML = '';
      ctx.container.classList.remove('zg-grid');
      ctx.canvas = null;
      ctx.scrollContainer = null;
      ctx.state.data = [];
      ctx.state.selection = [];
      ctx.isDestroyed = true;
    },
  };
}

export type LifecycleMethods = ReturnType<typeof createLifecycleMethods>;
