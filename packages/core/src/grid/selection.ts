import type { GridOptions, GridState, CellRef } from '../types';
import type { EventEmitter } from '../events/event-emitter';
import type { GridEvents } from '../events/grid-events';
import { SelectionManager } from '../features/selection';

export interface GridSelectionCallbacks {
  onRefresh: () => void;
  getValue: (row: number, col: number) => any;
  mapRowToDataIndex: (row: number) => number | undefined;
}

/**
 * GridSelection - Handles selection interactions and state syncing
 */
export class GridSelection {
  private container: HTMLElement;
  private options: GridOptions;
  private state: GridState;
  private events: EventEmitter<GridEvents>;
  private scrollContainer: HTMLElement | null;
  private callbacks: GridSelectionCallbacks;
  private selectionManager: SelectionManager | null = null;
  private anchorCell: CellRef | null = null;
  private selectionUnsubscribe: (() => void) | null = null;

  constructor(
    container: HTMLElement,
    options: GridOptions,
    state: GridState,
    events: EventEmitter<GridEvents>,
    scrollContainer: HTMLElement | null,
    callbacks: GridSelectionCallbacks
  ) {
    this.container = container;
    this.options = options;
    this.state = state;
    this.events = events;
    this.scrollContainer = scrollContainer;
    this.callbacks = callbacks;
  }

  initialize(): void {
    if (!this.scrollContainer) return;

    // Always attach click/dblclick/contextmenu listeners — these are
    // general cell interaction events, independent of selection.
    this.attachListeners();

    if (this.options.enableSelection === false) return;

    const mode = this.options.enableMultiSelection ? 'multiple' : 'single';

    this.selectionManager = new SelectionManager({
      mode,
      enableRowSelection: true,
      enableColumnSelection: true,
      events: this.events,
    });

    this.selectionUnsubscribe = this.events.on('selection:change', (payload) => {
      this.handleSelectionChange(payload.ranges);
    });
  }

  private attachListeners(): void {
    if (!this.scrollContainer) return;

    this.scrollContainer.addEventListener('click', this.handleCellClick);
    this.scrollContainer.addEventListener('contextmenu', this.handleContextMenu);
    this.scrollContainer.addEventListener('dblclick', this.handleCellDoubleClick);
  }

  private handleCellClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const cell = target.closest('.zg-cell[data-row][data-col]') as HTMLElement;
    if (!cell) return;

    const row = parseInt(cell.dataset.row || '0', 10);
    const col = parseInt(cell.dataset.col || '0', 10);
    const dataRow = this.callbacks.mapRowToDataIndex(row) ?? row;

    // Emit click event
    this.events.emit('cell:click', {
      cell: { row, col },
      value: this.callbacks.getValue(dataRow, col),
      nativeEvent: event,
    });
    if (this.options.onCellClick) {
      this.options.onCellClick(row, col);
    }

    // Update active cell
    this.state.activeCell = { row, col };

    if (!this.selectionManager) return;

    const additive = (event.ctrlKey || event.metaKey) && this.options.enableMultiSelection;
    const selectionType = this.options.selectionType ?? 'cell';

    if (event.shiftKey && this.anchorCell) {
      if (selectionType === 'row') {
        this.selectionManager.selectRows(this.anchorCell.row, row, additive);
      } else if (selectionType === 'column') {
        this.selectionManager.selectColumns(this.anchorCell.col, col, additive);
      } else {
        this.selectionManager.selectRange(
          this.anchorCell.row,
          this.anchorCell.col,
          row,
          col,
          additive
        );
      }
    } else {
      switch (selectionType) {
        case 'row':
          this.selectionManager.selectRows(row, row, additive);
          break;
        case 'column':
          this.selectionManager.selectColumns(col, col, additive);
          break;
        case 'range':
          this.selectionManager.selectRange(row, col, row, col, additive);
          break;
        default:
          this.selectionManager.selectCell(row, col, additive);
      }
      this.anchorCell = { row, col };
    }
  };

  private handleCellDoubleClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const cell = target.closest('.zg-cell[data-row][data-col]') as HTMLElement;
    if (!cell) return;

    const row = parseInt(cell.dataset.row || '0', 10);
    const col = parseInt(cell.dataset.col || '0', 10);
    const dataRow = this.callbacks.mapRowToDataIndex(row) ?? row;

    this.events.emit('cell:doubleClick', {
      cell: { row, col },
      value: this.callbacks.getValue(dataRow, col),
      nativeEvent: event,
    });

    if (this.options.onCellDoubleClick) {
      this.options.onCellDoubleClick(row, col);
    }
  };

  private handleContextMenu = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const cell = target.closest('.zg-cell[data-row][data-col]') as HTMLElement;
    if (!cell) return;

    const row = parseInt(cell.dataset.row || '0', 10);
    const col = parseInt(cell.dataset.col || '0', 10);
    const dataRow = this.callbacks.mapRowToDataIndex(row) ?? row;

    this.events.emit('cell:contextMenu', {
      cell: { row, col },
      value: this.callbacks.getValue(dataRow, col),
      nativeEvent: event,
    });

    if (this.options.onCellContextMenu) {
      this.options.onCellContextMenu(row, col, event);
    }
  };

  private handleSelectionChange(ranges: Array<{ startRow: number; endRow: number; startCol: number; endCol: number }>): void {
    this.state.selection = ranges.map(range => ({
      startRow: range.startRow,
      endRow: range.endRow,
      startCol: range.startCol,
      endCol: range.endCol,
    }));

    if (this.options.onSelectionChange) {
      this.options.onSelectionChange(this.state.selection);
    }

    this.updateHeaderCheckbox();
    this.callbacks.onRefresh();
  }

  private updateHeaderCheckbox(): void {
    const checkbox = this.container.querySelector('.zg-header-checkbox-input') as HTMLInputElement | null;
    if (!checkbox) return;

    if (this.options.selectionType && this.options.selectionType !== 'row') {
      checkbox.indeterminate = false;
      checkbox.checked = false;
      return;
    }

    const rowCount = this.options.rowCount;
    const hasSelection = this.state.selection.length > 0;
    const hasFullRange = this.state.selection.some(range =>
      range.startRow <= 0 && range.endRow >= rowCount - 1
    );

    checkbox.checked = hasFullRange;
    checkbox.indeterminate = hasSelection && !hasFullRange;
  }

  clearSelection(): void {
    this.selectionManager?.clearSelection();
  }

  selectAllRows(rowCount: number): void {
    if (!this.selectionManager || rowCount <= 0) return;
    this.selectionManager.selectRows(0, rowCount - 1, false);
  }

  destroy(): void {
    if (this.scrollContainer) {
      this.scrollContainer.removeEventListener('click', this.handleCellClick);
      this.scrollContainer.removeEventListener('contextmenu', this.handleContextMenu);
      this.scrollContainer.removeEventListener('dblclick', this.handleCellDoubleClick);
    }
    if (this.selectionUnsubscribe) {
      this.selectionUnsubscribe();
      this.selectionUnsubscribe = null;
    }
    this.selectionManager?.destroy();
    this.selectionManager = null;
  }
}
