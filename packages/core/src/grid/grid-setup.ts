import type { GridOptions, GridState } from '../types';
import { EventEmitter } from '../events/event-emitter';
import type { GridEvents } from '../events/grid-events';
import { GridDOM } from './dom';
import { GridPagination } from './pagination';
import { GridData } from './data';
import { GridScroll } from './scroll';
import { GridResize } from './resize';
import { GridDrag } from './drag';
import { GridInit } from './init';
import { ScrollModel } from '../features/viewport/scroll-model';
import { ViewportModel } from '../features/viewport/viewport-model';
import { GridStoreImpl } from '../reactive/store';
import { PipelineRegistry } from '../reactive/pipeline';
import { GridApiImpl } from './grid-api';
import { PluginHost } from './plugin-host';
import { createCorePlugin } from '../plugins/core-plugin';
import { createSortPlugin } from '../plugins/sort-plugin';
import { createFilterPlugin } from '../plugins/filter-plugin';
import { createScrollPlugin } from '../plugins/scroll';
import { createViewportPlugin } from '../plugins/viewport';
import { createResizePlugin } from '../plugins/resize';
import { createSelectionPlugin } from '../plugins/selection';
import { createEditingPlugin } from '../plugins/editing';
import { createUndoRedoPlugin } from '../plugins/undo-redo';
import { createLegacyApiPlugin } from '../plugins/legacy-bridge';
import type { GridContext } from './grid-context';

export function createGridContext(container: HTMLElement, options: GridOptions): GridContext {
  if (!container) throw new Error('Container element is required');
  container.classList.add('zg-grid');

  if (!options.rowCount || options.rowCount <= 0) options.rowCount = 0;
  if (!options.colCount || options.colCount <= 0) options.colCount = 0;

  const events = new EventEmitter<GridEvents>();
  const state: GridState = {
    data: [],
    selection: [],
    activeCell: null,
    sortState: [],
    filterState: [],
    scrollPosition: { top: 0, left: 0 },
    editingCell: null,
  };

  const store = new GridStoreImpl();
  const gridApi = new GridApiImpl(store, events);
  const pluginHost = new PluginHost(store, gridApi);
  const pipelineRegistry = new PipelineRegistry();
  pipelineRegistry.registerPhase('sort', 10, 'pipeline.sort');
  pipelineRegistry.registerPhase('filter', 20, 'pipeline.filter');

  const dom = new GridDOM(container, options);
  dom.setupDOM();

  const ctx = {
    container,
    options,
    state,
    events,
    store,
    gridApi,
    pluginHost,
    pipelineRegistry,
    dom,
    scrollModel: new ScrollModel(),
    viewportModel: new ViewportModel(),
    canvas: dom.canvas,
    scrollContainer: dom.scrollContainer,
    columnModel: null,
    headerManager: null,
    editingOps: null,
    isDestroyed: false,
  } as GridContext;

  ctx.init = new GridInit(container, options, state, events, dom.scrollContainer, dom.canvas, {
    getViewIndices: () => ctx.store.get('rows.viewIndices') as number[] | undefined,
    getDataAccessor: () => ctx.dataOps.dataAccessor,
    getColumnModel: () => ctx.columnModel,
  });
  ctx.init.setupLoadingListeners();

  ctx.dataOps = new GridData(
    options,
    state,
    events,
    ctx.init.scroller,
    ctx.init.pool,
    ctx.init.cache
  );

  ctx.scrollOps = new GridScroll(
    options,
    state,
    dom.scrollContainer,
    dom.canvas,
    ctx.init.scroller,
    ctx.init.positioner,
    ctx.init.pool,
    ctx.init.registry,
    ctx.init.cache,
    ctx.dataOps.dataAccessor,
    {
      getViewIndices: () => ctx.store.get('rows.viewIndices') as number[] | undefined,
      getColumnModel: () => ctx.columnModel,
      emitEvent: (event: string, payload: any) => ctx.events.emit(event as any, payload),
    }
  );
  if (dom.scrollContainer)
    dom.scrollContainer.addEventListener('scroll', ctx.scrollOps.handleScroll);

  ctx.resizeOps = new GridResize(
    options,
    events,
    ctx.init.scroller,
    ctx.dataOps.dataAccessor,
    dom.scrollContainer,
    {
      updateCanvasSize: () =>
        ctx.dom.updateCanvasSize(
          ctx.scrollOps.getScroller()?.getTotalWidth() ?? 0,
          ctx.scrollOps.getScroller()?.getTotalHeight() ?? 0
        ),
      onRefresh: () => ctx.refresh(),
    }
  );

  ctx.dragOps = new GridDrag(options, events, dom.scrollContainer);
  ctx.pagination = new GridPagination(options, events);

  ctx.clearCache = () => {
    if (ctx.init.cache) ctx.init.cache.clear();
  };
  ctx.refresh = () => {
    if (ctx.init.positioner) ctx.init.positioner.refresh();
  };

  return ctx;
}

export function installPlugins(ctx: GridContext): void {
  ctx.pluginHost.use(createCorePlugin());

  if (ctx.options.sortMode !== 'backend') {
    ctx.pluginHost.use(createSortPlugin({ enableMultiSort: true }));
  }
  if (ctx.options.filterMode !== 'backend') {
    ctx.pluginHost.use(createFilterPlugin({ colCount: ctx.options.colCount }));
  }

  ctx.pluginHost.use(createScrollPlugin());
  ctx.pluginHost.use(createViewportPlugin());
  ctx.pluginHost.use(createResizePlugin({ debounceMs: 150 }));

  if (ctx.options.enableSelection !== false) {
    ctx.pluginHost.use(
      createSelectionPlugin({
        enableMultiSelection: ctx.options.enableMultiSelection,
        selectionType: ctx.options.selectionType,
      })
    );
  }

  ctx.pluginHost.use(createEditingPlugin());
  ctx.pluginHost.use(createUndoRedoPlugin());
  ctx.pluginHost.use(createLegacyApiPlugin());

  ctx.pipelineRegistry.setupCoreComputeds(ctx.store);
}
