/**
 * EventHandlerRegistry - Manages element event handlers
 *
 * @description
 * Storage and lookup for element event handlers.
 * Extracted from EventDelegator for modularity.
 *
 * @internal
 */

export interface ElementEventHandlers {
  onClick?: (event: MouseEvent) => void;
  onDblClick?: (event: MouseEvent) => void;
  onMouseDown?: (event: MouseEvent) => void;
  onMouseUp?: (event: MouseEvent) => void;
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
  onContextMenu?: (event: MouseEvent) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
}

export class EventHandlerRegistry {
  private handlers = new Map<string, ElementEventHandlers>();

  /**
   * Register handlers for element
   */
  register(elementId: string, handlers: ElementEventHandlers): void {
    this.handlers.set(elementId, handlers);
  }

  /**
   * Unregister element handlers
   */
  unregister(elementId: string): void {
    this.handlers.delete(elementId);
  }

  /**
   * Update element handlers
   */
  update(elementId: string, handlers: ElementEventHandlers, merge: boolean): void {
    if (merge) {
      const existing = this.handlers.get(elementId) || {};
      this.handlers.set(elementId, { ...existing, ...handlers });
    } else {
      this.handlers.set(elementId, handlers);
    }
  }

  /**
   * Get handlers for element
   */
  get(elementId: string): ElementEventHandlers | undefined {
    return this.handlers.get(elementId);
  }

  /**
   * Get handler for specific event type
   */
  getHandler(
    elementId: string,
    handlerName: keyof ElementEventHandlers
  ): ((event: any) => void) | undefined {
    const handlers = this.handlers.get(elementId);
    return handlers?.[handlerName];
  }

  /**
   * Get registry size (for monitoring)
   */
  size(): number {
    return this.handlers.size;
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear();
  }
}
