import { signal as preactSignal, type Signal } from '@preact/signals-core';
import type { WrappedSignal, WrappedComputed } from './types';

// --- Registries ---

export const signalRegistry = new Map<string, WrappedSignal>();
export const computedRegistry = new Map<string, WrappedComputed>();
export const ownershipMap = new Map<string, Set<string>>();

// --- Phase enforcement ---

interface EvalFrame {
  phase: number;
  name: string;
}

const evaluationStack: EvalFrame[] = [];

export function pushEvaluatingPhase(phase: number, name: string): void {
  evaluationStack.push({ phase, name });
}

export function popEvaluatingPhase(): void {
  evaluationStack.pop();
}

export function checkPhase(targetPhase: number): void {
  if (evaluationStack.length === 0) return;
  const current = evaluationStack[evaluationStack.length - 1];
  if (targetPhase > current.phase) {
    throw new Error(
      `Phase violation: "${current.name}" (phase ${current.phase}) cannot read signal at phase ${targetPhase}`
    );
  }
}

export function getCurrentEvalPhase(): EvalFrame | undefined {
  return evaluationStack.length > 0 ? evaluationStack[evaluationStack.length - 1] : undefined;
}

// --- Phantom dependencies ---

const placeholders = new Map<string, Signal<unknown>>();
const phantomSubscribers = new Map<string, Set<Signal<unknown>>>();

export function getOrCreatePlaceholder(key: string): Signal<unknown> {
  let ph = placeholders.get(key);
  if (!ph) {
    ph = preactSignal<unknown>(undefined);
    placeholders.set(key, ph);
  }
  return ph;
}

export function activatePhantom(key: string, realValue: unknown): void {
  const ph = placeholders.get(key);
  if (ph) {
    // Write the real value into the placeholder — this triggers all preact dependents
    ph.value = realValue;
    placeholders.delete(key);
    phantomSubscribers.delete(key);
  }
}

export function hasPlaceholder(key: string): boolean {
  return placeholders.has(key);
}

// --- Ownership helpers ---

export function registerOwnership(owner: string, name: string): void {
  let set = ownershipMap.get(owner);
  if (!set) {
    set = new Set();
    ownershipMap.set(owner, set);
  }
  set.add(name);
}

export function getOwnedNames(owner: string): Set<string> {
  return ownershipMap.get(owner) ?? new Set();
}

export function removeOwnership(owner: string): void {
  ownershipMap.delete(owner);
}

// --- Reset (for tests) ---

export function resetTracking(): void {
  signalRegistry.clear();
  computedRegistry.clear();
  ownershipMap.clear();
  evaluationStack.length = 0;
  placeholders.clear();
  phantomSubscribers.clear();
}
