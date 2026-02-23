import { createSignal } from './signal';
import { createEffect } from './effect-scheduler';
import type { AsyncState, AsyncComputedOptions } from './types';

/**
 * Creates an async computed value in the store.
 *
 * `fn` is a two-stage function:
 *   Stage 1 (sync): reads reactive deps (tracked by preact/signals-core)
 *   Stage 2 (async): returns an async worker that performs the computation
 *
 * During recomputation the previous value remains available (stale model).
 * A version counter guards against race conditions from rapid dep changes.
 */
export function createAsyncComputed<T>(
  key: string,
  fn: () => () => Promise<T>,
  owner: string,
  phase: number,
  options?: AsyncComputedOptions
): {
  valueSignal: ReturnType<typeof createSignal<T | undefined>>;
  metaSignal: ReturnType<typeof createSignal<AsyncState>>;
  dispose: () => void;
} {
  const valueSignal = createSignal<T | undefined>(key, undefined, owner, phase);
  const metaSignal = createSignal<AsyncState>(
    `${key}.__async`,
    { pending: false, stale: false, error: null, version: 0 },
    owner,
    phase
  );

  let version = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;

  function scheduleRun(worker: () => Promise<T>): void {
    const currentVersion = ++version;

    // Mark pending; stale if we have a previous value
    const hasPrevious = valueSignal.peek() !== undefined;
    metaSignal.value = {
      pending: true,
      stale: hasPrevious,
      error: null,
      version: currentVersion,
    };

    worker().then(
      (result) => {
        if (disposed || version !== currentVersion) return;
        valueSignal.value = result;
        metaSignal.value = {
          pending: false,
          stale: false,
          error: null,
          version: currentVersion,
        };
      },
      (err) => {
        if (disposed || version !== currentVersion) return;
        const error = err instanceof Error ? err : new Error(String(err));
        metaSignal.value = {
          pending: false,
          stale: metaSignal.peek().stale,
          error,
          version: currentVersion,
        };
        options?.onError?.(error);
      }
    );
  }

  const disposeEffect = createEffect(
    `${key}.__effect`,
    () => {
      // Stage 1: sync dep reads (tracked by preact)
      const worker = fn();

      // Stage 2: schedule async worker, with optional debounce
      if (options?.debounceMs && options.debounceMs > 0) {
        if (debounceTimer !== undefined) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          debounceTimer = undefined;
          if (!disposed) scheduleRun(worker);
        }, options.debounceMs);
      } else {
        scheduleRun(worker);
      }
    },
    owner,
    phase
  );

  function dispose(): void {
    disposed = true;
    version++; // invalidate any in-flight work
    if (debounceTimer !== undefined) {
      clearTimeout(debounceTimer);
      debounceTimer = undefined;
    }
    disposeEffect();
  }

  return { valueSignal, metaSignal, dispose };
}
