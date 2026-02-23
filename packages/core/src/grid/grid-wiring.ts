import type { SortState, FilterModel } from '../types';
import { ColumnModel } from '../features/columns/column-model';
import { HeaderManager } from './header-manager';
import { GridEditing } from './grid-editing';
import { createFilterUIPlugin } from '../plugins/filter-ui';
import { createInfiniteScrollPlugin } from '../plugins/infinite-scroll';
import type { GridContext } from './grid-context';

export function setupColumnModel(
  ctx: GridContext,
  callbacks: { toggleSort: (col: number) => void }
): void {
  if (!ctx.options.columns || ctx.options.columns.length === 0) return;

  ctx.columnModel = new ColumnModel(ctx.options.columns);
  ctx.resizeOps.setColumnModel(ctx.columnModel);
  ctx.dragOps.setColumnModel(ctx.columnModel);

  ctx.columnModel.subscribeAll({
    onChange: (event) => {
      if (event.type === 'width' || event.type === 'reorder' || event.type === 'visibility') {
        if (event.type === 'visibility' && ctx.init.scroller) {
          const visibleCount = ctx.columnModel?.getVisibleCount() ?? ctx.options.colCount;
          ctx.scrollOps.updateVisibleColumnCount(visibleCount);
        }
        if (ctx.init.scroller) {
          ctx.dom.updateCanvasSize(
            ctx.init.scroller.getTotalWidth(),
            ctx.init.scroller.getTotalHeight()
          );
        }
        if (ctx.init.positioner) ctx.init.positioner.refresh();
        if (event.type === 'reorder' || event.type === 'visibility')
          ctx.resizeOps.updateColumnResizeHandles();
      }
    },
  });

  const headerContainer = ctx.dom.createHeaderContainer();
  if (!headerContainer) return;

  ctx.headerManager = new HeaderManager({
    columnModel: ctx.columnModel,
    container: headerContainer,
    eventEmitter: ctx.events,
    getSortState: () =>
      (ctx.pluginHost.has('sort') ? ctx.store.get('sort.state') : []) as SortState[],
    getFilterState: () =>
      (ctx.pluginHost.has('filter') ? ctx.store.get('filter.state') : []) as FilterModel[],
    headerHeight: 40,
    enableScrollSync: true,
  });
  ctx.headerManager.initialize();
  ctx.resizeOps.setHeaderManager(ctx.headerManager);

  ctx.events.on('header:sort:click', (event) => {
    let dataCol = event.columnIndex;
    if (ctx.columnModel) {
      const orderedColumns = ctx.columnModel.getVisibleColumnsInOrder();
      if (orderedColumns[event.columnIndex]) dataCol = orderedColumns[event.columnIndex].dataIndex;
    }
    callbacks.toggleSort(dataCol);
  });

  ctx.events.on('header:checkbox:change', (event) => {
    if (!ctx.pluginHost.has('selection')) return;
    if (event.action === 'select-all') ctx.store.exec('selection:selectAll', ctx.options.rowCount);
    else ctx.store.exec('selection:clear');
  });

  if (ctx.pluginHost.has('filter') && !ctx.pluginHost.has('filter-ui')) {
    ctx.pluginHost.use(
      createFilterUIPlugin({
        getColumnDef: (dataCol) => ctx.options.columns?.[dataCol],
        getColumnModel: () => ctx.columnModel,
        getContainer: () => ctx.container,
      })
    );
    ctx.store.exec('filterUI:attach', ctx.container, ctx.events);
  }
}

export function setupEditing(ctx: GridContext): void {
  ctx.editingOps = new GridEditing(
    ctx.container,
    ctx.scrollContainer,
    ctx.options,
    ctx.state,
    ctx.events,
    {
      getValue: (row: number, col: number) => {
        let dataCol = col;
        if (ctx.columnModel) {
          const orderedColumns = ctx.columnModel.getVisibleColumnsInOrder();
          if (orderedColumns[col]) dataCol = orderedColumns[col].dataIndex;
        }
        return ctx.dataOps.dataAccessor?.getValue(row, dataCol);
      },
      setValue: (row: number, col: number, value: any) => {
        let dataCol = col;
        if (ctx.columnModel) {
          const orderedColumns = ctx.columnModel.getVisibleColumnsInOrder();
          if (orderedColumns[col]) dataCol = orderedColumns[col].dataIndex;
        }
        if (ctx.state.data && ctx.state.data[row]) ctx.state.data[row][dataCol] = value;
      },
      getColumn: (col: number) => {
        if (ctx.columnModel) {
          const orderedColumns = ctx.columnModel.getVisibleColumnsInOrder();
          if (orderedColumns[col]) return orderedColumns[col].definition;
        }
        return ctx.options.columns?.[col];
      },
      getCellElement: (row: number, col: number) => {
        const cellsContainer = ctx.canvas?.querySelector('.zg-cells') as HTMLElement;
        if (!cellsContainer) return null;
        return cellsContainer.querySelector(
          `.zg-cell[data-row="${row}"][data-col="${col}"]`
        ) as HTMLElement;
      },
      getPositioner: () => ctx.init.positioner,
    }
  );
  ctx.editingOps.initialize();
  if (ctx.pluginHost.has('editing') && ctx.editingOps.getEditorManager()) {
    ctx.store.exec('editing:bind', ctx.editingOps.getEditorManager());
  }
}

