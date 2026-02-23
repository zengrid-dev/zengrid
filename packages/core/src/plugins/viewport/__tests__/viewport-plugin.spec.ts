import { PluginHost } from '../../../grid/plugin-host';
import { GridApiImpl } from '../../../grid/grid-api';
import { GridStoreImpl } from '../../../reactive/store';
import { EventEmitter } from '../../../utils';
import { resetTracking } from '../../../reactive/tracking';
import { resetDebug } from '../../../reactive/debug';
import { resetScheduler } from '../../../reactive/effect-scheduler';
import { createScrollPlugin } from '../../scroll';
import { createViewportPlugin } from '../viewport-plugin';

let store: GridStoreImpl;
let emitter: EventEmitter;
let api: GridApiImpl;
let host: PluginHost;

beforeEach(() => {
  resetTracking();
  resetDebug();
  resetScheduler();
  store = new GridStoreImpl();
  emitter = new EventEmitter();
  api = new GridApiImpl(store, emitter);
  host = new PluginHost(store, api);
  // Viewport depends on scroll
  host.use(createScrollPlugin());
});

describe('ViewportPlugin', () => {
  it('extends store with viewport.visibleRows and viewport.visibleCols', () => {
    host.use(createViewportPlugin());

    expect(store.get('viewport.visibleRows')).toEqual({ start: 0, end: 0 });
    expect(store.get('viewport.visibleCols')).toEqual({ start: 0, end: 0 });
  });

  it('viewport:updateRange updates both signals', () => {
    host.use(createViewportPlugin());

    store.exec('viewport:updateRange', {
      startRow: 5,
      endRow: 25,
      startCol: 2,
      endCol: 8,
    });

    expect(store.get('viewport.visibleRows')).toEqual({ start: 5, end: 25 });
    expect(store.get('viewport.visibleCols')).toEqual({ start: 2, end: 8 });
  });

  it('API getRange returns combined range', () => {
    host.use(createViewportPlugin());

    store.exec('viewport:updateRange', {
      startRow: 10,
      endRow: 30,
      startCol: 1,
      endCol: 5,
    });

    const getRange = api.getMethod('viewport', 'getRange') as Function;
    expect(getRange()).toEqual({
      startRow: 10,
      endRow: 30,
      startCol: 1,
      endCol: 5,
    });
  });

  it('API getVisibleRows returns row range', () => {
    host.use(createViewportPlugin());

    store.exec('viewport:updateRange', {
      startRow: 3,
      endRow: 15,
      startCol: 0,
      endCol: 4,
    });

    const getVisibleRows = api.getMethod('viewport', 'getVisibleRows') as Function;
    expect(getVisibleRows()).toEqual({ start: 3, end: 15 });
  });

  it('API getVisibleCols returns col range', () => {
    host.use(createViewportPlugin());

    store.exec('viewport:updateRange', {
      startRow: 0,
      endRow: 10,
      startCol: 2,
      endCol: 7,
    });

    const getVisibleCols = api.getMethod('viewport', 'getVisibleCols') as Function;
    expect(getVisibleCols()).toEqual({ start: 2, end: 7 });
  });

  it('requires scroll plugin dependency', () => {
    const freshStore = new GridStoreImpl();
    const freshEmitter = new EventEmitter();
    const freshApi = new GridApiImpl(freshStore, freshEmitter);
    const freshHost = new PluginHost(freshStore, freshApi);

    expect(() => freshHost.use(createViewportPlugin())).toThrow(/scroll/);
  });
});
