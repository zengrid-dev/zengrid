import type { CellEditor, EditorParams } from './cell-editor.interface';
import type { CellRef } from '../types';
import type { EventEmitter } from '../events/event-emitter';
import type { GridEvents } from '../events/grid-events';
import { TextEditor } from './text-editor';
import { NumberEditor } from './number-editor';
import { SelectEditor } from './select-editor';
import { DateEditor } from './date-editor';
import { CheckboxEditor } from './checkbox-editor';

/**
 * Editor manager options
 */
export interface EditorManagerOptions {
  /**
   * Container element for editors
   */
  container: HTMLElement;

  /**
   * Event emitter for grid events
   */
  events?: EventEmitter<GridEvents>;

  /**
   * Callback to get cell value
   */
  getValue: (row: number, col: number) => any;

  /**
   * Callback to set cell value
   */
  setValue: (row: number, col: number, value: any) => void;

  /**
   * Callback to get column definition
   */
  getColumn?: (col: number) => any;

  /**
   * Callback to get row data
   */
  getRowData?: (row: number) => any;

  /**
   * Callback to get cell element
   */
  getCellElement: (row: number, col: number) => HTMLElement | null;

  /**
   * Callback when editing starts
   */
  onEditStart?: (cell: CellRef) => void;

  /**
   * Callback when editing ends
   */
  onEditEnd?: (cell: CellRef, cancelled: boolean) => void;
}

/**
 * EditorManager - Manages cell editing lifecycle
 *
 * Coordinates the editing process:
 * - Creates and destroys editor instances
 * - Handles edit start/end events
 * - Validates and commits changes
 * - Manages keyboard shortcuts (Enter, Escape)
 *
 * @example
 * ```typescript
 * const editorManager = new EditorManager({
 *   container: gridElement,
 *   getValue: (row, col) => data[row][col],
 *   setValue: (row, col, value) => { data[row][col] = value; },
 *   getCellElement: (row, col) => document.getElementById(`cell-${row}-${col}`),
 * });
 *
 * // Start editing
 * editorManager.startEdit({ row: 0, col: 0 });
 *
 * // Cancel editing
 * editorManager.cancelEdit();
 * ```
 */
export class EditorManager {
  private container: HTMLElement;
  private events?: EventEmitter<GridEvents>;
  private getValue: (row: number, col: number) => any;
  private setValue: (row: number, col: number, value: any) => void;
  private getColumn?: (col: number) => any;
  private getRowData?: (row: number) => any;
  private getCellElement: (row: number, col: number) => HTMLElement | null;
  private onEditStart?: (cell: CellRef) => void;
  private onEditEnd?: (cell: CellRef, cancelled: boolean) => void;

  private currentEditor: CellEditor | null = null;
  private editingCell: CellRef | null = null;
  private originalValue: any = null;
  private editorContainer: HTMLElement | null = null;
  private boundHandleEditorKeyDown: (event: KeyboardEvent) => void;
  private boundHandleClickOutside: (event: MouseEvent) => void;

  /** Registry of popup elements that should not trigger click-outside close */
  private editorPopups: Set<HTMLElement> = new Set();

  private editors: Map<string, new () => CellEditor> = new Map();

  constructor(options: EditorManagerOptions) {
    this.container = options.container;
    this.events = options.events;
    this.getValue = options.getValue;
    this.setValue = options.setValue;
    this.getColumn = options.getColumn;
    this.getRowData = options.getRowData;
    this.getCellElement = options.getCellElement;
    this.onEditStart = options.onEditStart;
    this.onEditEnd = options.onEditEnd;
    this.boundHandleEditorKeyDown = this.handleEditorKeyDown.bind(this);
    this.boundHandleClickOutside = this.handleClickOutside.bind(this);

    // Register default editors
    this.registerEditor('text', TextEditor);
    this.registerEditor('number', NumberEditor);
    this.registerEditor('select', SelectEditor);
    this.registerEditor('date', DateEditor);
    this.registerEditor('checkbox', CheckboxEditor);
    // Note: DropdownEditor requires options array and should be registered
    // manually with: editorManager.registerEditor('dropdown', DropdownEditor)
  }

