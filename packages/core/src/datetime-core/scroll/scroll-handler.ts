/**
 * Unified scroll handling for datetime popups
 *
 * Listens to ALL scroll ancestors (not just grid container)
 * plus window scroll, and handles repositioning or closing.
 */

export type ScrollAction = 'reposition' | 'close';

export interface ScrollHandlerOptions {
  /** Close popup when anchor scrolls out of view (default: true) */
  closeOnOutOfView?: boolean;
  /** Reposition popup on scroll (default: true for small scrolls) */
  repositionOnScroll?: boolean;
  /** Threshold in pixels - if anchor moves more than this, close instead of reposition */
  closeThreshold?: number;
  /** Additional scroll containers to listen to (for cases where container is not an ancestor) */
  additionalScrollContainers?: HTMLElement[];
}

// Symbol for resize handler key
const RESIZE_KEY = Symbol('resize');

interface ScrollRegistration {
  anchor: HTMLElement;
  popup: HTMLElement;
  onScroll: (action: ScrollAction) => void;
  options: Required<ScrollHandlerOptions>;
  lastAnchorRect: DOMRect;
  scrollListeners: Map<EventTarget | symbol, EventListener>;
}

/**
 * Manages scroll event handling for datetime popups
 */
export class ScrollHandler {
  private static instance: ScrollHandler | null = null;
  private registrations: Map<HTMLElement, ScrollRegistration> = new Map();

  private constructor() {}

  static getInstance(): ScrollHandler {
    if (!ScrollHandler.instance) {
      ScrollHandler.instance = new ScrollHandler();
    }
    return ScrollHandler.instance;
  }

  /**
   * Attach scroll handlers for a popup
   * @param anchor - The element the popup is anchored to
   * @param popup - The popup element
   * @param onScroll - Callback with action ('reposition' or 'close')
   * @param options - Configuration options
   */
  attach(
    anchor: HTMLElement,
    popup: HTMLElement,
    onScroll: (action: ScrollAction) => void,
    options: ScrollHandlerOptions = {}
  ): void {
    const opts: Required<ScrollHandlerOptions> = {
      closeOnOutOfView: options.closeOnOutOfView ?? true,
      repositionOnScroll: options.repositionOnScroll ?? true,
      closeThreshold: options.closeThreshold ?? 100,
      additionalScrollContainers: options.additionalScrollContainers ?? [],
    };

    const registration: ScrollRegistration = {
      anchor,
      popup,
      onScroll,
      options: opts,
      lastAnchorRect: anchor.getBoundingClientRect(),
      scrollListeners: new Map(),
    };

    // Find all scroll ancestors
    const scrollContainers = this.findScrollAncestors(anchor);

    // Add any additional scroll containers (e.g., grid scroll container that's not an ancestor)
    for (const container of opts.additionalScrollContainers) {
      if (!scrollContainers.includes(container)) {
        scrollContainers.push(container);
      }
    }

    for (const container of scrollContainers) {
      const handler = this.createScrollHandler(registration);
      container.addEventListener('scroll', handler, { passive: true });
      registration.scrollListeners.set(container, handler);
    }

    // Also listen to window scroll
    const windowHandler = this.createScrollHandler(registration);
    window.addEventListener('scroll', windowHandler, { passive: true });
    registration.scrollListeners.set(window, windowHandler);

    // Listen to resize
    const resizeHandler = this.createResizeHandler(registration);
    window.addEventListener('resize', resizeHandler, { passive: true });
    registration.scrollListeners.set(RESIZE_KEY, resizeHandler);

    this.registrations.set(popup, registration);
  }

  /**
   * Detach scroll handlers for a popup
   */
  detach(popup: HTMLElement): void {
    const registration = this.registrations.get(popup);
    if (!registration) return;

    for (const [target, handler] of registration.scrollListeners) {
      if (target === RESIZE_KEY) {
        window.removeEventListener('resize', handler, { passive: true } as EventListenerOptions);
      } else if (target === window) {
        window.removeEventListener('scroll', handler, { passive: true } as EventListenerOptions);
      } else if (target instanceof EventTarget) {
        (target as Element).removeEventListener('scroll', handler, {
          passive: true,
        } as EventListenerOptions);
      }
    }

    registration.scrollListeners.clear();
    this.registrations.delete(popup);
  }

