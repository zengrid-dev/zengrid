/**
 * Singleton popup lifecycle manager
 *
 * Ensures only one datetime popup is open at a time.
 * Handles coordination between click-outside and scroll handlers.
 */

import { ClickOutsideManager } from './click-outside';
import {
  ScrollHandler,
  type ScrollAction,
  type ScrollHandlerOptions,
} from '../scroll/scroll-handler';
import { positionPopup, type PositionOptions } from './popup-positioner';

export interface PopupConfig {
  /** The popup element */
  popup: HTMLElement;
  /** The anchor element (trigger) */
  anchor: HTMLElement;
  /** Callback when popup should close */
  onClose: () => void;
  /** Callback when popup opens */
  onOpen?: () => void;
  /** Additional elements considered "inside" for click-outside detection */
  additionalElements?: HTMLElement[];
  /** Position options */
  positionOptions?: PositionOptions;
  /** Scroll handler options */
  scrollOptions?: ScrollHandlerOptions;
}

interface ActivePopup {
  config: PopupConfig;
  cleanupClickOutside: () => void;
  cleanupScroll: () => void;
}

/**
 * Manages popup lifecycle for datetime pickers
 * Singleton pattern ensures only one popup is open at a time
 */
export class PopupManager {
  private static instance: PopupManager | null = null;
  private activePopup: ActivePopup | null = null;
  private popupStack: Map<HTMLElement, ActivePopup> = new Map();

  private constructor() {}

  static getInstance(): PopupManager {
    if (!PopupManager.instance) {
      PopupManager.instance = new PopupManager();
    }
    return PopupManager.instance;
  }

  /**
   * Open a popup, closing any existing one first
   */
  open(config: PopupConfig): void {
    // Close existing popup first (singleton pattern)
    if (this.activePopup && this.activePopup.config.popup !== config.popup) {
      this.close(this.activePopup.config.popup);
    }

    // Check if this popup is already open
    if (this.popupStack.has(config.popup)) {
      return;
    }

    const { popup, anchor, additionalElements, positionOptions, scrollOptions } = config;

    // Position popup before showing to prevent flash at top-left
    popup.style.visibility = 'hidden';
    popup.style.display = 'block';
    positionPopup(anchor, popup, positionOptions);
    popup.style.visibility = '';
    popup.setAttribute('data-zg-datetime-popup', 'true');

    // Set up click-outside detection
    const clickOutsideManager = ClickOutsideManager.getInstance();
    const cleanupClickOutside = () => {
      clickOutsideManager.unregister(popup);
    };
    clickOutsideManager.register(
      popup,
      () => this.close(popup),
      additionalElements ? [anchor, ...additionalElements] : [anchor]
    );

    // Set up scroll handling
    const scrollHandler = ScrollHandler.getInstance();
    const cleanupScroll = () => {
      scrollHandler.detach(popup);
    };
    scrollHandler.attach(
      anchor,
      popup,
      (action: ScrollAction) => {
        if (action === 'close') {
          this.close(popup);
        } else if (action === 'reposition') {
          positionPopup(anchor, popup, positionOptions);
        }
      },
      scrollOptions
    );

    const activePopup: ActivePopup = {
      config,
      cleanupClickOutside,
      cleanupScroll,
    };

    this.activePopup = activePopup;
    this.popupStack.set(popup, activePopup);

    // Call onOpen callback
    config.onOpen?.();
  }

  /**
   * Close a specific popup
   */
  close(popup: HTMLElement): void {
    const activePopup = this.popupStack.get(popup);
    if (!activePopup) return;

    // Clean up handlers
    activePopup.cleanupClickOutside();
    activePopup.cleanupScroll();

    // Hide popup
    popup.style.display = 'none';
    popup.removeAttribute('data-zg-datetime-popup');
    popup.removeAttribute('data-zg-placement');

    // Call onClose callback
    activePopup.config.onClose();

    // Remove from stack
    this.popupStack.delete(popup);

    // Clear active if this was the active popup
    if (this.activePopup?.config.popup === popup) {
      this.activePopup = null;
    }
  }

  /**
   * Close all open popups
   */
  closeAll(): void {
    for (const [popup] of this.popupStack) {
      this.close(popup);
    }
  }

  /**
   * Check if a popup is currently open
   */
  isOpen(popup: HTMLElement): boolean {
    return this.popupStack.has(popup);
  }

  /**
   * Get the currently active popup
   */
  getActivePopup(): HTMLElement | null {
    return this.activePopup?.config.popup ?? null;
  }

  /**
   * Toggle a popup open/closed
   */
  toggle(config: PopupConfig): void {
    if (this.isOpen(config.popup)) {
      this.close(config.popup);
    } else {
      this.open(config);
    }
  }

  /**
   * Reposition an open popup
   */
  reposition(popup: HTMLElement): void {
    const activePopup = this.popupStack.get(popup);
    if (!activePopup) return;

    positionPopup(activePopup.config.anchor, popup, activePopup.config.positionOptions);
  }

  /**
   * Reset manager state (for testing)
   */
  reset(): void {
    this.closeAll();
    this.activePopup = null;
  }
}

/**
 * Convenience function to create a popup controller
 */
export function createPopupController(config: PopupConfig) {
  const manager = PopupManager.getInstance();

  return {
    open: () => manager.open(config),
    close: () => manager.close(config.popup),
    toggle: () => manager.toggle(config),
    isOpen: () => manager.isOpen(config.popup),
    reposition: () => manager.reposition(config.popup),
  };
}
