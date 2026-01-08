/**
 * Drag Touch Handler
 *
 * @description
 * Handles touch-based column drag operations for mobile devices.
 * Supports long-press to initiate drag, touch move for dragging, and touch end for drop.
 */

import type { TouchHandlerOptions } from './column-drag-manager.interface';

/**
 * Handles touch events for column dragging
 */
export class DragTouchHandler {
  private dragThreshold: number;
  private longPressDuration: number;

  // Touch state
  private touchStartX = 0;
  private touchStartY = 0;
  private longPressTimer: number | null = null;
  private isDragging = false;

  // Callbacks
  private onDragStart?: (columnId: string, x: number, y: number, event: TouchEvent) => void;
  private onDragMove?: (x: number, y: number, event: TouchEvent) => void;
  private onDragEnd?: (x: number, y: number, event: TouchEvent) => void;
  private onDragCancel?: () => void;

  // Bound handlers
  private boundHandleTouchStart: (e: TouchEvent) => void;
  private boundHandleTouchMove: (e: TouchEvent) => void;
  private boundHandleTouchEnd: (e: TouchEvent) => void;
  private boundHandleTouchCancel: (e: TouchEvent) => void;

  constructor(options: TouchHandlerOptions = {}) {
    this.dragThreshold = options.dragThreshold ?? 10;
    this.longPressDuration = options.longPressDuration ?? 500;

    // Bind handlers
    this.boundHandleTouchStart = this.handleTouchStart.bind(this);
    this.boundHandleTouchMove = this.handleTouchMove.bind(this);
    this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
    this.boundHandleTouchCancel = this.handleTouchCancel.bind(this);
  }

  /**
   * Attach touch listeners to container
   */
  attach(container: HTMLElement): void {
    container.addEventListener('touchstart', this.boundHandleTouchStart, { passive: false });
  }

  /**
   * Detach all touch listeners
   */
  detach(container: HTMLElement): void {
    container.removeEventListener('touchstart', this.boundHandleTouchStart);
    this.removeGlobalListeners();
  }

  /**
   * Set drag callbacks
   */
  setCallbacks(callbacks: {
    onDragStart?: (columnId: string, x: number, y: number, event: TouchEvent) => void;
    onDragMove?: (x: number, y: number, event: TouchEvent) => void;
    onDragEnd?: (x: number, y: number, event: TouchEvent) => void;
    onDragCancel?: () => void;
  }): void {
    this.onDragStart = callbacks.onDragStart;
    this.onDragMove = callbacks.onDragMove;
    this.onDragEnd = callbacks.onDragEnd;
    this.onDragCancel = callbacks.onDragCancel;
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const headerCell = (touch.target as HTMLElement).closest('[data-column-id]') as HTMLElement;

    if (!headerCell) return;

    const columnId = headerCell.dataset.columnId;
    if (!columnId) return;

    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;

    // Start long-press timer
    this.longPressTimer = window.setTimeout(() => {
      this.initiateDrag(columnId, touch.clientX, touch.clientY, e);
    }, this.longPressDuration);

    // Add move and end listeners
    document.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false });
    document.addEventListener('touchend', this.boundHandleTouchEnd);
    document.addEventListener('touchcancel', this.boundHandleTouchCancel);
  }

  /**
   * Initiate drag after long press
   */
  private initiateDrag(columnId: string, x: number, y: number, event: TouchEvent): void {
    this.isDragging = true;
    this.onDragStart?.(columnId, x, y, event);

    // Provide haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(e: TouchEvent): void {
    if (e.touches.length !== 1) {
      this.cancelDrag();
      return;
    }

    const touch = e.touches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If moved before long press completes, cancel the long press
    if (!this.isDragging && distance > this.dragThreshold) {
      this.cancelLongPress();
      return;
    }

    // If dragging, update position
    if (this.isDragging) {
      this.onDragMove?.(touch.clientX, touch.clientY, e);
      e.preventDefault(); // Prevent scrolling during drag
    }
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(e: TouchEvent): void {
    if (this.isDragging) {
      const touch = e.changedTouches[0];
      this.onDragEnd?.(touch.clientX, touch.clientY, e);
    }

    this.cleanup();
  }

  /**
   * Handle touch cancel
   */
  private handleTouchCancel(): void {
    if (this.isDragging) {
      this.onDragCancel?.();
    }
    this.cleanup();
  }

  /**
   * Cancel long press timer
   */
  private cancelLongPress(): void {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  /**
   * Cancel active drag
   */
  private cancelDrag(): void {
    if (this.isDragging) {
      this.onDragCancel?.();
    }
    this.cleanup();
  }

  /**
   * Cleanup touch state
   */
  private cleanup(): void {
    this.cancelLongPress();
    this.isDragging = false;
    this.removeGlobalListeners();
  }

  /**
   * Remove global touch listeners
   */
  private removeGlobalListeners(): void {
    document.removeEventListener('touchmove', this.boundHandleTouchMove);
    document.removeEventListener('touchend', this.boundHandleTouchEnd);
    document.removeEventListener('touchcancel', this.boundHandleTouchCancel);
  }

  /**
   * Check if currently dragging
   */
  isDraggingActive(): boolean {
    return this.isDragging;
  }

  /**
   * Destroy handler
   */
  destroy(): void {
    this.cleanup();
  }
}
