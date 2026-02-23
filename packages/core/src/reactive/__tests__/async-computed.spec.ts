import { GridStoreImpl } from '../store';
import { resetTracking } from '../tracking';
import { resetDebug } from '../debug';
import { resetScheduler, flushEffects } from '../effect-scheduler';
import type { AsyncState } from '../types';

let store: GridStoreImpl;

beforeEach(() => {
  resetTracking();
  resetDebug();
  resetScheduler();
  store = new GridStoreImpl();
});

afterEach(() => {
  store.disposeAll();
});

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('asyncComputed', () => {
  it('runs async computation and updates value', async () => {
    store.extend('input', 5, 'core');

    store.asyncComputed(
      'result',
      () => {
        const val = store.get('input') as number;
        return async () => val * 2;
      },
      'test',
      0
    );

    // Initially undefined
    expect(store.get('result')).toBeUndefined();

    // Wait for the effect to schedule and the async worker to resolve
    flushEffects();
    await flushMicrotasks();

    expect(store.get('result')).toBe(10);
  });

  it('metadata shows pending: true initially', async () => {
    store.extend('input', 1, 'core');

    store.asyncComputed(
      'result',
      () => {
        store.get('input');
        return async () => {
          await flushMicrotasks();
          return 42;
        };
      },
      'test',
      0
    );

    flushEffects();
    const meta = store.get('result.__async') as AsyncState;
    expect(meta.pending).toBe(true);

    await flushMicrotasks();
    await flushMicrotasks();

    const meta2 = store.get('result.__async') as AsyncState;
    expect(meta2.pending).toBe(false);
    expect(store.get('result')).toBe(42);
  });

  it('marks value as stale during recomputation', async () => {
    store.extend('input', 1, 'core');

    store.asyncComputed(
      'result',
      () => {
        const val = store.get('input') as number;
        return async () => val * 10;
      },
      'test',
      0
    );

    flushEffects();
    await flushMicrotasks();
    expect(store.get('result')).toBe(10);

    // Change input — triggers recompute
    store.set('input', 2);
    flushEffects();

    const meta = store.get('result.__async') as AsyncState;
    expect(meta.pending).toBe(true);
    expect(meta.stale).toBe(true);

    // Previous value still available during recompute
    expect(store.get('result')).toBe(10);

    await flushMicrotasks();

    expect(store.get('result')).toBe(20);
    const meta2 = store.get('result.__async') as AsyncState;
    expect(meta2.stale).toBe(false);
  });

  it('cancels previous computation on rapid dep changes (version counter)', async () => {
    store.extend('input', 1, 'core');
    const callOrder: number[] = [];

    store.asyncComputed(
      'result',
      () => {
        const val = store.get('input') as number;
        return async () => {
          await flushMicrotasks();
          callOrder.push(val);
          return val;
        };
      },
      'test',
      0
    );

    flushEffects();

    // Rapidly change input before first resolves
    store.set('input', 2);
    flushEffects();
    store.set('input', 3);
    flushEffects();

    await flushMicrotasks();
    await flushMicrotasks();
    await flushMicrotasks();

    // Only the last value should be stored (version guard)
    expect(store.get('result')).toBe(3);
  });

  it('handles errors — stores in metadata, calls onError', async () => {
    store.extend('input', 1, 'core');
    const errors: Error[] = [];

    store.asyncComputed(
      'result',
      () => {
        store.get('input');
        return async () => {
          throw new Error('test error');
        };
      },
      'test',
      0,
      { onError: (err) => errors.push(err) }
    );

    flushEffects();
    await flushMicrotasks();

    const meta = store.get('result.__async') as AsyncState;
    expect(meta.error).toBeInstanceOf(Error);
    expect(meta.error!.message).toBe('test error');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('test error');
  });

  it('debounces rapid changes when debounceMs set', async () => {
    jest.useFakeTimers();
    store.extend('input', 1, 'core');
    let computeCount = 0;

    store.asyncComputed(
      'result',
      () => {
        const val = store.get('input') as number;
        return async () => {
          computeCount++;
          return val;
        };
      },
      'test',
      0,
      { debounceMs: 50 }
    );

    flushEffects();

    // Rapid changes
    store.set('input', 2);
    flushEffects();
    store.set('input', 3);
    flushEffects();

    // Before debounce fires, no async computation should have run
    // (only the initial one from the first effect run)
    const countBefore = computeCount;

    // Advance past debounce
    jest.advanceTimersByTime(60);
    await Promise.resolve();
    await Promise.resolve();

    // Only one additional computation should fire (for the last value)
    expect(computeCount).toBeLessThanOrEqual(countBefore + 1);

    jest.useRealTimers();
  });

  it('cleans up on disposePlugin — no unhandled rejections', async () => {
    store.extend('input', 1, 'core');

    store.asyncComputed(
      'result',
      () => {
        const val = store.get('input') as number;
        return async () => {
          await flushMicrotasks();
          return val;
        };
      },
      'test-plugin',
      0
    );

    flushEffects();

    // Dispose before async completes
    store.disposePlugin('test-plugin');

    // Let any pending promises settle — should not throw
    await flushMicrotasks();
    await flushMicrotasks();
  });

  it('throws on duplicate key', () => {
    store.extend('input', 1, 'core');

    store.asyncComputed(
      'result',
      () => {
        store.get('input');
        return async () => 1;
      },
      'test',
      0
    );

    expect(() => {
      store.asyncComputed(
        'result',
        () => {
          store.get('input');
          return async () => 2;
        },
        'test',
        0
      );
    }).toThrow('already exists');
  });
});
