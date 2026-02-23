import { PluginHost } from '../../grid/plugin-host';
import { GridApiImpl } from '../../grid/grid-api';
import { GridStoreImpl } from '../../reactive/store';
import { EventEmitter } from '../../utils';
import { resetTracking } from '../../reactive/tracking';
import { resetDebug } from '../../reactive/debug';
import { resetScheduler, flushEffects } from '../../reactive/effect-scheduler';
import { createCorePlugin } from '../core-plugin';
import { createAsyncFilterPlugin } from '../async-filter-plugin';
import { createAsyncSortPlugin } from '../async-sort-plugin';
import type { AsyncState } from '../../reactive/types';

let store: GridStoreImpl;
let emitter: EventEmitter;
let api: GridApiImpl;
let host: PluginHost;

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  resetTracking();
  resetDebug();
  resetScheduler();
  store = new GridStoreImpl();
  emitter = new EventEmitter();
  api = new GridApiImpl(store, emitter);
  host = new PluginHost(store, api);
});

afterEach(() => {
  host.destroy();
});

describe('AsyncFilterPlugin', () => {
  it('throws without core dependency', () => {
    expect(() => host.use(createAsyncFilterPlugin())).toThrow('requires "core"');
  });

  it('initializes filter.state = [] and pipeline.filter = undefined', () => {
    host.use(createCorePlugin({ initialData: [[10], [20], [30]] }));
    host.use(createAsyncFilterPlugin({ colCount: 1 }));

    expect(store.get('filter.state')).toEqual([]);
    expect(store.get('pipeline.filter')).toBeUndefined();
  });

  it('filters data asynchronously in chunks', async () => {
    host.use(createCorePlugin({ initialData: [[10], [20], [30], [40], [50]] }));
    host.use(createAsyncFilterPlugin({ colCount: 1 }));

    store.exec('filter:setColumn', 0, [{ operator: 'greaterThan', value: 25 }]);
    flushEffects();
    await flushMicrotasks();

    const filtered = store.get('pipeline.filter') as number[];
    expect(filtered).toEqual([2, 3, 4]);
  });

  it('composes with async sort (reads sort output)', async () => {
    host.use(createCorePlugin({ initialData: [[50], [10], [40], [20], [30]] }));
    host.use(createAsyncSortPlugin());
    host.use(createAsyncFilterPlugin({ colCount: 1 }));

    // Sort ascending: 10(1), 20(3), 30(4), 40(2), 50(0)
    store.exec('sort:toggle', 0);
    flushEffects();
    await flushMicrotasks();

    const sorted = store.get('pipeline.sort') as number[];
    expect(sorted).toEqual([1, 3, 4, 2, 0]);

    // Filter: value > 25 → raw indices 0(50), 2(40), 4(30)
    // In sorted order: 4(30), 2(40), 0(50)
    store.exec('filter:setColumn', 0, [{ operator: 'greaterThan', value: 25 }]);
    flushEffects();
    await flushMicrotasks();
    // May need an extra tick for the filter asyncComputed to pick up sort output
    flushEffects();
    await flushMicrotasks();

    const filtered = store.get('pipeline.filter') as number[];
    expect(filtered).toEqual([4, 2, 0]);
  });

  it('shows stale data during re-filter', async () => {
    host.use(createCorePlugin({ initialData: [[10], [20], [30], [40], [50]] }));
    host.use(createAsyncFilterPlugin({ colCount: 1 }));

    store.exec('filter:setColumn', 0, [{ operator: 'greaterThan', value: 25 }]);
    flushEffects();
    await flushMicrotasks();

    expect(store.get('pipeline.filter')).toEqual([2, 3, 4]);

    // Change filter
    store.exec('filter:setColumn', 0, [{ operator: 'greaterThan', value: 35 }]);
    flushEffects();

    const meta = store.get('pipeline.filter.__async') as AsyncState;
    expect(meta.pending).toBe(true);
    expect(meta.stale).toBe(true);

    // Stale value still available
    expect(store.get('pipeline.filter')).toEqual([2, 3, 4]);

    await flushMicrotasks();

    expect(store.get('pipeline.filter')).toEqual([3, 4]);
  });

  it('chunkSize option controls batch size', async () => {
    // Small dataset, tiny chunk size to exercise chunking
    host.use(createCorePlugin({ initialData: [[10], [20], [30], [40], [50]] }));
    host.use(createAsyncFilterPlugin({ colCount: 1, chunkSize: 2 }));

    store.exec('filter:setColumn', 0, [{ operator: 'greaterThan', value: 25 }]);
    flushEffects();

    // With chunkSize=2 and 5 items, processInChunks yields between chunks
    // Need extra microtask ticks for the yields
    await flushMicrotasks();
    await flushMicrotasks();
    await flushMicrotasks();

    const filtered = store.get('pipeline.filter') as number[];
    expect(filtered).toEqual([2, 3, 4]);
  });

  it('filter:clear triggers asyncComputed to return undefined', async () => {
    host.use(createCorePlugin({ initialData: [[10], [20], [30]] }));
    host.use(createAsyncFilterPlugin({ colCount: 1 }));

    store.exec('filter:setColumn', 0, [{ operator: 'greaterThan', value: 15 }]);
    flushEffects();
    await flushMicrotasks();
    expect(store.get('pipeline.filter')).toBeDefined();

    store.exec('filter:clear');
    flushEffects();
    await flushMicrotasks();

    expect(store.get('pipeline.filter')).toBeUndefined();
    expect(store.get('filter.state')).toEqual([]);
  });

  it('API methods are registered', () => {
    host.use(createCorePlugin({ initialData: [[1]] }));
    host.use(createAsyncFilterPlugin({ colCount: 1 }));

    expect(api.getMethod('filter', 'setColumnFilter')).toBeDefined();
    expect(api.getMethod('filter', 'clear')).toBeDefined();
    expect(api.getMethod('filter', 'reapply')).toBeDefined();
    expect(api.getMethod('filter', 'getState')).toBeDefined();
    expect(api.getMethod('filter', 'hasActiveFilters')).toBeDefined();
    expect(api.getMethod('filter', 'getAsyncState')).toBeDefined();
    expect(api.getMethod('filter', 'isPending')).toBeDefined();
  });

  it('fires filter:changed event', async () => {
    const events: unknown[] = [];
    emitter.on('filter:changed', (d: unknown) => events.push(d));

    host.use(createCorePlugin({ initialData: [[10], [20], [30]] }));
    host.use(createAsyncFilterPlugin({ colCount: 1 }));

    store.exec('filter:setColumn', 0, [{ operator: 'greaterThan', value: 15 }]);
    expect(events.length).toBe(1);
  });

  it('destroy cleans up without error', () => {
    host.use(createCorePlugin({ initialData: [[1]] }));
    host.use(createAsyncFilterPlugin({ colCount: 1 }));

    expect(() => host.destroy()).not.toThrow();
  });
});
