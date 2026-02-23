import { GridStoreImpl } from '../store';
import { PipelineRegistry } from '../pipeline';
import { resetTracking } from '../tracking';
import { resetDebug } from '../debug';
import { resetScheduler } from '../effect-scheduler';

let store: GridStoreImpl;
let pipeline: PipelineRegistry;

beforeEach(() => {
  resetTracking();
  resetDebug();
  resetScheduler();
  store = new GridStoreImpl();
  pipeline = new PipelineRegistry();
});

describe('PipelineRegistry', () => {
  it('single phase: sort indices → viewIndices matches', () => {
    store.extend('rows.raw', [10, 20, 30], 'core');
    store.extend('rows.indices', [0, 1, 2], 'core');

    pipeline.registerPhase('sort', 10, 'pipeline.sort');
    pipeline.setupCoreComputeds(store);

    // No sort pipeline output yet → viewIndices falls back to rows.indices
    expect(store.get('rows.viewIndices')).toEqual([0, 1, 2]);

    // Now add sorted indices
    store.extend('pipeline.sort', [2, 0, 1], 'sort-plugin', 10);

    expect(store.get('rows.viewIndices')).toEqual([2, 0, 1]);
    expect(store.get('rows.viewCount')).toBe(3);
  });

  it('multi-phase: sort → filter → paginate, viewIndices = last active', () => {
    store.extend('rows.raw', [10, 20, 30, 40, 50], 'core');
    store.extend('rows.indices', [0, 1, 2, 3, 4], 'core');

    pipeline.registerPhase('sort', 10, 'pipeline.sort');
    pipeline.registerPhase('filter', 20, 'pipeline.filter');
    pipeline.registerPhase('paginate', 30, 'pipeline.paginate');
    pipeline.setupCoreComputeds(store);

    store.extend('pipeline.sort', [4, 3, 2, 1, 0], 'sort-plugin', 10);
    store.extend('pipeline.filter', [4, 2, 0], 'filter-plugin', 20);
    store.extend('pipeline.paginate', [4, 2], 'paginate-plugin', 30);

    // Last active phase is paginate
    expect(store.get('rows.viewIndices')).toEqual([4, 2]);
    expect(store.get('rows.viewCount')).toBe(2);
  });

  it('skipped phase: no filter key → chain skips, reads sort', () => {
    store.extend('rows.raw', [10, 20, 30], 'core');
    store.extend('rows.indices', [0, 1, 2], 'core');

    pipeline.registerPhase('sort', 10, 'pipeline.sort');
    pipeline.registerPhase('filter', 20, 'pipeline.filter');
    pipeline.setupCoreComputeds(store);

    // Only sort is populated
    store.extend('pipeline.sort', [2, 1, 0], 'sort-plugin', 10);

    // filter key doesn't exist → falls back to sort
    expect(store.get('rows.viewIndices')).toEqual([2, 1, 0]);
  });

  it('no phases: viewIndices = rows.indices', () => {
    store.extend('rows.raw', [10, 20, 30], 'core');
    store.extend('rows.indices', [0, 1, 2], 'core');

    // No phases registered
    pipeline.setupCoreComputeds(store);

    expect(store.get('rows.viewIndices')).toEqual([0, 1, 2]);
    expect(store.get('rows.viewCount')).toBe(3);
  });

  it('dynamic: add phase after setup → viewIndices updates', () => {
    store.extend('rows.raw', [10, 20, 30], 'core');
    store.extend('rows.indices', [0, 1, 2], 'core');

    pipeline.registerPhase('sort', 10, 'pipeline.sort');
    pipeline.setupCoreComputeds(store);

    // Initially no sort output
    expect(store.get('rows.viewIndices')).toEqual([0, 1, 2]);

    // Register filter phase (after setup)
    pipeline.registerPhase('filter', 20, 'pipeline.filter');

    // Add sort output
    store.extend('pipeline.sort', [2, 1, 0], 'sort-plugin', 10);
    expect(store.get('rows.viewIndices')).toEqual([2, 1, 0]);

    // Add filter output (higher phase → becomes viewIndices)
    store.extend('pipeline.filter', [2, 0], 'filter-plugin', 20);
    expect(store.get('rows.viewIndices')).toEqual([2, 0]);
  });

  it('throws on duplicate phase number', () => {
    pipeline.registerPhase('sort', 10, 'pipeline.sort');
    expect(() => pipeline.registerPhase('other', 10, 'pipeline.other')).toThrow(
      /phase 10 already registered/
    );
  });

  it('getPhases returns sorted list', () => {
    pipeline.registerPhase('filter', 20, 'pipeline.filter');
    pipeline.registerPhase('sort', 10, 'pipeline.sort');

    const phases = pipeline.getPhases();
    expect(phases.map((p) => p.name)).toEqual(['sort', 'filter']);
  });
});
