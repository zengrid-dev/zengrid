/**
 * Reliable click-outside detection for datetime popups
 *
 * Handles the case where calendar widgets are appended to document.body
 * but we still need to detect clicks inside them.
 */

export interface ClickOutsideRegistration {
  popup: HTMLElement;
  onClickOutside: () => void;
  additionalElements?: HTMLElement[];
}

/**
 * Manages click-outside detection for datetime popups
 * Singleton pattern ensures consistent behavior across all pickers
 */
export class ClickOutsideManager {
  private static instance: ClickOutsideManager | null = null;
  private registrations: Map<HTMLElement, ClickOutsideRegistration> = new Map();
  private isListening: boolean = false;

  private constructor() {}

  static getInstance(): ClickOutsideManager {
    if (!ClickOutsideManager.instance) {
      ClickOutsideManager.instance = new ClickOutsideManager();
    }
    return ClickOutsideManager.instance;
  }

  /**
   * Register a popup for click-outside detection
   * @param popup - The popup element to track
   * @param onClickOutside - Callback when click is detected outside
   * @param additionalElements - Additional elements to consider "inside" (e.g., trigger button)
   */
  register(
    popup: HTMLElement,
    onClickOutside: () => void,
    additionalElements?: HTMLElement[]
  ): void {
    this.registrations.set(popup, {
      popup,
      onClickOutside,
      additionalElements,
    });

    if (!this.isListening) {
      this.startListening();
    }
  }

  /**
   * Unregister a popup from click-outside detection
   */
  unregister(popup: HTMLElement): void {
    this.registrations.delete(popup);

    if (this.registrations.size === 0) {
      this.stopListening();
    }
  }

  /**
   * Check if a click target is inside any registered element
   */
  private isInsideRegistration(target: Node, registration: ClickOutsideRegistration): boolean {
    const { popup, additionalElements } = registration;

    // Check main popup
    if (popup.contains(target)) {
      return true;
    }

    // Check additional elements (trigger buttons, etc.)
    if (additionalElements) {
      for (const el of additionalElements) {
        if (el.contains(target)) {
          return true;
        }
      }
    }

    // Check for vanilla-calendar elements appended to body
    // This is the key fix - calendar might be rendered outside popup
    const targetElement = target as Element;
    if (targetElement.closest) {
      const calendarAncestor = targetElement.closest('.vanilla-calendar');
      if (calendarAncestor) {
        // Check if this calendar belongs to our popup
        const popupCalendar = popup.querySelector('.vanilla-calendar');
        if (popupCalendar === calendarAncestor) {
          return true;
        }
        // Also check if calendar is a sibling/child of popup's wrapper
        const calendarWrapper = popup.querySelector('.zg-datetime-calendar-wrapper');
        if (calendarWrapper?.contains(calendarAncestor)) {
          return true;
        }
        // If calendar is directly in popup but rendered separately
        if (popup.contains(calendarAncestor)) {
          return true;
        }
      }

      // Check for any datetime-related popup elements
      const datetimePopup = targetElement.closest('[data-zg-datetime-popup]');
      if (datetimePopup && datetimePopup === popup) {
        return true;
      }
    }

    return false;
  }

  private handleDocumentClick = (e: MouseEvent): void => {
    const target = e.target as Node;
    if (!target) return;

    for (const [, registration] of this.registrations) {
      if (!this.isInsideRegistration(target, registration)) {
        registration.onClickOutside();
      }
    }
  };

  private startListening(): void {
    if (this.isListening) return;

    // Use capture phase to catch events before they're handled
    document.addEventListener('mousedown', this.handleDocumentClick, true);
    // Also listen for touch events
    document.addEventListener('touchstart', this.handleDocumentClick as EventListener, true);

    this.isListening = true;
  }

  private stopListening(): void {
    if (!this.isListening) return;

    document.removeEventListener('mousedown', this.handleDocumentClick, true);
    document.removeEventListener('touchstart', this.handleDocumentClick as EventListener, true);

    this.isListening = false;
  }

  /**
   * Cleanup all registrations (for testing)
   */
  reset(): void {
    this.registrations.clear();
    this.stopListening();
  }
}

/**
 * Convenience function to register click-outside handling
 */
export function onClickOutside(
  popup: HTMLElement,
  callback: () => void,
  additionalElements?: HTMLElement[]
): () => void {
  const manager = ClickOutsideManager.getInstance();
  manager.register(popup, callback, additionalElements);

  return () => {
    manager.unregister(popup);
  };
}
