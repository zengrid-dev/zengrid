import { signal as preactSignal, effect as preactEffect } from '@preact/signals-core';
import type { EffectDispose } from './types';
import { pushEvaluatingPhase, popEvaluatingPhase } from './tracking';
import { recordEffectRun } from './debug';

interface PendingEntry {
  name: string;
  phase: number;
  id: number;
  execute: () => void;
}

const pendingEffects = new Map<number, PendingEntry>();
let nextEffectId = 0;
let rafScheduled = false;
let isFlushing = false;

const useRaf = typeof requestAnimationFrame !== 'undefined';

function scheduleFlush(): void {
  if (rafScheduled || isFlushing) return;
  rafScheduled = true;
  if (useRaf) {
    requestAnimationFrame(runFlush);
  } else {
    setTimeout(runFlush, 0);
  }
}

function runFlush(): void {
  rafScheduled = false;
  isFlushing = true;
  try {
    const sorted = [...pendingEffects.entries()].sort((a, b) => {
      const phaseDiff = a[1].phase - b[1].phase;
      return phaseDiff !== 0 ? phaseDiff : a[1].id - b[1].id;
    });
    pendingEffects.clear();

    for (const [, entry] of sorted) {
      try {
        entry.execute();
      } catch (err) {
        console.error(`Effect "${entry.name}" threw:`, err);
      }
    }
  } finally {
    isFlushing = false;
    // Effects dirtied during flush run in the next frame
    if (pendingEffects.size > 0) {
      scheduleFlush();
    }
  }
}

export function createEffect(
  name: string,
  fn: () => void | (() => void),
  _owner = 'core',
  phase = 0
): EffectDispose {
  const id = nextEffectId++;
  let cleanup: (() => void) | undefined;
  let disposed = false;
  let shouldExecute = true; // true → run fn; false → schedule rAF
  const trigger = preactSignal(0);

  const disposePreact = preactEffect(() => {
    // Always read trigger so preact tracks it as a dependency.
    // On the "execute" branch we also read userFn's deps via fn().
    // On the "schedule" branch we only read trigger, so preact
    // narrows deps to {trigger} — signal changes between now and
    // the rAF are coalesced and picked up when fn re-runs.
    void trigger.value;

    if (disposed) return;

    if (shouldExecute) {
      shouldExecute = false;
      if (cleanup) {
        cleanup();
        cleanup = undefined;
      }
      pushEvaluatingPhase(phase, name);
      try {
        recordEffectRun(name);
        const result = fn();
        if (typeof result === 'function') {
          cleanup = result as () => void;
        }
      } finally {
        popEvaluatingPhase();
      }
      return;
    }

    // Dependency changed — defer to rAF
    pendingEffects.set(id, {
      name,
      phase,
      id,
      execute: () => {
        shouldExecute = true;
        // Incrementing trigger re-fires the preact effect which
        // now takes the shouldExecute=true branch → runs fn.
        trigger.value = trigger.peek() + 1;
      },
    });
    scheduleFlush();
  });

  return () => {
    disposed = true;
    disposePreact();
    pendingEffects.delete(id);
    if (cleanup) {
      cleanup();
      cleanup = undefined;
    }
  };
}

/** Manually flush all pending effects — call in tests after signal writes. */
export function flushEffects(): void {
  runFlush();
}

/** Reset scheduler state (for tests). */
export function resetScheduler(): void {
  pendingEffects.clear();
  nextEffectId = 0;
  rafScheduled = false;
  isFlushing = false;
}