  /**
   * Register a custom editor
   * @param type - Editor type name
   * @param editorClass - Editor class constructor
   */
  registerEditor(type: string, editorClass: new () => CellEditor): void {
    this.editors.set(type, editorClass);
  }

  /**
   * Start editing a cell
   * @param cell - Cell to edit
   * @param initialValue - Optional initial value (for typing to start edit)
   */
  startEdit(cell: CellRef, initialValue?: any): void {
    // Already editing this cell
    if (
      this.editingCell &&
      this.editingCell.row === cell.row &&
      this.editingCell.col === cell.col
    ) {
      return;
    }

    // Cancel any existing edit
    if (this.editingCell) {
      this.cancelEdit();
    }

    // Get column definition
    const column = this.getColumn?.(cell.col);

    // Check if editable
    if (column?.editable === false) {
      return;
    }

    // Get cell element
    const cellElement = this.getCellElement(cell.row, cell.col);
    if (!cellElement) return;

    // Get current value
    const currentValue = this.getValue(cell.row, cell.col);
    this.originalValue = currentValue;
    this.editingCell = cell;

    // Create editor container with correct positioning
    this.editorContainer = document.createElement('div');
    this.editorContainer.className = 'zg-editor-container';

    // Get accurate position using getBoundingClientRect
    const cellRect = cellElement.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();

    // Calculate position relative to grid container
    const top = cellRect.top - containerRect.top;
    const left = cellRect.left - containerRect.left;

    this.editorContainer.style.cssText = `
      position: absolute;
      top: ${top}px;
      left: ${left}px;
      width: ${cellRect.width}px;
      height: ${cellRect.height}px;
      z-index: 10002;
      overflow: visible;
    `;

    // Determine editor - supports both instance and string type
    if (column?.editor && typeof column.editor === 'object' && typeof column.editor.init === 'function') {
      // Editor is already an instance - use it directly
      this.currentEditor = column.editor;
    } else {
      // Editor is a string type name - look up in registry
      const editorType = (column?.editor as string) || this.getDefaultEditor(currentValue);
      const EditorClass = this.editors.get(editorType);

      if (!EditorClass) {
        console.warn(`Editor type "${editorType}" not found, using text editor`);
        this.currentEditor = new TextEditor();
      } else {
        this.currentEditor = new EditorClass();
      }
    }

    // Initialize editor
    const params: EditorParams = {
      cell,
      column,
      rowData: this.getRowData?.(cell.row),
      onComplete: (_value: any, cancelled: boolean) => {
        if (cancelled) {
          this.cancelEdit();
        } else {
          this.commitEdit();
        }
      },
      onChange: (_value: any) => {
        // Optional: emit change event
      },
      options: column?.editorOptions || {},
      registerPopup: this.registerEditorPopup.bind(this),
      unregisterPopup: this.unregisterEditorPopup.bind(this),
    };

    const valueToEdit = initialValue !== undefined ? initialValue : currentValue;

    if (!this.editorContainer || !this.currentEditor) {
      console.error('Editor container or editor is null');
      return;
    }

    this.currentEditor.init(this.editorContainer, valueToEdit, params);

    // Add to DOM
    this.container.appendChild(this.editorContainer);

    // Setup keyboard handlers
    this.setupKeyboardHandlers();

    // Setup click outside handler
    this.setupClickOutsideHandler();

    // Emit events
    if (this.events) {
      this.events.emit('edit:start', {
        cell,
        value: currentValue,
      });
    }

    if (this.onEditStart) {
      this.onEditStart(cell);
    }
  }

  /**
   * Commit the current edit
   */
  commitEdit(): void {
    if (!this.currentEditor || !this.editingCell) return;

    // Validate
    const validation = this.currentEditor.isValid?.();
    const isValid = validation === undefined || validation === true ||
                   (typeof validation === 'object' && validation.valid);

    if (!isValid) {
      const message = typeof validation === 'object' ? validation.message : 'Invalid value';
      alert(message || 'Invalid value');
      return;
    }

    // Get new value
    const newValue = this.currentEditor.getValue();
    const cell = this.editingCell;

    // Set value
    this.setValue(cell.row, cell.col, newValue);

    // Emit events
    if (this.events) {
      this.events.emit('edit:commit', {
        cell,
        oldValue: this.originalValue,
        newValue,
      });

      this.events.emit('edit:end', {
        cell,
        value: newValue,
        cancelled: false,
      });
    }

    if (this.onEditEnd) {
      this.onEditEnd(cell, false);
    }

    // Cleanup
    this.endEdit();
  }

