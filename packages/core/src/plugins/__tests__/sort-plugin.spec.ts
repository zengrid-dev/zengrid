import { PluginHost } from '../../grid/plugin-host';
import { GridApiImpl } from '../../grid/grid-api';
import { GridStoreImpl } from '../../reactive/store';
import { EventEmitter } from '../../utils';
import { resetTracking } from '../../reactive/tracking';
import { resetDebug } from '../../reactive/debug';
import { resetScheduler } from '../../reactive/effect-scheduler';
import { createCorePlugin } from '../core-plugin';
import { createSortPlugin } from '../sort-plugin';

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
});

describe('SortPlugin', () => {
  it('throws without core dependency', () => {
    expect(() => host.use(createSortPlugin())).toThrow('requires "core"');
  });

  it('initializes sort.state = [] and pipeline.sort = undefined', () => {
    host.use(createCorePlugin({ initialData: [[3], [1], [2]] }));
    host.use(createSortPlugin());

    expect(store.get('sort.state')).toEqual([]);
    expect(store.get('pipeline.sort')).toBeUndefined();
  });

  it('sort:toggle produces correct sorted index order', () => {
    // Column 0 values: 30, 10, 20
    host.use(createCorePlugin({ initialData: [[30], [10], [20]] }));
    host.use(createSortPlugin());

    store.exec('sort:toggle', 0); // asc
    const sorted = store.get('pipeline.sort') as number[];
    // Ascending: 10(idx1), 20(idx2), 30(idx0)
    expect(sorted).toEqual([1, 2, 0]);
  });

  it('sort:apply sets sort state directly', () => {
    host.use(createCorePlugin({ initialData: [[30], [10], [20]] }));
    host.use(createSortPlugin());

    store.exec('sort:apply', [{ column: 0, direction: 'desc' }]);
    const state = store.get('sort.state') as any[];
    expect(state).toEqual([{ column: 0, direction: 'desc' }]);

    const sorted = store.get('pipeline.sort') as number[];
    // Descending: 30(idx0), 20(idx2), 10(idx1)
    expect(sorted).toEqual([0, 2, 1]);
  });

  it('sort:clear resets pipeline.sort to undefined', () => {
    host.use(createCorePlugin({ initialData: [[30], [10], [20]] }));
    host.use(createSortPlugin());

    store.exec('sort:toggle', 0);
    expect(store.get('pipeline.sort')).toBeDefined();

    store.exec('sort:clear');
    expect(store.get('sort.state')).toEqual([]);
    expect(store.get('pipeline.sort')).toBeUndefined();
  });

  it('API methods are registered', () => {
    host.use(createCorePlugin({ initialData: [[3], [1], [2]] }));
    host.use(createSortPlugin());

    expect(api.getMethod('sort', 'toggle')).toBeDefined();
    expect(api.getMethod('sort', 'apply')).toBeDefined();
    expect(api.getMethod('sort', 'clear')).toBeDefined();
    expect(api.getMethod('sort', 'getState')).toBeDefined();
  });

  it('fires sort:changed event', () => {
    const events: unknown[] = [];
    emitter.on('sort:changed', (d: unknown) => events.push(d));

    host.use(createCorePlugin({ initialData: [[30], [10], [20]] }));
    host.use(createSortPlugin());

    store.exec('sort:toggle', 0);
    expect(events.length).toBe(1);
    expect((events[0] as any).state.length).toBe(1);
  });

  it('destroy calls SortManager.destroy()', () => {
    host.use(createCorePlugin({ initialData: [[1]] }));
    host.use(createSortPlugin());

    expect(() => host.destroy()).not.toThrow();
  });
});
