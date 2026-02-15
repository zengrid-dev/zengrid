/**
 * Drag Lifecycle Manager
 *
 * @description
 * Handles attachment, detachment, and cleanup of drag event listeners.
 */

import type { DragMouseHandler } from './drag-mouse-handler';
import type { DragTouchHandler } from './drag-touch-handler';
import type { DragVisualFeedback } from './drag-visual-feedback';

export class DragLifecycle {
  private container: HTMLElement | null = null;

  constructor(
    private enabled: boolean,
    private mouseHandler: DragMouseHandler,
    private touchHandler: DragTouchHandler,
    private visualFeedback: DragVisualFeedback,
    private boundHandleKeyDown: (e: KeyboardEvent) => void
  ) {}

  /**
   * Attach drag listeners to container
   */
  attach(container: HTMLElement): void {
    if (!this.enabled) return;

    this.container = container;

    // Attach mouse handler
    this.mouseHandler.attach(container);

    // Attach touch handler for mobile support
    this.touchHandler.attach(container);

    // Keyboard listener for Escape and delegation to keyboard handler
    document.addEventListener('keydown', this.boundHandleKeyDown);
  }

  /**
   * Detach all event listeners
   */
  detach(): void {
    if (this.container) {
      this.mouseHandler.detach();
      this.touchHandler.detach(this.container);

      // Clean up any visual feedback
      this.visualFeedback.endDrag();

      this.container = null;
    }

    document.removeEventListener('keydown', this.boundHandleKeyDown);
  }

  getContainer(): HTMLElement | null {
    return this.container;
  }
}