export function setupSelection(ctx: GridContext): void {
  if (ctx.pluginHost.has('selection') && ctx.scrollContainer) {
    ctx.store.exec('selection:attach', {
      container: ctx.scrollContainer,
      selectionType: ctx.options.selectionType ?? 'cell',
      enableMultiSelection: !!ctx.options.enableMultiSelection,
      rowCount: () => ctx.options.rowCount,
      getDataValue: (row: number, col: number) => ctx.dataOps.dataAccessor?.getValue(row, col),
      getViewIndices: () => ctx.store.get('rows.viewIndices') as number[] | undefined,
      onCellClick: ctx.options.onCellClick,
      onCellDoubleClick: ctx.options.onCellDoubleClick,
      onCellContextMenu: ctx.options.onCellContextMenu,
    });
  }
  if (ctx.pluginHost.has('selection')) {
    ctx.events.on('selection:change', (payload: any) => {
      ctx.state.selection = payload.ranges ?? [];
      if (ctx.options.onSelectionChange) ctx.options.onSelectionChange(ctx.state.selection);
      updateHeaderCheckbox(ctx);
      ctx.refresh();
    });
  }
  ctx.events.on('filter:changed' as any, () => {
    if (ctx.pluginHost.has('selection') && ctx.state.selection.length > 0)
      ctx.store.exec('selection:clear');
  });
}

export function setupBridgeEvents(ctx: GridContext): void {
  ctx.events.on('scroll', (payload) => {
    if (ctx.pluginHost.has('viewport') && payload.visibleRange) {
      ctx.store.exec('viewport:updateRange', payload.visibleRange);
    }
  });
  ctx.events.on('viewport:resized' as any, () => {
    if (ctx.init.scroller && ctx.scrollContainer) {
      ctx.scrollOps.updateScroller();
      ctx.dom.updateCanvasSize(
        ctx.init.scroller.getTotalWidth(),
        ctx.init.scroller.getTotalHeight()
      );
      ctx.refresh();
      if (ctx.pluginHost.has('viewport')) {
        const visibleRange = ctx.init.scroller.calculateVisibleRange(
          ctx.state.scrollPosition.top,
          ctx.state.scrollPosition.left
        );
        ctx.store.exec('viewport:updateRange', visibleRange);
      }
    }
  });
}

export function setupInfiniteScroll(
  ctx: GridContext,
  callbacks: { setData: (data: any[][]) => void }
): void {
  if (!ctx.options.infiniteScrolling?.enabled || !ctx.options.onLoadMoreRows) return;
  const cfg = ctx.options.infiniteScrolling;
  ctx.pluginHost.use(
    createInfiniteScrollPlugin({
      enabled: true,
      threshold: cfg.threshold,
      enableSlidingWindow: cfg.enableSlidingWindow,
      windowSize: cfg.windowSize,
      pruneThreshold: cfg.pruneThreshold,
      onLoadMoreRows: ctx.options.onLoadMoreRows,
      onDataPruned: cfg.onDataPruned,
      getViewportModel: () => ctx.viewportModel,
      getScroller: () => ctx.init.scroller,
      getDOM: () => ctx.dom,
      setData: (data: any[][]) => callbacks.setData(data),
      refresh: () => ctx.refresh(),
      getState: () => ({ data: ctx.state.data, rowCount: ctx.options.rowCount }),
      setRowCount: (count: number) => {
        ctx.options.rowCount = count;
      },
    })
  );
}

function updateHeaderCheckbox(ctx: GridContext): void {
  const checkbox = ctx.container.querySelector(
    '.zg-header-checkbox-input'
  ) as HTMLInputElement | null;
  if (!checkbox) return;
  if (ctx.options.selectionType && ctx.options.selectionType !== 'row') {
    checkbox.indeterminate = false;
    checkbox.checked = false;
    return;
  }
  const rowCount = ctx.options.rowCount;
  const hasSelection = ctx.state.selection.length > 0;
  const hasFullRange = ctx.state.selection.some(
    (range) => range.startRow <= 0 && range.endRow >= rowCount - 1
  );
  checkbox.checked = hasFullRange;
  checkbox.indeterminate = hasSelection && !hasFullRange;
}
