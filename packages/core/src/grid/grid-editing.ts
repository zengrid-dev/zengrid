import type { GridOptions, GridState, CellRef } from '../types';
import type { EventEmitter } from '../events/event-emitter';
import type { GridEvents } from '../events/grid-events';
import { EditorManager } from '../editing/editor-manager';
import type { CellPositioner } from '../rendering/cell-positioner';

export interface EditingCallbacks {
  getValue: (row: number, col: number) => any;
  setValue: (row: number, col: number, value: any) => void;
  getColumn: (col: number) => any;
  getCellElement: (row: number, col: number) => HTMLElement | null;
  getPositioner: () => CellPositioner | null;
}

/**
 * Manages cell editing functionality for the grid
 */
export class GridEditing {
  private container: HTMLElement;
  private scrollContainer: HTMLElement | null;
  private options: GridOptions;
  private state: GridState;
  private events: EventEmitter<GridEvents>;
  private editorManager: EditorManager | null = null;
  private callbacks: EditingCallbacks;
  private scrollHandler: ((event: Event) => void) | null = null;

  constructor(
    container: HTMLElement,
    scrollContainer: HTMLElement | null,
    options: GridOptions,
    state: GridState,
    events: EventEmitter<GridEvents>,
    callbacks: EditingCallbacks
  ) {
    this.container = container;
    this.scrollContainer = scrollContainer;
    this.options = options;
    this.state = state;
    this.events = events;
    this.callbacks = callbacks;
  }

  /**
   * Initialize editor manager
   */
  initialize(): void {
    this.editorManager = new EditorManager({
      container: this.container,
      scrollContainer: this.scrollContainer ?? undefined,
      headerHeight: 40,
      events: this.events,
      getValue: this.callbacks.getValue,
      setValue: (row: number, col: number, value: any) => {
        this.callbacks.setValue(row, col, value);
        const positioner = this.callbacks.getPositioner();
        if (positioner) {
          positioner.refresh();
        }
      },
      getColumn: this.callbacks.getColumn,
      getCellElement: this.callbacks.getCellElement,
      onEditStart: (cell: CellRef) => {
        this.state.editingCell = cell;
      },
      onEditEnd: (_cell: CellRef, _cancelled: boolean) => {
        this.state.editingCell = null;
      },
    });

    this.setupEditingEvents();
  }

  /**
   * Set up cell editing event listeners
   */
  private setupEditingEvents(): void {
    if (!this.scrollContainer || !this.editorManager) return;

    this.scrollContainer.addEventListener('dblclick', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const cell = target.closest('.zg-cell[data-row][data-col]') as HTMLElement;

      if (cell) {
        const row = parseInt(cell.dataset.row || '0', 10);
        const col = parseInt(cell.dataset.col || '0', 10);

        const column = this.options.columns?.[col];
        if (column?.editable && column.editor) {
          event.preventDefault();
          event.stopPropagation();
          this.editorManager?.startEdit({ row, col });
        }
      }
    });

    this.container.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        const activeCell = this.state.activeCell;
        if (activeCell && !this.state.editingCell) {
          const column = this.options.columns?.[activeCell.col];
          if (column?.editable && column.editor) {
            event.preventDefault();
            event.stopPropagation();
            this.editorManager?.startEdit(activeCell);
          }
        }
      }
    });

    this.scrollHandler = () => {
      if (this.editorManager?.isEditing()) {
        this.editorManager.updateEditorPosition();
      }
    };
    this.scrollContainer.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  /**
   * Get editor manager instance
   */
  getEditorManager(): EditorManager | null {
    return this.editorManager;
  }

  /**
   * Cleanup editor manager
   */
  cleanup(): void {
    if (this.scrollContainer && this.scrollHandler) {
      this.scrollContainer.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }

    if (this.editorManager) {
      this.editorManager.cancelEdit();
      this.editorManager = null;
    }
  }
}
