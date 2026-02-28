import { PluginHost } from '../../grid/plugin-host';
import { GridApiImpl } from '../../grid/grid-api';
import { GridStoreImpl } from '../../reactive/store';
import { EventEmitter } from '../../utils';
import { resetTracking } from '../../reactive/tracking';
import { resetDebug } from '../../reactive/debug';
import { resetScheduler } from '../../reactive/effect-scheduler';
import { createCorePlugin } from '../core-plugin';
import { createFilterPlugin } from '../filter-plugin';
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

describe('FilterPlugin', () => {
  it('throws without core dependency', () => {
    expect(() => host.use(createFilterPlugin())).toThrow('requires "core"');
  });

  it('initializes filter.state = [] and pipeline.filter = undefined', () => {
    host.use(createCorePlugin({ initialData: [[10], [20], [30]] }));
    host.use(createFilterPlugin({ colCount: 1 }));

    expect(store.get('filter.state')).toEqual([]);
    expect(store.get('pipeline.filter')).toBeUndefined();
  });

  it('filter:setColumn filters rows and produces correct indices', () => {
    // Column 0 values: 10, 20, 30, 40, 50
    host.use(createCorePlugin({ initialData: [[10], [20], [30], [40], [50]] }));
    host.use(createFilterPlugin({ colCount: 1 }));

    store.exec('filter:setColumn', 0, [{ operator: 'greaterThan', value: 25 }]);
    const filtered = store.get('pipeline.filter') as number[];
    // Rows with value > 25: idx 2 (30), idx 3 (40), idx 4 (50)
    expect(filtered).toEqual([2, 3, 4]);
  });

  it('filter:clear resets pipeline.filter to undefined', () => {
    host.use(createCorePlugin({ initialData: [[10], [20], [30]] }));
    host.use(createFilterPlugin({ colCount: 1 }));

    store.exec('filter:setColumn', 0, [{ operator: 'greaterThan', value: 15 }]);
    expect(store.get('pipeline.filter')).toBeDefined();

    store.exec('filter:clear');
    expect(store.get('pipeline.filter')).toBeUndefined();
    expect(store.get('filter.state')).toEqual([]);
  });

  it('composed with sort: filter output preserves sort order', () => {
    // Column 0 values: 50, 10, 40, 20, 30
    host.use(createCorePlugin({ initialData: [[50], [10], [40], [20], [30]] }));
    host.use(createSortPlugin());
    host.use(createFilterPlugin({ colCount: 1 }));

    // Sort ascending: 10(1), 20(3), 30(4), 40(2), 50(0)
    store.exec('sort:toggle', 0);
    const sorted = store.get('pipeline.sort') as number[];
    expect(sorted).toEqual([1, 3, 4, 2, 0]);

    // Filter: value > 25 → raw indices 0(50), 2(40), 4(30)
    // In sorted order: 4(30), 2(40), 0(50)
    store.exec('filter:setColumn', 0, [{ operator: 'greaterThan', value: 25 }]);
    const filtered = store.get('pipeline.filter') as number[];
    expect(filtered).toEqual([4, 2, 0]);
  });

  it('API methods are registered', () => {
    host.use(createCorePlugin({ initialData: [[1]] }));
    host.use(createFilterPlugin({ colCount: 1 }));

    expect(api.getMethod('filter', 'setColumnFilter')).toBeDefined();
    expect(api.getMethod('filter', 'clear')).toBeDefined();
    expect(api.getMethod('filter', 'reapply')).toBeDefined();
    expect(api.getMethod('filter', 'getState')).toBeDefined();
    expect(api.getMethod('filter', 'hasActiveFilters')).toBeDefined();
  });

  it('fires filter:change event with correct payload', () => {
    const events: unknown[] = [];
    emitter.on('filter:change', (d: unknown) => events.push(d));

    host.use(createCorePlugin({ initialData: [[10], [20], [30]] }));
    host.use(createFilterPlugin({ colCount: 1 }));

    store.exec('filter:setColumn', 0, [{ operator: 'greaterThan', value: 15 }]);
    expect(events.length).toBe(1);
    expect((events[0] as any).filterState).toBeDefined();
    expect((events[0] as any).previousFilterState).toEqual([]);
  });

  it('destroy cleans up without error', () => {
    host.use(createCorePlugin({ initialData: [[1]] }));
    host.use(createFilterPlugin({ colCount: 1 }));

    expect(() => host.destroy()).not.toThrow();
  });
});
