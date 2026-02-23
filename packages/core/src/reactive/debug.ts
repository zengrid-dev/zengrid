import { RingBuffer } from '@zengrid/shared';
import type { DebugEvent } from './types';
import { signalRegistry, computedRegistry } from './tracking';

const IS_DEV = typeof process !== 'undefined' && process.env?.['NODE_ENV'] !== 'production';

const EVENT_LOG_CAPACITY = 1000;
const eventLog = new RingBuffer<DebugEvent>(EVENT_LOG_CAPACITY);

let traceCounter = 0;
let currentTraceId = 0;

export function nextTraceId(): number {
  return ++traceCounter;
}

export function setCurrentTraceId(id: number): void {
  currentTraceId = id;
}

export function getCurrentTraceId(): number {
  return currentTraceId;
}

export function clearCurrentTraceId(): void {
  currentTraceId = 0;
}

export function recordSignalWrite(name: string, oldValue: unknown, newValue: unknown): void {
  if (!IS_DEV) return;
  eventLog.push({
    traceId: currentTraceId,
    timestamp: Date.now(),
    type: 'signal-write',
    name,
    oldValue,
    newValue,
  });
}

export function recordComputedRun(name: string, value: unknown, trigger?: string): void {
  if (!IS_DEV) return;
  eventLog.push({
    traceId: currentTraceId,
    timestamp: Date.now(),
    type: 'computed-run',
    name,
    newValue: value,
    trigger,
  });
}

export function recordEffectRun(name: string): void {
  if (!IS_DEV) return;
  eventLog.push({
    traceId: currentTraceId,
    timestamp: Date.now(),
    type: 'effect-run',
    name,
  });
}

export function recordActionExec(name: string, args: unknown[]): void {
  if (!IS_DEV) return;
  eventLog.push({
    traceId: currentTraceId,
    timestamp: Date.now(),
    type: 'action-exec',
    name,
    newValue: args,
  });
}

export function getEventLog(): DebugEvent[] {
  return eventLog.toArray();
}

export function getEventsByTrace(traceId: number): DebugEvent[] {
  return eventLog.toArray().filter((e) => e.traceId === traceId);
}

export function clearEventLog(): void {
  eventLog.clear();
}

export function debugGraph(): Record<string, string[]> {
  const graph: Record<string, string[]> = {};

  for (const [name] of signalRegistry) {
    graph[name] = [];
  }

  for (const [name] of computedRegistry) {
    // We can't introspect preact's dependency graph directly,
    // but we record the computed exists and consumers can use the event log
    if (!graph[name]) {
      graph[name] = [];
    }
  }

  return graph;
}

const pluginTimings = new Map<string, number>();

export function recordPluginTiming(name: string, duration: number): void {
  pluginTimings.set(name, duration);
}

export function getPluginTimings(): Map<string, number> {
  return new Map(pluginTimings);
}

export function resetDebug(): void {
  eventLog.clear();
  traceCounter = 0;
  currentTraceId = 0;
  pluginTimings.clear();
}
