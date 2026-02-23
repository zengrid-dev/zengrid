import type { GridPlugin, PluginDisposable, GridStore } from '../../reactive/types';

interface DevToolsInstance {
  send(action: { type: string; payload?: unknown }, state: Record<string, unknown>): void;
  subscribe(listener: (message: { type: string; payload?: { type: string } }) => void): () => void;
  init(state: Record<string, unknown>): void;
}

interface DevToolsExtension {
  connect(options: { name: string }): DevToolsInstance;
}

const KNOWN_KEYS = [
  'rows.raw',
  'rows.count',
  'rows.indices',
  'rows.viewIndices',
  'rows.viewCount',
  'sort.state',
  'pipeline.sort',
  'filter.state',
  'pipeline.filter',
  'scroll.top',
  'scroll.left',
  'viewport.width',
  'viewport.height',
  'viewport.visibleRows',
  'viewport.visibleCols',
  'selection.ranges',
  'selection.active',
  'editing.active',
  'undoRedo.canUndo',
  'undoRedo.canRedo',
];

function serializeStoreState(store: GridStore): Record<string, unknown> {
  const state: Record<string, unknown> = {};
  for (const key of KNOWN_KEYS) {
    try {
      const val = store.getUnphased(key);
      if (val !== undefined) {
        state[key] = val;
      }
    } catch (_) {
      // key doesn't exist yet
    }
  }
  return state;
}

export interface DevToolsConnectorOptions {
  name?: string;
}

export function createDevToolsConnector(options?: DevToolsConnectorOptions): GridPlugin {
  return {
    name: 'devtools',
    phase: 300,
    dependencies: ['core'],
    setup(store): PluginDisposable {
      const teardown: Array<() => void> = [];

      if (typeof window === 'undefined') {
        return { teardown };
      }

      const ext = (window as unknown as Record<string, unknown>).__REDUX_DEVTOOLS_EXTENSION__ as
        | DevToolsExtension
        | undefined;
      if (!ext) {
        return { teardown };
      }

      const devtools = ext.connect({ name: options?.name ?? 'ZenGrid Store' });

      // Send initial state
      devtools.init(serializeStoreState(store));

      // Wrap store.exec to intercept all actions
      const originalExec = store.exec.bind(store);
      store.exec = (name: string, ...args: unknown[]) => {
        const result = originalExec(name, ...args);
        devtools.send(
          { type: name, payload: args.length === 1 ? args[0] : args.length > 1 ? args : undefined },
          serializeStoreState(store)
        );
        return result;
      };

      // Subscribe to time-travel (basic dispatch handling)
      const unsubscribe = devtools.subscribe((message) => {
        if (message.type === 'DISPATCH' && message.payload?.type === 'JUMP_TO_STATE') {
          // Time-travel support is intentionally minimal — just log
        }
      });

      teardown.push(() => {
        // Restore original exec
        store.exec = originalExec;
        unsubscribe();
      });

      return { teardown };
    },
  };
}
