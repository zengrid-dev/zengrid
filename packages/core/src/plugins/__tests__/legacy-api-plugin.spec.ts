import { PluginHost } from '../../grid/plugin-host';
import { GridApiImpl } from '../../grid/grid-api';
import { GridStoreImpl } from '../../reactive/store';
import { EventEmitter } from '../../utils';
import { resetTracking } from '../../reactive/tracking';
import { resetDebug } from '../../reactive/debug';
import { resetScheduler } from '../../reactive/effect-scheduler';
import { createCorePlugin } from '../core-plugin';
import { createSortPlugin } from '../sort-plugin';
import { createFilterPlugin } from '../filter-plugin';
import { createLegacyApiPlugin } from '../legacy-bridge';

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

describe('LegacyApiPlugin', () => {
  it('requires core dependency', () => {
    expect(() => host.use(createLegacyApiPlugin())).toThrow('requires "core"');
  });

  it('registers at phase 200', () => {
    const plugin = createLegacyApiPlugin();
    expect(plugin.phase).toBe(200);
  });

  describe('sort handlers', () => {
    beforeEach(() => {
      host.use(createCorePlugin({ initialData: [[30], [10], [20]] }));
      host.use(createSortPlugin());
      host.use(createLegacyApiPlugin());
    });

    it('sort handler calls sort:apply for asc/desc', () => {
      api.callLegacy('sort', 0, 'asc');
      const state = store.get('sort.state') as any[];
      expect(state).toEqual([{ column: 0, direction: 'asc' }]);
    });

    it('sort handler calls sort:clear for null direction', () => {
      api.callLegacy('sort', 0, 'asc');
      api.callLegacy('sort', 0, null);
      expect(store.get('sort.state')).toEqual([]);
    });

    it('toggleSort handler calls sort:toggle', () => {
      api.callLegacy('toggleSort', 0);
      const state = store.get('sort.state') as any[];
      expect(state.length).toBe(1);
      expect(state[0].column).toBe(0);
    });

    it('clearSort handler calls sort:clear', () => {
      api.callLegacy('toggleSort', 0);
      api.callLegacy('clearSort');
      expect(store.get('sort.state')).toEqual([]);
    });

    it('setSortState handler calls sort:apply', () => {
      api.callLegacy('setSortState', [{ column: 0, direction: 'desc' }]);
      const state = store.get('sort.state') as any[];
      expect(state).toEqual([{ column: 0, direction: 'desc' }]);
    });
  });

  describe('data handler', () => {
    beforeEach(() => {
      host.use(createCorePlugin());
      host.use(createLegacyApiPlugin());
    });

    it('setData handler calls core:setData', () => {
      const data = [
        [1, 2],
        [3, 4],
      ];
      api.callLegacy('setData', data);
      expect(store.get('rows.raw')).toEqual(data);
      expect(store.get('rows.count')).toBe(2);
    });
  });

  describe('filter handlers', () => {
    beforeEach(() => {
      host.use(createCorePlugin({ initialData: [[30], [10], [20]] }));
      host.use(createFilterPlugin({ colCount: 1 }));
      host.use(createLegacyApiPlugin());
    });

    it('setColumnFilter handler calls filter:setColumn', () => {
      api.callLegacy('setColumnFilter', 0, [{ operator: 'greaterThan', value: 15 }], 'AND');
      const state = store.get('filter.state') as any[];
      expect(state.length).toBeGreaterThan(0);
    });

    it('setFilter handler wraps single condition', () => {
      api.callLegacy('setFilter', 0, 'greaterThan', 15);
      const state = store.get('filter.state') as any[];
      expect(state.length).toBeGreaterThan(0);
    });

    it('clearFilters handler calls filter:clear', () => {
      api.callLegacy('setColumnFilter', 0, [{ operator: 'greaterThan', value: 15 }], 'AND');
      api.callLegacy('clearFilters');
      expect(store.get('filter.state')).toEqual([]);
    });

    it('clearColumnFilter handler calls filter:clearColumn', () => {
      api.callLegacy('setColumnFilter', 0, [{ operator: 'greaterThan', value: 15 }], 'AND');
      api.callLegacy('clearColumnFilter', 0);
      expect(store.get('filter.state')).toEqual([]);
    });

    it('setFilterState handler clears then applies each model', () => {
      api.callLegacy('setFilterState', [
        { column: 0, conditions: [{ operator: 'greaterThan', value: 15 }], logic: 'AND' },
      ]);
      const state = store.get('filter.state') as any[];
      expect(state.length).toBeGreaterThan(0);
    });
  });

  describe('soft dependencies', () => {
    it('sort handlers do not throw when sort plugin not loaded', () => {
      host.use(createCorePlugin());
      host.use(createLegacyApiPlugin());

      expect(() => api.callLegacy('sort', 0, 'asc')).not.toThrow();
      expect(() => api.callLegacy('toggleSort', 0)).not.toThrow();
      expect(() => api.callLegacy('clearSort')).not.toThrow();
      expect(() => api.callLegacy('setSortState', [{ column: 0, direction: 'asc' }])).not.toThrow();
    });

    it('filter handlers do not throw when filter plugin not loaded', () => {
      host.use(createCorePlugin());
      host.use(createLegacyApiPlugin());

      expect(() =>
        api.callLegacy('setColumnFilter', 0, [{ operator: 'eq', value: 1 }], 'AND')
      ).not.toThrow();
      expect(() => api.callLegacy('setFilter', 0, 'eq', 1)).not.toThrow();
      expect(() => api.callLegacy('clearFilters')).not.toThrow();
      expect(() => api.callLegacy('clearColumnFilter', 0)).not.toThrow();
      expect(() => api.callLegacy('setFilterState', [])).not.toThrow();
    });
  });
});
