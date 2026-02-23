import { PluginHost } from '../plugin-host';
import { GridApiImpl } from '../grid-api';
import { GridStoreImpl } from '../../reactive/store';
import { EventEmitter } from '../../utils';
import { resetTracking } from '../../reactive/tracking';
import { resetDebug, getPluginTimings } from '../../reactive/debug';
import { resetScheduler } from '../../reactive/effect-scheduler';
import type { GridPlugin, GridStore, GridApi } from '../../reactive/types';

let store: GridStoreImpl;
let api: GridApiImpl;
let host: PluginHost;

beforeEach(() => {
  resetTracking();
  resetDebug();
  resetScheduler();
  store = new GridStoreImpl();
  api = new GridApiImpl(store, new EventEmitter());
  host = new PluginHost(store, api);
});

function makePlugin(overrides: Partial<GridPlugin> & { name: string }): GridPlugin {
  return {
    phase: 0,
    setup: () => {},
    ...overrides,
  };
}

describe('PluginHost', () => {
  describe('use()', () => {
    it('calls plugin.setup with store and api', () => {
      let receivedStore: GridStore | null = null;
      let receivedApi: GridApi | null = null;
      const plugin = makePlugin({
        name: 'test',
        setup(s, a) {
          receivedStore = s;
          receivedApi = a;
        },
      });

      host.use(plugin);
      expect(receivedStore).toBe(store);
      expect(receivedApi).toBe(api);
    });

    it('throws on double registration', () => {
      host.use(makePlugin({ name: 'core' }));
      expect(() => host.use(makePlugin({ name: 'core' }))).toThrow(
        'Plugin "core" already registered'
      );
    });

    it('throws when dependency is missing', () => {
      const plugin = makePlugin({ name: 'sort', dependencies: ['core'] });
      expect(() => host.use(plugin)).toThrow(
        'Plugin "sort" requires "core" but it is not registered'
      );
    });

    it('passes when dependency is satisfied', () => {
      host.use(makePlugin({ name: 'core' }));
      const plugin = makePlugin({ name: 'sort', dependencies: ['core'] });
      expect(() => host.use(plugin)).not.toThrow();
    });

    it('stores returned PluginDisposable', () => {
      let tornDown = false;
      const plugin = makePlugin({
        name: 'test',
        setup() {
          return {
            teardown: [
              () => {
                tornDown = true;
              },
            ],
          };
        },
      });

      host.use(plugin);
      host.destroy();
      expect(tornDown).toBe(true);
    });
  });

  describe('destroy()', () => {
    it('calls store.disposeAll', () => {
      const spy = jest.spyOn(store, 'disposeAll');
      host.destroy();
      expect(spy).toHaveBeenCalled();
    });

    it('runs plugin.dispose in reverse phase order', () => {
      const order: string[] = [];

      host.use(
        makePlugin({
          name: 'core',
          phase: 0,
          dispose() {
            order.push('core');
          },
        })
      );
      host.use(
        makePlugin({
          name: 'sort',
          phase: 10,
          dispose() {
            order.push('sort');
          },
        })
      );
      host.use(
        makePlugin({
          name: 'filter',
          phase: 20,
          dispose() {
            order.push('filter');
          },
        })
      );

      host.destroy();
      expect(order).toEqual(['filter', 'sort', 'core']);
    });

    it('error in one plugin does not block others', () => {
      const order: string[] = [];

      host.use(
        makePlugin({
          name: 'a',
          phase: 0,
          dispose() {
            order.push('a');
          },
        })
      );
      host.use(
        makePlugin({
          name: 'b',
          phase: 10,
          dispose() {
            throw new Error('boom');
          },
        })
      );
      host.use(
        makePlugin({
          name: 'c',
          phase: 20,
          dispose() {
            order.push('c');
          },
        })
      );

      host.destroy();
      // c runs first (highest phase), b throws, a still runs
      expect(order).toEqual(['c', 'a']);
    });

    it('runs teardown functions before dispose', () => {
      const order: string[] = [];

      host.use(
        makePlugin({
          name: 'test',
          phase: 0,
          setup() {
            return { teardown: [() => order.push('teardown')] };
          },
          dispose() {
            order.push('dispose');
          },
        })
      );

      host.destroy();
      expect(order).toEqual(['teardown', 'dispose']);
    });
  });

  describe('has()', () => {
    it('returns true for registered plugin', () => {
      host.use(makePlugin({ name: 'core' }));
      expect(host.has('core')).toBe(true);
    });

    it('returns false for unregistered plugin', () => {
      expect(host.has('missing')).toBe(false);
    });
  });

  describe('getPluginNames()', () => {
    it('returns names of all registered plugins', () => {
      host.use(makePlugin({ name: 'core', phase: 0 }));
      host.use(makePlugin({ name: 'sort', phase: 10 }));
      expect(host.getPluginNames()).toEqual(['core', 'sort']);
    });
  });

  describe('getPluginsByPhase()', () => {
    it('returns plugins sorted by phase', () => {
      host.use(makePlugin({ name: 'sort', phase: 10 }));
      host.use(makePlugin({ name: 'core', phase: 0 }));
      host.use(makePlugin({ name: 'filter', phase: 20 }));

      expect(host.getPluginsByPhase()).toEqual([
        { name: 'core', phase: 0 },
        { name: 'sort', phase: 10 },
        { name: 'filter', phase: 20 },
      ]);
    });
  });

  describe('plugin timing', () => {
    it('records setup duration via getPluginTimings', () => {
      host.use(makePlugin({ name: 'core' }));
      const timings = getPluginTimings();
      expect(timings.has('core')).toBe(true);
      expect(typeof timings.get('core')).toBe('number');
    });
  });
});
