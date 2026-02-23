import type { GridPlugin, PluginDisposable } from '../../reactive/types';
import { UndoRedoManager } from '../../features/undo-redo';

export interface UndoRedoPluginOptions {
  maxHistorySize?: number;
  enableCommandGrouping?: boolean;
  groupingTimeWindow?: number;
}

/**
 * UndoRedoPlugin - Wraps UndoRedoManager as a reactive plugin.
 *
 * Provides undo/redo actions. Grid-core or the editing plugin can
 * record commands via the `undoRedo:record` action after each edit.
 */
export function createUndoRedoPlugin(options?: UndoRedoPluginOptions): GridPlugin {
  return {
    name: 'undoRedo',
    phase: 50,
    dependencies: ['core'],
    setup(store, api): PluginDisposable {
      store.extend('undoRedo.canUndo', false, 'undoRedo', 50);
      store.extend('undoRedo.canRedo', false, 'undoRedo', 50);

      const mgr = new UndoRedoManager({
        maxHistorySize: options?.maxHistorySize ?? 100,
        enableCommandGrouping: options?.enableCommandGrouping ?? true,
        groupingTimeWindow: options?.groupingTimeWindow ?? 1000,
      });

      function syncState(): void {
        store.set('undoRedo.canUndo', mgr.canUndo());
        store.set('undoRedo.canRedo', mgr.canRedo());
        api.fireEvent('undo-redo:change', {
          canUndo: mgr.canUndo(),
          canRedo: mgr.canRedo(),
          undoCount: mgr.getUndoCount(),
          redoCount: mgr.getRedoCount(),
        });
      }

      store.action(
        'undoRedo:undo',
        () => {
          mgr.undo();
          syncState();
        },
        'undoRedo'
      );

      store.action(
        'undoRedo:redo',
        () => {
          mgr.redo();
          syncState();
        },
        'undoRedo'
      );

      store.action(
        'undoRedo:recordCellEdit',
        (
          row: number,
          col: number,
          oldValue: any,
          newValue: any,
          setValue: (row: number, col: number, value: any) => void
        ) => {
          mgr.recordCellEdit(row, col, oldValue, newValue, setValue);
          syncState();
        },
        'undoRedo'
      );

      store.action(
        'undoRedo:clear',
        () => {
          mgr.clear();
          syncState();
        },
        'undoRedo'
      );

      api.register('undoRedo', {
        undo: () => store.exec('undoRedo:undo'),
        redo: () => store.exec('undoRedo:redo'),
        recordCellEdit: (
          row: number,
          col: number,
          oldValue: any,
          newValue: any,
          setValue: (r: number, c: number, v: any) => void
        ) => store.exec('undoRedo:recordCellEdit', row, col, oldValue, newValue, setValue),
        clear: () => store.exec('undoRedo:clear'),
        canUndo: () => store.get('undoRedo.canUndo'),
        canRedo: () => store.get('undoRedo.canRedo'),
      });

      return { teardown: [() => mgr.clear()] };
    },
  };
}