  /**
   * Find all scrollable ancestors of an element
   */
  private findScrollAncestors(element: HTMLElement): HTMLElement[] {
    const ancestors: HTMLElement[] = [];
    let parent = element.parentElement;

    while (parent && parent !== document.body && parent !== document.documentElement) {
      const style = window.getComputedStyle(parent);
      const overflow = style.overflow;
      const overflowY = style.overflowY;
      const overflowX = style.overflowX;

      const isScrollable =
        overflow === 'auto' ||
        overflow === 'scroll' ||
        overflowY === 'auto' ||
        overflowY === 'scroll' ||
        overflowX === 'auto' ||
        overflowX === 'scroll';

      // Include if scrollable or if it has scroll dimensions
      if (
        isScrollable ||
        parent.scrollHeight > parent.clientHeight ||
        parent.scrollWidth > parent.clientWidth
      ) {
        ancestors.push(parent);
      }

      parent = parent.parentElement;
    }

    return ancestors;
  }

  /**
   * Check if anchor element is visible in viewport
   */
  private isAnchorInViewport(anchor: HTMLElement): boolean {
    const rect = anchor.getBoundingClientRect();

    // Check if completely outside viewport
    if (
      rect.bottom < 0 ||
      rect.top > window.innerHeight ||
      rect.right < 0 ||
      rect.left > window.innerWidth
    ) {
      return false;
    }

    // Also check visibility in scroll containers
    let parent = anchor.parentElement;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      if (
        style.overflow !== 'visible' ||
        style.overflowY !== 'visible' ||
        style.overflowX !== 'visible'
      ) {
        const parentRect = parent.getBoundingClientRect();
        if (
          rect.bottom < parentRect.top ||
          rect.top > parentRect.bottom ||
          rect.right < parentRect.left ||
          rect.left > parentRect.right
        ) {
          return false;
        }
      }
      parent = parent.parentElement;
    }

    return true;
  }

  /**
   * Create scroll event handler for a registration
   */
  private createScrollHandler(registration: ScrollRegistration): EventListener {
    return () => {
      const { anchor, options, onScroll, lastAnchorRect } = registration;

      // Check if anchor is still in DOM
      if (!document.body.contains(anchor)) {
        onScroll('close');
        return;
      }

      // Check if anchor is in viewport
      if (options.closeOnOutOfView && !this.isAnchorInViewport(anchor)) {
        onScroll('close');
        return;
      }

      // Check how much anchor has moved
      const currentRect = anchor.getBoundingClientRect();
      const deltaY = Math.abs(currentRect.top - lastAnchorRect.top);
      const deltaX = Math.abs(currentRect.left - lastAnchorRect.left);

      if (deltaY > options.closeThreshold || deltaX > options.closeThreshold) {
        onScroll('close');
        return;
      }

      // Reposition if enabled and anchor moved
      if (options.repositionOnScroll && (deltaY > 0 || deltaX > 0)) {
        registration.lastAnchorRect = currentRect;
        onScroll('reposition');
      }
    };
  }

  /**
   * Create resize handler
   */
  private createResizeHandler(registration: ScrollRegistration): EventListener {
    return () => {
      const { anchor, onScroll } = registration;

      // Check if anchor is still in DOM
      if (!document.body.contains(anchor)) {
        onScroll('close');
        return;
      }

      // Update rect and reposition
      registration.lastAnchorRect = anchor.getBoundingClientRect();
      onScroll('reposition');
    };
  }

  /**
   * Reset all registrations (for testing)
   */
  reset(): void {
    for (const [popup] of this.registrations) {
      this.detach(popup);
    }
    this.registrations.clear();
  }
}

/**
 * Convenience function to attach scroll handling
 */
export function onScroll(
  anchor: HTMLElement,
  popup: HTMLElement,
  callback: (action: ScrollAction) => void,
  options?: ScrollHandlerOptions
): () => void {
  const handler = ScrollHandler.getInstance();
  handler.attach(anchor, popup, callback, options);

  return () => {
    handler.detach(popup);
  };
}
