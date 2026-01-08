/**
 * Drag Keyboard Handler
 *
 * @description
 * Handles keyboard-based column reordering for accessibility.
 *
 * Keyboard shortcuts:
 * - Space/Enter on focused header: Enter reorder mode
 * - Arrow Left/Right: Move column position
 * - Enter: Confirm new position
 * - Escape: Cancel reorder
 */

import type { ColumnModel } from '../columns/column-model';
import type { ColumnReorderPlugin } from '../columns/plugins/column-reorder';
import type { EventEmitter } from '../../events/event-emitter';
import type { GridEvents } from '../../events/grid-events';
import type { KeyboardHandlerOptions } from './column-drag-manager.interface';

/**
 * Handles keyboard accessibility for column reordering
 */
export class DragKeyboardHandler {
  private columnModel: ColumnModel;
  private reorderPlugin: ColumnReorderPlugin;
  private events?: EventEmitter<GridEvents>;
  private getHeaderCell?: (columnId: string) => HTMLElement | null;

  // Keyboard reorder state
  private isReorderMode = false;
  private activeColumnId: string | null = null;
  private originalOrder = -1;
  private currentOrder = -1;

  constructor(
    options: KeyboardHandlerOptions,
    reorderPlugin: ColumnReorderPlugin
  ) {
    this.columnModel = options.columnModel;
    this.reorderPlugin = reorderPlugin;
    this.events = options.events;
    this.getHeaderCell = options.getHeaderCell;
  }

  /**
   * Handle keydown event on a header cell
   *
   * @param event Keyboard event
   * @param focusedColumnId Currently focused column ID
   * @returns true if event was handled
   */
  handleKeyDown(event: KeyboardEvent, focusedColumnId: string | null): boolean {
    if (!focusedColumnId) return false;

    switch (event.key) {
      case 'Enter':
      case ' ':
        if (!this.isReorderMode) {
          this.enterReorderMode(focusedColumnId);
          event.preventDefault();
          return true;
        } else if (focusedColumnId === this.activeColumnId) {
          this.confirmReorder();
          event.preventDefault();
          return true;
        }
        break;

      case 'ArrowLeft':
        if (this.isReorderMode && focusedColumnId === this.activeColumnId) {
          this.moveColumn(-1);
          event.preventDefault();
          return true;
        }
        break;

      case 'ArrowRight':
        if (this.isReorderMode && focusedColumnId === this.activeColumnId) {
          this.moveColumn(1);
          event.preventDefault();
          return true;
        }
        break;

      case 'Escape':
        if (this.isReorderMode) {
          this.cancelReorder();
          event.preventDefault();
          return true;
        }
        break;
    }

    return false;
  }

  /**
   * Enter reorder mode for a column
   */
  private enterReorderMode(columnId: string): void {
    const column = this.columnModel.getColumn(columnId);
    if (!column) return;

    this.isReorderMode = true;
    this.activeColumnId = columnId;
    this.originalOrder = column.order;
    this.currentOrder = column.order;

    // Add reorder mode class to header cell
    const headerCell = this.getHeaderCell?.(columnId);
    if (headerCell) {
      headerCell.classList.add('zg-header-cell--reorder-mode');
      headerCell.setAttribute('aria-grabbed', 'true');
    }

    // Announce to screen reader
    this.announceToScreenReader(
      `Entered column reorder mode for ${column.definition.header}. ` +
        `Use arrow keys to move, Enter to confirm, Escape to cancel.`,
      'assertive'
    );
  }

  /**
   * Move column in the specified direction
   */
  private moveColumn(direction: -1 | 1): void {
    if (!this.activeColumnId) return;

    const visibleColumns = this.columnModel
      .getColumns()
      .filter((col) => col.visible)
      .sort((a, b) => a.order - b.order);

    const currentIndex = visibleColumns.findIndex((col) => col.id === this.activeColumnId);
    if (currentIndex === -1) return;

    const newIndex = currentIndex + direction;

    // Check bounds
    if (newIndex < 0 || newIndex >= visibleColumns.length) {
      this.announceToScreenReader('Cannot move column further in that direction');
      return;
    }

    const newOrder = visibleColumns[newIndex].order;

    // Perform move
    this.reorderPlugin.move(this.activeColumnId, newOrder);
    this.currentOrder = newOrder;

    // Announce position
    this.announceToScreenReader(
      `Column moved to position ${newIndex + 1} of ${visibleColumns.length}`
    );
  }

  /**
   * Confirm reorder and exit reorder mode
   */
  private confirmReorder(): void {
    if (!this.activeColumnId) return;

    const moved = this.currentOrder !== this.originalOrder;

    // Emit event if column was actually moved
    if (moved) {
      this.events?.emit('column:move', {
        column: this.originalOrder,
        oldIndex: this.originalOrder,
        newIndex: this.currentOrder,
      });

      this.events?.emit('column:dragEnd', {
        columnId: this.activeColumnId,
        fromIndex: this.originalOrder,
        toIndex: this.currentOrder,
        cancelled: false,
      });

      this.announceToScreenReader(
        `Column reorder confirmed. Moved from position ${this.originalOrder + 1} to ${
          this.currentOrder + 1
        }`
      );
    } else {
      this.announceToScreenReader('Column position unchanged');
    }

    this.exitReorderMode();
  }

  /**
   * Cancel reorder and restore original position
   */
  private cancelReorder(): void {
    if (!this.activeColumnId) return;

    // Restore original position if changed
    if (this.currentOrder !== this.originalOrder) {
      this.reorderPlugin.move(this.activeColumnId, this.originalOrder);
    }

    this.announceToScreenReader('Column reorder cancelled');
    this.exitReorderMode();
  }

  /**
   * Exit reorder mode
   */
  private exitReorderMode(): void {
    // Remove reorder mode class
    if (this.activeColumnId) {
      const headerCell = this.getHeaderCell?.(this.activeColumnId);
      if (headerCell) {
        headerCell.classList.remove('zg-header-cell--reorder-mode');
        headerCell.removeAttribute('aria-grabbed');
      }
    }

    this.isReorderMode = false;
    this.activeColumnId = null;
    this.originalOrder = -1;
    this.currentOrder = -1;
  }

  /**
   * Announce message to screen reader
   */
  private announceToScreenReader(
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ): void {
    // Create or get announcement element
    let announcer = document.getElementById('zg-sr-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'zg-sr-announcer';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', priority);
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(announcer);
    } else {
      announcer.setAttribute('aria-live', priority);
    }

    // Clear and set message
    announcer.textContent = '';
    setTimeout(() => {
      announcer!.textContent = message;
    }, 100);
  }

  /**
   * Check if in reorder mode
   */
  isInReorderMode(): boolean {
    return this.isReorderMode;
  }

  /**
   * Get active column ID (if in reorder mode)
   */
  getActiveColumnId(): string | null {
    return this.activeColumnId;
  }

  /**
   * Cancel active reorder (programmatic)
   */
  cancel(): void {
    if (this.isReorderMode) {
      this.cancelReorder();
    }
  }

  /**
   * Destroy handler
   */
  destroy(): void {
    if (this.isReorderMode) {
      this.cancelReorder();
    }

    // Remove announcer element
    const announcer = document.getElementById('zg-sr-announcer');
    if (announcer) {
      announcer.remove();
    }
  }
}
