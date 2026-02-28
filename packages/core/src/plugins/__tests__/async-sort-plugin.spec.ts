import { PluginHost } from '../../grid/plugin-host';
import { GridApiImpl } from '../../grid/grid-api';
import { GridStoreImpl } from '../../reactive/store';
import { EventEmitter } from '../../utils';
import { resetTracking } from '../../reactive/tracking';
import { resetDebug } from '../../reactive/debug';
import { resetScheduler, flushEffects } from '../../reactive/effect-scheduler';
import { createCorePlugin } from '../core-plugin';
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

describe('AsyncSortPlugin', () => {
  it('throws without core dependency', () => {
    expect(() => host.use(createAsyncSortPlugin())).toThrow('requires "core"');
  });

  it('initializes sort.state = [] and pipeline.sort = undefined', () => {
    host.use(createCorePlugin({ initialData: [[3], [1], [2]] }));
    host.use(createAsyncSortPlugin());

    expect(store.get('sort.state')).toEqual([]);
    expect(store.get('pipeline.sort')).toBeUndefined();
  });

  it('sorts data asynchronously (value appears after await)', async () => {
    host.use(createCorePlugin({ initialData: [[30], [10], [20]] }));
    host.use(createAsyncSortPlugin());

    store.exec('sort:toggle', 0); // asc

    // Immediately after action, pipeline.sort is still computing
    flushEffects();
    await flushMicrotasks();

    const sorted = store.get('pipeline.sort') as number[];
    expect(sorted).toEqual([1, 2, 0]);
  });

  it('shows stale data during re-sort', async () => {
    host.use(createCorePlugin({ initialData: [[30], [10], [20]] }));
    host.use(createAsyncSortPlugin());

    // First sort
    store.exec('sort:toggle', 0); // asc
    flushEffects();
    await flushMicrotasks();

    expect(store.get('pipeline.sort')).toEqual([1, 2, 0]);

    // Trigger re-sort via apply
    store.exec('sort:apply', [{ column: 0, direction: 'desc' }]);
    flushEffects();

    const meta = store.get('pipeline.sort.__async') as AsyncState;
    expect(meta.pending).toBe(true);
    expect(meta.stale).toBe(true);

    // Previous value still available
    expect(store.get('pipeline.sort')).toEqual([1, 2, 0]);

    await flushMicrotasks();

    const sorted = store.get('pipeline.sort') as number[];
    expect(sorted).toEqual([0, 2, 1]);
  });

  it('sort:clear sets sort.state to empty', async () => {
    host.use(createCorePlugin({ initialData: [[30], [10], [20]] }));
    host.use(createAsyncSortPlugin());

    store.exec('sort:toggle', 0);
    flushEffects();
    await flushMicrotasks();

    expect(store.get('pipeline.sort')).toBeDefined();

    store.exec('sort:clear');
    expect(store.get('sort.state')).toEqual([]);

    // After asyncComputed reacts to empty sort.state
    flushEffects();
    await flushMicrotasks();

    expect(store.get('pipeline.sort')).toBeUndefined();
  });

  it('getAsyncState() and isPending() API methods work', async () => {
    host.use(createCorePlugin({ initialData: [[30], [10], [20]] }));
    host.use(createAsyncSortPlugin());

    const getAsyncState = api.getMethod('sort', 'getAsyncState') as () => AsyncState;
    const isPending = api.getMethod('sort', 'isPending') as () => boolean;

    expect(getAsyncState).toBeDefined();
    expect(isPending).toBeDefined();

    store.exec('sort:toggle', 0);
    flushEffects();

    expect(isPending()).toBe(true);

    await flushMicrotasks();

    expect(isPending()).toBe(false);
  });

  it('API methods are registered', () => {
    host.use(createCorePlugin({ initialData: [[3], [1], [2]] }));
    host.use(createAsyncSortPlugin());

    expect(api.getMethod('sort', 'toggle')).toBeDefined();
    expect(api.getMethod('sort', 'apply')).toBeDefined();
    expect(api.getMethod('sort', 'clear')).toBeDefined();
    expect(api.getMethod('sort', 'getState')).toBeDefined();
    expect(api.getMethod('sort', 'getAsyncState')).toBeDefined();
    expect(api.getMethod('sort', 'isPending')).toBeDefined();
  });

  it('fires sort:change event with correct payload', async () => {
    const events: unknown[] = [];
    emitter.on('sort:change', (d: unknown) => events.push(d));

    host.use(createCorePlugin({ initialData: [[30], [10], [20]] }));
    host.use(createAsyncSortPlugin());

    store.exec('sort:toggle', 0);
    expect(events.length).toBe(1);
    expect((events[0] as any).sortState.length).toBe(1);
    expect((events[0] as any).previousSortState).toEqual([]);
  });

  it('destroy calls cleanup without error', () => {
    host.use(createCorePlugin({ initialData: [[1]] }));
    host.use(createAsyncSortPlugin());

    expect(() => host.destroy()).not.toThrow();
  });
});
