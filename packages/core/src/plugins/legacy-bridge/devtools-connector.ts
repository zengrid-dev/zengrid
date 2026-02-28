import type { GridPlugin, PluginDisposable, GridStore } from '../../reactive/types';
import { getCurrentParentAction } from '../../reactive/debug';

interface DevToolsInstance {
  send(action: { type: string; payload?: unknown }, state: Record<string, unknown>): void;
  subscribe(listener: (message: { type: string; payload?: { type: string } }) => void): () => void;
  init(state: Record<string, unknown>): void;
}

interface DevToolsExtension {
  connect(options: { name: string; features?: Record<string, boolean> }): DevToolsInstance;
}

/**
 * All store keys registered by plugins.
 * Grouped by plugin for maintainability.
 */
const KNOWN_KEYS = [
  // core
  'rows.raw',
  'rows.count',
  'rows.indices',
  'rows.viewIndices',
  'rows.viewCount',

  // dom
  'dom.viewport',
  'dom.scrollContainer',
  'dom.canvas',
  'dom.headerContainer',

  // sort
  'sort.state',
  'pipeline.sort',

  // filter
  'filter.state',
  'filter.quickFilter',
  'pipeline.filter',

  // scroll
  'scroll.top',
  'scroll.left',

  // resize / viewport
  'viewport.width',
  'viewport.height',
  'viewport.visibleRows',
  'viewport.visibleCols',

  // selection
  'selection.ranges',
  'selection.active',

  // editing
  'editing.active',

  // undo/redo
  'undoRedo.canUndo',
  'undoRedo.canRedo',

  // rendering
  'rendering.initialized',

  // pagination
  'pagination.currentPage',
  'pagination.pageSize',
  'pagination.totalPages',

  // column
  'column.model',

  // infinite scroll
  'infiniteScroll.loading',
];

function serializeValue(val: unknown): unknown {
  if (val === null || val === undefined) return val;
  if (val instanceof HTMLElement) return `<${val.tagName.toLowerCase()}>`;
  if (typeof val === 'function') return '[Function]';
  if (Array.isArray(val) && val.length > 100) {
    return { __truncated: true, length: val.length, first5: val.slice(0, 5) };
  }
  if (typeof val === 'object' && val !== null && 'getVisibleCount' in val) {
    // ColumnModel — serialize a useful summary instead of the whole object
    const cm = val as { getVisibleCount(): number; getColumnCount(): number };
    return { visibleCount: cm.getVisibleCount(), totalCount: cm.getColumnCount() };
  }
  return val;
}

function serializeStoreState(store: GridStore): Record<string, unknown> {
  const state: Record<string, unknown> = {};
  for (const key of KNOWN_KEYS) {
    try {
      const val = store.getUnphased(key);
      if (val !== undefined) {
        state[key] = serializeValue(val);
      }
    } catch {
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

      const ext = (window as unknown as Record<string, unknown>)['__REDUX_DEVTOOLS_EXTENSION__'] as
        | DevToolsExtension
        | undefined;
      if (!ext) {
        return { teardown };
      }

      const devtools = ext.connect({
        name: options?.name ?? 'ZenGrid Store',
        features: { jump: false, skip: false },
      });

      // Send initial state
      devtools.init(serializeStoreState(store));

      // Wrap store.exec to intercept all actions
      const originalExec = store.exec.bind(store);
      store.exec = (name: string, ...args: unknown[]) => {
        const parentAction = getCurrentParentAction();
        const result = originalExec(name, ...args);

        const payload: Record<string, unknown> = {};
        if (args.length === 1) payload.args = args[0];
        else if (args.length > 1) payload.args = args;
        if (parentAction) payload.parent = parentAction;

        devtools.send(
          { type: name, payload: Object.keys(payload).length > 0 ? payload : undefined },
          serializeStoreState(store)
        );
        return result;
      };

      // Wrap store.set to track direct signal writes
      const originalSet = store.set.bind(store);
      store.set = (key: string, value: unknown) => {
        originalSet(key, value);
        devtools.send(
          { type: `[set] ${key}`, payload: serializeValue(value) },
          serializeStoreState(store)
        );
      };

      teardown.push(() => {
        store.exec = originalExec;
        store.set = originalSet;
      });

      return { teardown };
    },
  };
}
