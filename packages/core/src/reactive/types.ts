import type { Signal, ReadonlySignal } from '@preact/signals-core';

export interface SignalMetadata {
  name: string;
  owner: string;
  phase: number;
  createdAt: number;
}

export interface WrappedSignal<T = unknown> {
  value: T;
  peek(): T;
  metadata: SignalMetadata;
  readonly __signal: Signal<T>;
}

export interface WrappedComputed<T = unknown> {
  readonly value: T;
  metadata: SignalMetadata;
  readonly __computed: ReadonlySignal<T>;
}

export type EffectDispose = () => void;

export type ActionHandler = (...args: any[]) => void | { undo: () => void };

export interface ActionRegistration {
  handler: ActionHandler;
  owner: string;
}

export interface PipelinePhase {
  name: string;
  phase: number;
  key: string;
}

export interface DebugEvent {
  traceId: number;
  timestamp: number;
  type: 'signal-write' | 'computed-run' | 'effect-run' | 'action-exec';
  name: string;
  oldValue?: unknown;
  newValue?: unknown;
  trigger?: string;
}

// Declaration-merged interface for store keys
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StoreKeys {
  'rows.raw': unknown[];
  'rows.indices': number[];
  'rows.viewIndices': number[];
  'rows.viewCount': number;
}

export interface GridStore {
  extend(key: string, initial: unknown, owner: string, phase?: number): void;
  computed(key: string, fn: () => unknown, owner: string, phase?: number): void;
  effect(name: string, fn: () => void | (() => void), owner: string, phase?: number): void;
  get(key: string): unknown;
  getUnphased(key: string): unknown;
  getRow(dataIndex: number): unknown;
  action(name: string, handler: ActionHandler, owner: string): void;
  exec(name: string, ...args: unknown[]): void | { undo: () => void };
  addDisposable(owner: string, dispose: () => void): void;
  disposePlugin(owner: string): void;
  disposeAll(): void;
  debugGraph(): Record<string, string[]>;
}
