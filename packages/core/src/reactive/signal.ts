import {
  signal as preactSignal,
  computed as preactComputed,
  batch as preactBatch,
  untracked,
} from '@preact/signals-core';
import type { WrappedSignal, WrappedComputed, SignalMetadata } from './types';
import {
  signalRegistry,
  computedRegistry,
  registerOwnership,
  pushEvaluatingPhase,
  popEvaluatingPhase,
} from './tracking';
import {
  recordSignalWrite,
  recordComputedRun,
  nextTraceId,
  setCurrentTraceId,
  clearCurrentTraceId,
} from './debug';

export { untracked };

export function createSignal<T>(
  name: string,
  initial: T,
  owner = 'core',
  phase = 0
): WrappedSignal<T> {
  const raw = preactSignal<T>(initial);

  const metadata: SignalMetadata = {
    name,
    owner,
    phase,
    createdAt: Date.now(),
  };

  const wrapped: WrappedSignal<T> = {
    get value(): T {
      return raw.value;
    },
    set value(v: T) {
      const old = raw.peek();
      raw.value = v;
      recordSignalWrite(name, old, v);
    },
    peek(): T {
      return raw.peek();
    },
    metadata,
    __signal: raw,
  };

  signalRegistry.set(name, wrapped as WrappedSignal);
  registerOwnership(owner, name);

  return wrapped;
}

export function createComputed<T>(
  name: string,
  fn: () => T,
  owner = 'core',
  phase = 0
): WrappedComputed<T> {
  const wrappedFn = () => {
    pushEvaluatingPhase(phase, name);
    try {
      const result = fn();
      recordComputedRun(name, result);
      return result;
    } finally {
      popEvaluatingPhase();
    }
  };

  const raw = preactComputed<T>(wrappedFn);

  const metadata: SignalMetadata = {
    name,
    owner,
    phase,
    createdAt: Date.now(),
  };

  const wrapped: WrappedComputed<T> = {
    get value(): T {
      return raw.value;
    },
    metadata,
    __computed: raw,
  };

  computedRegistry.set(name, wrapped as WrappedComputed);
  registerOwnership(owner, name);

  return wrapped;
}

export function gridBatch(fn: () => void): void {
  const id = nextTraceId();
  setCurrentTraceId(id);
  try {
    preactBatch(fn);
  } finally {
    clearCurrentTraceId();
  }
}
