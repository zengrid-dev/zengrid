import type { GridPlugin, PluginDisposable } from '../../reactive/types';
import type { CellRef } from '../../types';

export interface EditingPluginOptions {
  headerHeight?: number;
}

/**
 * EditingPlugin - Manages cell editing lifecycle via store actions.
 *
 * Bridges to the existing EditorManager. The plugin itself does not create
 * or own the EditorManager — grid-core wires it via the `editing:bind` action
 * after constructing the EditorManager with DOM references.
 *
 * This keeps the plugin free of DOM dependencies while the legacy bridge
 * still exists.
 */
export function createEditingPlugin(_options?: EditingPluginOptions): GridPlugin {
  return {
    name: 'editing',
    phase: 45,
    dependencies: ['core', 'selection'],
    setup(store, api): PluginDisposable {
      store.extend('editing.active', null as CellRef | null, 'editing', 45);

      // EditorManager reference, set via editing:bind action from grid-core
      let editorManager: any = null;

      store.action(
        'editing:bind',
        (mgr: any) => {
          editorManager = mgr;
        },
        'editing'
      );

      store.action(
        'editing:startEdit',
        (cell: CellRef) => {
          if (!editorManager) return;
          if (store.get('editing.active')) return; // already editing
          editorManager.startEdit(cell);
          store.set('editing.active', cell);
          api.fireEvent('edit:start', { cell, value: editorManager.getCurrentValue?.() });
        },
        'editing'
      );

      store.action(
        'editing:commitEdit',
        (value?: any) => {
          if (!editorManager) return;
          const cell = store.get('editing.active') as CellRef | null;
          if (!cell) return;
          const oldValue = editorManager.getOriginalValue?.();
          editorManager.commitEdit?.();
          store.set('editing.active', null);
          api.fireEvent('edit:commit', { cell, oldValue, newValue: value });
          api.fireEvent('edit:end', { cell, value, cancelled: false });
        },
        'editing'
      );

      store.action(
        'editing:cancelEdit',
        () => {
          if (!editorManager) return;
          const cell = store.get('editing.active') as CellRef | null;
          editorManager.cancelEdit?.();
          store.set('editing.active', null);
          if (cell) {
            api.fireEvent('edit:cancel', { cell, value: undefined });
            api.fireEvent('edit:end', { cell, value: undefined, cancelled: true });
          }
        },
        'editing'
      );

      api.register('editing', {
        startEdit: (cell: CellRef) => store.exec('editing:startEdit', cell),
        commitEdit: (value?: any) => store.exec('editing:commitEdit', value),
        cancelEdit: () => store.exec('editing:cancelEdit'),
        getActive: () => store.get('editing.active'),
        isEditing: () => store.get('editing.active') !== null,
        bind: (mgr: any) => store.exec('editing:bind', mgr),
      });

      return {
        teardown: [
          () => {
            editorManager = null;
          },
        ],
      };
    },
  };
}
