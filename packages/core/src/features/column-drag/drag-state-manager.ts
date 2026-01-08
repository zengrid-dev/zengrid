/**
 * Drag State Manager
 *
 * @description
 * Manages drag state data separate from the state machine.
 * Tracks source column, target column, positions, and drag coordinates.
 */

import type { DragState, DragStateSnapshot, DropPosition } from './column-drag-manager.interface';

/**
 * Manages drag state data during a drag operation
 */
export class DragStateManager {
  private state: DragStateSnapshot = this.createInitialState();

  private createInitialState(): DragStateSnapshot {
    return {
      state: 'idle',
      sourceColumnId: null,
      sourceIndex: -1,
      targetColumnId: null,
      targetIndex: -1,
      dropPosition: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    };
  }

  /**
   * Start a new drag operation
   */
  startDrag(columnId: string, columnIndex: number, x: number, y: number): void {
    this.state = {
      ...this.createInitialState(),
      state: 'pending',
      sourceColumnId: columnId,
      sourceIndex: columnIndex,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    };
  }

  /**
   * Update drag state
   */
  updateState(newState: DragState): void {
    this.state.state = newState;
  }

  /**
   * Update current mouse position
   */
  updatePosition(x: number, y: number): void {
    this.state.currentX = x;
    this.state.currentY = y;
  }

  /**
   * Update drop target information
   */
  updateDropTarget(
    columnId: string | null,
    columnIndex: number,
    position: DropPosition | null
  ): void {
    this.state.targetColumnId = columnId;
    this.state.targetIndex = columnIndex;
    this.state.dropPosition = position;
  }

  /**
   * Get current state snapshot (immutable)
   */
  getState(): Readonly<DragStateSnapshot> {
    return { ...this.state };
  }

  /**
   * Get source column ID
   */
  getSourceColumnId(): string | null {
    return this.state.sourceColumnId;
  }

  /**
   * Get source column index
   */
  getSourceIndex(): number {
    return this.state.sourceIndex;
  }

  /**
   * Get target column ID
   */
  getTargetColumnId(): string | null {
    return this.state.targetColumnId;
  }

  /**
   * Get target column index
   */
  getTargetIndex(): number {
    return this.state.targetIndex;
  }

  /**
   * Get drop position
   */
  getDropPosition(): DropPosition | null {
    return this.state.dropPosition;
  }

  /**
   * Calculate distance from start position
   */
  getDragDistance(): number {
    const dx = this.state.currentX - this.state.startX;
    const dy = this.state.currentY - this.state.startY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get current X position
   */
  getCurrentX(): number {
    return this.state.currentX;
  }

  /**
   * Get current Y position
   */
  getCurrentY(): number {
    return this.state.currentY;
  }

  /**
   * Check if currently dragging
   */
  isDragging(): boolean {
    return this.state.state === 'dragging';
  }

  /**
   * Check if in pending state
   */
  isPending(): boolean {
    return this.state.state === 'pending';
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.state = this.createInitialState();
  }
}
