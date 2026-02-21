import type {
  WrappedSignal,
  WrappedComputed,
  ActionHandler,
  ActionRegistration,
  EffectDispose,
  GridStore as IGridStore,
} from './types';
import { createSignal, createComputed } from './signal';
import { createEffect } from './effect-scheduler';
import {
  signalRegistry,
  computedRegistry,
  checkPhase,
  getOrCreatePlaceholder,
  activatePhantom,
  registerOwnership,
  getOwnedNames,
  removeOwnership,
  resetTracking,
} from './tracking';
import {
  recordActionExec,
  debugGraph as debugGraphFn,
} from './debug';

export class GridStoreImpl implements IGridStore {
  private signals = new Map<string, WrappedSignal>();
  private computeds = new Map<string, WrappedComputed>();
  private effects = new Map<string, EffectDispose>();
  private actions = new Map<string, ActionRegistration>();
  private disposables = new Map<string, Array<() => void>>();
  private executingActions = new Set<string>();

  extend(
    key: string,
    initial: unknown,
    owner: string,
    phase = 0,
  ): void {
    if (this.signals.has(key) || this.computeds.has(key)) {
      throw new Error(`Store key "${key}" already exists`);
    }

    const wrapped = createSignal(key, initial, owner, phase);
    this.signals.set(key, wrapped);

    // Activate phantom deps — any computed that previously read this
    // key got a placeholder; write the real value to trigger recompute.
    activatePhantom(key, initial);
  }

  computed(
    key: string,
    fn: () => unknown,
    owner: string,
    phase = 0,
  ): void {
    if (this.signals.has(key) || this.computeds.has(key)) {
      throw new Error(`Store key "${key}" already exists`);
    }

    const wrapped = createComputed(key, fn, owner, phase);
    this.computeds.set(key, wrapped);
  }

  effect(
    name: string,
    fn: () => void | (() => void),
    owner: string,
    phase = 0,
  ): void {
    if (this.effects.has(name)) {
      throw new Error(`Effect "${name}" already registered`);
    }

    const dispose = createEffect(name, fn, owner, phase);
    this.effects.set(name, dispose);
    registerOwnership(owner, name);
  }

  get(key: string): unknown {
    // Check signals first
    const sig = this.signals.get(key);
    if (sig) {
      checkPhase(sig.metadata.phase);
      return sig.value;
    }

    // Check computeds
    const comp = this.computeds.get(key);
    if (comp) {
      checkPhase(comp.metadata.phase);
      return comp.value;
    }

    // Phantom dep: key doesn't exist yet.
    // Return placeholder's value (undefined), which establishes
    // a preact dependency that will fire when extend() is called.
    const placeholder = getOrCreatePlaceholder(key);
    return placeholder.value;
  }

  getUnphased(key: string): unknown {
    const sig = this.signals.get(key);
    if (sig) return sig.value;

    const comp = this.computeds.get(key);
    if (comp) return comp.value;

    const placeholder = getOrCreatePlaceholder(key);
    return placeholder.value;
  }

  getRow(dataIndex: number): unknown {
    const rows = this.get('rows.raw') as unknown[];
    return rows?.[dataIndex];
  }

  action(name: string, handler: ActionHandler, owner: string): void {
    if (this.actions.has(name)) {
      throw new Error(`Action "${name}" already registered`);
    }
    this.actions.set(name, { handler, owner });
    registerOwnership(owner, name);
  }

  exec(name: string, ...args: unknown[]): void | { undo: () => void } {
    const reg = this.actions.get(name);
    if (!reg) {
      throw new Error(`Action "${name}" not found`);
    }

    if (this.executingActions.has(name)) {
      throw new Error(`Re-entrant action "${name}" — already executing`);
    }

    this.executingActions.add(name);
    try {
      recordActionExec(name, args);
      return reg.handler(...args);
    } finally {
      this.executingActions.delete(name);
    }
  }

  addDisposable(owner: string, dispose: () => void): void {
    let list = this.disposables.get(owner);
    if (!list) {
      list = [];
      this.disposables.set(owner, list);
    }
    list.push(dispose);
  }

  disposePlugin(owner: string): void {
    // Dispose effects owned by this plugin
    const owned = getOwnedNames(owner);
    for (const name of owned) {
      const effectDispose = this.effects.get(name);
      if (effectDispose) {
        effectDispose();
        this.effects.delete(name);
      }
      this.signals.delete(name);
      this.computeds.delete(name);
      signalRegistry.delete(name);
      computedRegistry.delete(name);
      this.actions.delete(name);
    }

    // Dispose arbitrary disposables
    const list = this.disposables.get(owner);
    if (list) {
      for (const dispose of list) {
        dispose();
      }
      this.disposables.delete(owner);
    }

    removeOwnership(owner);
  }

  disposeAll(): void {
    // Dispose all effects
    for (const dispose of this.effects.values()) {
      dispose();
    }
    this.effects.clear();

    // Dispose all disposables
    for (const list of this.disposables.values()) {
      for (const dispose of list) {
        dispose();
      }
    }
    this.disposables.clear();

    this.signals.clear();
    this.computeds.clear();
    this.actions.clear();
    this.executingActions.clear();

    resetTracking();
  }

  debugGraph(): Record<string, string[]> {
    return debugGraphFn();
  }
}
