import type { GridPlugin, PluginDisposable } from '../../reactive/types';
import type { CellRef, GridOptions, GridState } from '../../types';
import type { EventEmitter } from '../../events/event-emitter';
import type { GridEvents } from '../../events/grid-events';
import type { ColumnModel } from '../../features/columns/column-model';
import { EditorManager } from '../../editing/editor-manager';

export interface EditingPluginOptions {
  options?: GridOptions;
  state?: GridState;
  container?: HTMLElement;
  events?: EventEmitter<GridEvents>;
  getColumnModel?: () => ColumnModel | null;
  getDataAccessor?: () => any;
}

export function createEditingPlugin(pluginOpts?: EditingPluginOptions): GridPlugin {
  return {
    name: 'editing',
    phase: 45,
    dependencies: ['core'],
    setup(store, api): PluginDisposable {
      store.extend('editing.active', null as CellRef | null, 'editing', 45);

      let editorManager: any = null;
      const eventUnsubs: Array<() => void> = [];
      const domCleanups: Array<() => void> = [];

      store.action(
        'editing:bind',
        (mgr: any) => {
          editorManager = mgr;
        },
        'editing'
      );

      store.action(
        'editing:setup',
        () => {
          if (!pluginOpts) return;
          const { options, state, container, events, getColumnModel, getDataAccessor } = pluginOpts;
          if (!options || !state || !container || !events) return;

          const scrollContainer = store.get('dom.scrollContainer') as HTMLElement | null;
          if (!scrollContainer) return;

          const mapViewRowToDataRow = (viewRow: number): number => {
            const viewIndices = store.get('rows.viewIndices') as number[] | undefined;
            return viewIndices?.[viewRow] ?? viewRow;
          };

          const mapViewColToDataCol = (viewCol: number): number => {
            const columnModel = getColumnModel?.();
            if (!columnModel) return viewCol;
            const orderedColumns = columnModel.getVisibleColumnsInOrder();
            return orderedColumns?.[viewCol]?.dataIndex ?? viewCol;
          };

          if (!editorManager) {
            editorManager = new EditorManager({
              container,
              scrollContainer,
              getValue: (row, col) => {
                const dataRow = mapViewRowToDataRow(row);
                const dataCol = mapViewColToDataCol(col);
                return getDataAccessor?.()?.getValue(dataRow, dataCol);
              },
              setValue: (row, col, value) => {
                const dataRow = mapViewRowToDataRow(row);
                const dataCol = mapViewColToDataCol(col);
                const rowData = state.data[dataRow];
                if (Array.isArray(rowData)) {
                  rowData[dataCol] = value;
                }
                store.exec('rendering:updateCells', [{ row, col }]);
              },
              getColumn: (col) => {
                const dataCol = mapViewColToDataCol(col);
                return options.columns?.[dataCol];
              },
              getRowData: (row) => {
                const dataRow = mapViewRowToDataRow(row);
                return state.data[dataRow];
              },
              getCellElement: (row, col) =>
                container.querySelector(
                  `.zg-cell[data-row="${row}"][data-col="${col}"]`
                ) as HTMLElement | null,
              onEditStart: (cell) => {
                state.editingCell = cell;
                store.exec('rendering:refreshSelectionClasses');
              },
              onEditEnd: () => {
                state.editingCell = null;
                store.set('editing.active', null as any);
                store.exec('rendering:refreshSelectionClasses');
              },
            });

            store.exec('editing:bind', editorManager);

            eventUnsubs.push(
              events.on('scroll', () => {
                editorManager?.updateEditorPosition();
              })
            );

            eventUnsubs.push(
              events.on('viewport:resized' as any, () => {
                editorManager?.updateEditorPosition();
              })
            );
          }

          // Dblclick to start editing
          const dblclickHandler = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const cell = target.closest('.zg-cell[data-row][data-col]') as HTMLElement;
            if (!cell) return;

            const row = parseInt(cell.dataset['row'] || '0', 10);
            const col = parseInt(cell.dataset['col'] || '0', 10);
            const dataCol = mapViewColToDataCol(col);
            const column = options.columns?.[dataCol];
            if (column?.editable && column.editor) {
              event.preventDefault();
              event.stopPropagation();
              store.exec('editing:startEdit', { row, col });
            }
          };
          scrollContainer.addEventListener('dblclick', dblclickHandler);
          domCleanups.push(() => scrollContainer.removeEventListener('dblclick', dblclickHandler));

          // Enter key to start editing
          const keydownHandler = (event: KeyboardEvent) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
              const activeCell = state.activeCell;
              if (activeCell && !state.editingCell) {
                const dataCol = mapViewColToDataCol(activeCell.col);
                const column = options.columns?.[dataCol];
                if (column?.editable && column.editor) {
                  event.preventDefault();
                  event.stopPropagation();
                  store.exec('editing:startEdit', activeCell);
                }
              }
            }
          };
          container.addEventListener('keydown', keydownHandler);
          domCleanups.push(() => container.removeEventListener('keydown', keydownHandler));
        },
        'editing'
      );

      store.action(
        'editing:startEdit',
        (cell: CellRef) => {
          if (!editorManager) return;
          if (store.get('editing.active')) return;
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
        setup: () => store.exec('editing:setup'),
      });

      return {
        teardown: [
          () => {
            for (const unsub of eventUnsubs) unsub();
            eventUnsubs.length = 0;
            for (const cleanup of domCleanups) cleanup();
            domCleanups.length = 0;
            editorManager?.destroy();
            editorManager = null;
          },
        ],
      };
    },
  };
}
