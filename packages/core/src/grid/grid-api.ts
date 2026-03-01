import type { GridStore, GridApi } from '../reactive/types';

interface EventEmitterLike {
  emit(event: string, data: unknown): void;
}

export class GridApiImpl implements GridApi {
  private namespaces = new Map<string, Record<string, Function>>();

  constructor(
    private store: GridStore,
    private eventEmitter: EventEmitterLike
  ) {}

  register(namespace: string, methods: Record<string, Function>): void {
    if (this.namespaces.has(namespace)) {
      throw new Error(`Namespace "${namespace}" already registered`);
    }
    this.namespaces.set(namespace, methods);
  }

  exec(action: string, ...args: unknown[]): void | { undo: () => void } {
    return this.store.exec(action, ...args);
  }

  fireEvent(name: string, data: unknown): void {
    this.eventEmitter.emit(name, data);
  }

  getMethod(namespace: string, method: string): Function | undefined {
    return this.namespaces.get(namespace)?.[method];
  }

  getNamespaces(): string[] {
    return Array.from(this.namespaces.keys());
  }
}
