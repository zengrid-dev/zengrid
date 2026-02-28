import { signal, type Signal, type WritableSignal } from '@angular/core';
import type { GridStore } from '@zengrid/core';

export function bridgeStoreSignal<T>(store: GridStore, key: string): Signal<T> {
  const angularSignal: WritableSignal<T> = signal(store.get(key) as T);

  store.effect(
    `angular-bridge:${key}`,
    () => {
      const value = store.get(key) as T;
      angularSignal.set(value);
    },
    'angular-bridge'
  );

  return angularSignal.asReadonly();
}
