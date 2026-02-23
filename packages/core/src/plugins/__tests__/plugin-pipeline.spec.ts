import { PluginHost } from '../../grid/plugin-host';
import { GridApiImpl } from '../../grid/grid-api';
import { GridStoreImpl } from '../../reactive/store';
import { PipelineRegistry } from '../../reactive/pipeline';
import { EventEmitter } from '../../utils';
import { resetTracking } from '../../reactive/tracking';
import { resetDebug } from '../../reactive/debug';
import { resetScheduler } from '../../reactive/effect-scheduler';
import { createCorePlugin } from '../core-plugin';
import { createSortPlugin } from '../sort-plugin';
import { createFilterPlugin } from '../filter-plugin';

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

function setupPipeline(): void {
  pipeline.registerPhase('sort', 10, 'pipeline.sort');
  pipeline.registerPhase('filter', 20, 'pipeline.filter');
  pipeline.setupCoreComputeds(store);
}

describe('Plugin Pipeline Integration', () => {
  it('core only: rows.viewIndices = rows.indices', () => {
    host.use(createCorePlugin({ initialData: [[1], [2], [3]] }));
    setupPipeline();

    expect(store.get('rows.viewIndices')).toEqual([0, 1, 2]);
    expect(store.get('rows.viewCount')).toBe(3);
  });

  it('core + sort: rows.viewIndices = sorted indices', () => {
    host.use(createCorePlugin({ initialData: [[30], [10], [20]] }));
    host.use(createSortPlugin());
    setupPipeline();

    store.exec('sort:toggle', 0); // asc: 10(1), 20(2), 30(0)
    expect(store.get('rows.viewIndices')).toEqual([1, 2, 0]);
    expect(store.get('rows.viewCount')).toBe(3);
  });

  it('core + sort + filter: rows.viewIndices = sorted + filtered', () => {
    // Values: 50, 10, 40, 20, 30
    host.use(createCorePlugin({ initialData: [[50], [10], [40], [20], [30]] }));
    host.use(createSortPlugin());
    host.use(createFilterPlugin({ colCount: 1 }));
    setupPipeline();

    // Sort asc: 10(1), 20(3), 30(4), 40(2), 50(0)
    store.exec('sort:toggle', 0);
    expect(store.get('rows.viewIndices')).toEqual([1, 3, 4, 2, 0]);

    // Filter > 25: raw 0(50), 2(40), 4(30) → sorted order: 4, 2, 0
    store.exec('filter:setColumn', 0, [{ operator: 'greaterThan', value: 25 }]);
    expect(store.get('rows.viewIndices')).toEqual([4, 2, 0]);
    expect(store.get('rows.viewCount')).toBe(3);
  });

  it('clear filter: falls back to sorted indices', () => {
    host.use(createCorePlugin({ initialData: [[30], [10], [20]] }));
    host.use(createSortPlugin());
    host.use(createFilterPlugin({ colCount: 1 }));
    setupPipeline();

    store.exec('sort:toggle', 0); // asc
    store.exec('filter:setColumn', 0, [{ operator: 'greaterThan', value: 15 }]);
    expect(store.get('rows.viewIndices')).toEqual([2, 0]); // 20(2), 30(0)

    store.exec('filter:clear');
    // Falls back to sort output: 10(1), 20(2), 30(0)
    expect(store.get('rows.viewIndices')).toEqual([1, 2, 0]);
    expect(store.get('rows.viewCount')).toBe(3);
  });

  it('clear sort: falls back to raw indices', () => {
    host.use(createCorePlugin({ initialData: [[30], [10], [20]] }));
    host.use(createSortPlugin());
    setupPipeline();

    store.exec('sort:toggle', 0);
    expect(store.get('rows.viewIndices')).toEqual([1, 2, 0]);

    store.exec('sort:clear');
    expect(store.get('rows.viewIndices')).toEqual([0, 1, 2]);
  });

  it('rows.viewCount reflects filtered count', () => {
    host.use(createCorePlugin({ initialData: [[10], [20], [30], [40], [50]] }));
    host.use(createFilterPlugin({ colCount: 1 }));
    setupPipeline();

    expect(store.get('rows.viewCount')).toBe(5);

    store.exec('filter:setColumn', 0, [{ operator: 'greaterThan', value: 30 }]);
    expect(store.get('rows.viewCount')).toBe(2); // 40, 50
  });

  it('setData updates propagate through pipeline', () => {
    host.use(createCorePlugin({ initialData: [[30], [10], [20]] }));
    host.use(createSortPlugin());
    setupPipeline();

    store.exec('sort:toggle', 0); // asc
    expect(store.get('rows.viewIndices')).toEqual([1, 2, 0]);

    // Replace data — note: sort state stays but pipeline.sort is stale
    // until re-sorted. After setData, rows.count changes.
    store.exec('core:setData', [[5], [15]]);
    expect(store.get('rows.count')).toBe(2);
    expect(store.get('rows.indices')).toEqual([0, 1]);
  });
});
