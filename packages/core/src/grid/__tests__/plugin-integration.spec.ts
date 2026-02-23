import { PluginHost } from '../plugin-host';
import { GridApiImpl } from '../grid-api';
import { GridStoreImpl } from '../../reactive/store';
import { PipelineRegistry } from '../../reactive/pipeline';
import { EventEmitter } from '../../utils';
import { resetTracking } from '../../reactive/tracking';
import { resetDebug } from '../../reactive/debug';
import { resetScheduler } from '../../reactive/effect-scheduler';
import type { GridPlugin, PluginDisposable } from '../../reactive/types';

let store: GridStoreImpl;
let emitter: EventEmitter;
let api: GridApiImpl;
let host: PluginHost;
let pipeline: PipelineRegistry;

beforeEach(() => {
  resetTracking();
  resetDebug();
  resetScheduler();
  store = new GridStoreImpl();
  emitter = new EventEmitter();
  api = new GridApiImpl(store, emitter);
  host = new PluginHost(store, api);
  pipeline = new PipelineRegistry();
});

describe('Plugin Integration', () => {
  it('full lifecycle: core + sort plugin → destroy cleans up', () => {
    let coreDisposed = false;
    let sortDisposed = false;
    let sortTeardown = false;

    const corePlugin: GridPlugin = {
      name: 'core',
      phase: 0,
      setup(s) {
        s.extend('rows.raw', [30, 10, 20], 'core');
        s.extend('rows.indices', [0, 1, 2], 'core');
      },
      dispose() {
        coreDisposed = true;
      },
    };

    const sortPlugin: GridPlugin = {
      name: 'sort',
      phase: 10,
      dependencies: ['core'],
      setup(s, a): PluginDisposable {
        s.action(
          'sort',
          () => {
            s.extend('pipeline.sort', [1, 2, 0], 'sort', 10);
          },
          'sort'
        );

        a.register('sort', {
          apply: () => s.exec('sort'),
        });

        return {
          teardown: [
            () => {
              sortTeardown = true;
            },
          ],
        };
      },
      dispose() {
        sortDisposed = true;
      },
    };

    host.use(corePlugin);
    host.use(sortPlugin);

    // Execute sort via api
    const sortFn = api.getMethod('sort', 'apply') as Function;
    sortFn();

    host.destroy();

    expect(sortTeardown).toBe(true);
    expect(sortDisposed).toBe(true);
    expect(coreDisposed).toBe(true);
    expect(host.getPluginNames()).toEqual([]);
  });

  it('plugin extends store signals and reads them back', () => {
    const plugin: GridPlugin = {
      name: 'columns',
      phase: 0,
      setup(s) {
        s.extend('columns.count', 5, 'columns');
        s.extend('columns.widths', [100, 200, 150, 80, 120], 'columns');
      },
    };

    host.use(plugin);

    expect(store.get('columns.count')).toBe(5);
    expect(store.get('columns.widths')).toEqual([100, 200, 150, 80, 120]);
  });

  it('pipeline integration: plugin registers phase, viewIndices reflects it', () => {
    // Setup core data
    store.extend('rows.raw', [10, 20, 30, 40, 50], 'core');
    store.extend('rows.indices', [0, 1, 2, 3, 4], 'core');

    // Register pipeline phase and setup computeds
    pipeline.registerPhase('sort', 10, 'pipeline.sort');
    pipeline.setupCoreComputeds(store);

    // Before plugin: viewIndices = rows.indices
    expect(store.get('rows.viewIndices')).toEqual([0, 1, 2, 3, 4]);

    const sortPlugin: GridPlugin = {
      name: 'sort',
      phase: 10,
      setup(s) {
        s.extend('pipeline.sort', [4, 3, 2, 1, 0], 'sort', 10);
      },
    };

    host.use(sortPlugin);

    // After plugin: viewIndices = pipeline.sort output
    expect(store.get('rows.viewIndices')).toEqual([4, 3, 2, 1, 0]);
    expect(store.get('rows.viewCount')).toBe(5);
  });

  it('fireEvent delivers events to listeners', () => {
    const events: unknown[] = [];
    emitter.on('sort:changed', (data: unknown) => events.push(data));

    const plugin: GridPlugin = {
      name: 'sort',
      phase: 10,
      setup(_s, a) {
        a.fireEvent('sort:changed', { column: 'name', direction: 'asc' });
      },
    };

    host.use(plugin);
    expect(events).toEqual([{ column: 'name', direction: 'asc' }]);
  });
});
