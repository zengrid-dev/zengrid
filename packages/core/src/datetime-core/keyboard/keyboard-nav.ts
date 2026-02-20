/**
 * Shared keyboard navigation for datetime components
 */

export interface KeyboardNavOptions {
  /** Callback when Escape is pressed */
  onEscape?: () => void;
  /** Callback when Enter is pressed */
  onEnter?: () => void;
  /** Callback when Tab is pressed */
  onTab?: (shiftKey: boolean) => void;
  /** Callback for arrow key navigation */
  onArrow?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  /** Callback for Page Up/Down */
  onPage?: (direction: 'up' | 'down') => void;
  /** Callback for Home/End */
  onHomeEnd?: (key: 'home' | 'end') => void;
  /** Whether to stop propagation for handled keys */
  stopPropagation?: boolean;
  /** Whether to prevent default for handled keys */
  preventDefault?: boolean;
}

/**
 * Create a keyboard event handler for datetime navigation
 */
export function createKeyboardHandler(options: KeyboardNavOptions): (e: KeyboardEvent) => void {
  const {
    onEscape,
    onEnter,
    onTab,
    onArrow,
    onPage,
    onHomeEnd,
    stopPropagation = true,
    preventDefault = true,
  } = options;

  return (e: KeyboardEvent) => {
    let handled = false;

    switch (e.key) {
      case 'Escape':
        if (onEscape) {
          onEscape();
          handled = true;
        }
        break;

      case 'Enter':
        if (onEnter) {
          onEnter();
          handled = true;
        }
        break;

      case 'Tab':
        if (onTab) {
          onTab(e.shiftKey);
          handled = true;
        }
        break;

      case 'ArrowUp':
        if (onArrow) {
          onArrow('up');
          handled = true;
        }
        break;

      case 'ArrowDown':
        if (onArrow) {
          onArrow('down');
          handled = true;
        }
        break;

      case 'ArrowLeft':
        if (onArrow) {
          onArrow('left');
          handled = true;
        }
        break;

      case 'ArrowRight':
        if (onArrow) {
          onArrow('right');
          handled = true;
        }
        break;

      case 'PageUp':
        if (onPage) {
          onPage('up');
          handled = true;
        }
        break;

      case 'PageDown':
        if (onPage) {
          onPage('down');
          handled = true;
        }
        break;

      case 'Home':
        if (onHomeEnd) {
          onHomeEnd('home');
          handled = true;
        }
        break;

      case 'End':
        if (onHomeEnd) {
          onHomeEnd('end');
          handled = true;
        }
        break;
    }

    if (handled) {
      if (preventDefault) {
        e.preventDefault();
      }
      if (stopPropagation) {
        e.stopPropagation();
      }
    }
  };
}

/**
 * Focus trap utility for modal-like popups
 */
export class FocusTrap {
  private container: HTMLElement;
  private previousActiveElement: Element | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Activate the focus trap
   */
  activate(): void {
    this.previousActiveElement = document.activeElement;

    // Focus first focusable element
    const focusable = this.getFocusableElements();
    if (focusable.length > 0) {
      (focusable[0] as HTMLElement).focus();
    }

    // Add keydown listener for Tab trap
    this.container.addEventListener('keydown', this.handleKeydown);
  }

  /**
   * Deactivate the focus trap
   */
  deactivate(): void {
    this.container.removeEventListener('keydown', this.handleKeydown);

    // Restore focus to previous element
    if (this.previousActiveElement && this.previousActiveElement instanceof HTMLElement) {
      this.previousActiveElement.focus();
    }
  }

  private handleKeydown = (e: KeyboardEvent): void => {
    if (e.key !== 'Tab') return;

    const focusable = this.getFocusableElements();
    if (focusable.length === 0) return;

    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  private getFocusableElements(): NodeListOf<Element> {
    return this.container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
  }
}

/**
 * Convenience function to set up keyboard navigation for a datetime popup
 */
export function setupDatetimeKeyboard(
  container: HTMLElement,
  options: KeyboardNavOptions
): () => void {
  const handler = createKeyboardHandler(options);
  container.addEventListener('keydown', handler);

  return () => {
    container.removeEventListener('keydown', handler);
  };
}