  /**
   * Cancel the current edit
   */
  cancelEdit(): void {
    if (!this.editingCell) return;

    const cell = this.editingCell;

    // Emit events
    if (this.events) {
      this.events.emit('edit:cancel', {
        cell,
        value: this.originalValue,
      });

      this.events.emit('edit:end', {
        cell,
        value: this.originalValue,
        cancelled: true,
      });
    }

    if (this.onEditEnd) {
      this.onEditEnd(cell, true);
    }

    // Cleanup
    this.endEdit();
  }

  /**
   * End editing and cleanup
   */
  private endEdit(): void {
    // Destroy editor
    if (this.currentEditor) {
      this.currentEditor.destroy();
      this.currentEditor = null;
    }

    // Remove container
    if (this.editorContainer) {
      this.editorContainer.remove();
      this.editorContainer = null;
    }

    // Cleanup handlers
    this.cleanupKeyboardHandlers();
    this.cleanupClickOutsideHandler();

    // Reset state
    this.editingCell = null;
    this.originalValue = null;
    this.editorPopups.clear();
  }

  /**
   * Get currently editing cell
   */
  getEditingCell(): CellRef | null {
    return this.editingCell ? { ...this.editingCell } : null;
  }

  /**
   * Check if currently editing
   */
  isEditing(): boolean {
    return this.editingCell !== null;
  }

  /**
   * Setup keyboard event handlers
   */
  private setupKeyboardHandlers(): void {
    this.editorContainer?.addEventListener('keydown', this.boundHandleEditorKeyDown);
  }

  /**
   * Cleanup keyboard event handlers
   */
  private cleanupKeyboardHandlers(): void {
    this.editorContainer?.removeEventListener('keydown', this.boundHandleEditorKeyDown);
  }

  /**
   * Setup click outside handler to close editor
   */
  private setupClickOutsideHandler(): void {
    // Delay to avoid closing immediately from the click that opened it
    setTimeout(() => {
      document.addEventListener('mousedown', this.boundHandleClickOutside);
    }, 100);
  }

  /**
   * Cleanup click outside handler
   */
  private cleanupClickOutsideHandler(): void {
    document.removeEventListener('mousedown', this.boundHandleClickOutside);
  }

  /**
   * Handle click outside editor container
   */
  private handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Check if click is inside editor container
    if (this.editorContainer?.contains(target)) {
      return;
    }

    // Check if click is inside any registered popup (e.g., calendar)
    for (const popup of this.editorPopups) {
      if (popup.contains(target)) {
        return;
      }
    }

    // Fallback: Check for known calendar classes (handles edge cases)
    if (target.closest('.vanilla-calendar-wrapper') ||
        target.closest('.date-range-calendar-wrapper') ||
        target.closest('.vanilla-calendar')) {
      return;
    }

    // Click is truly outside - commit the edit
    this.commitEdit();
  }

  /**
   * Register a popup element (e.g., calendar) that belongs to the current editor.
   * Clicks on registered popups will not trigger click-outside close.
   */
  public registerEditorPopup(element: HTMLElement): void {
    this.editorPopups.add(element);
  }

  /**
   * Unregister a popup element.
   */
  public unregisterEditorPopup(element: HTMLElement): void {
    this.editorPopups.delete(element);
  }

  /**
   * Handle keyboard events during editing
   */
  private handleEditorKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
        if (!event.shiftKey) {
          event.preventDefault();
          this.commitEdit();
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.cancelEdit();
        break;

      case 'Tab':
        event.preventDefault();
        this.commitEdit();
        // TODO: Move to next editable cell
        break;
    }
  };

  /**
   * Get default editor type based on value
   */
  private getDefaultEditor(value: any): string {
    if (typeof value === 'number') return 'number';
    if (value instanceof Date) return 'date';
    return 'text';
  }

  /**
   * Destroy editor manager
   */
  destroy(): void {
    if (this.isEditing()) {
      this.cancelEdit();
    }

    this.editors.clear();
  }
}
