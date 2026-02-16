import type { RenderParams } from '../renderer.interface';
import type { DatePickerRendererOptions } from './date-picker-types';
import { DatePickerState } from './date-picker-state';
import { positionPopup, updateTriggerDisplay } from './date-picker-dom';
import { throttle } from '@zengrid/shared';

/**
 * Manages event handlers for date picker with Map-based tracking
 */
export class DatePickerEventManager {
  private eventHandlers: Map<HTMLElement, Map<string, EventListener>>;
  private state: DatePickerState;
  private destroyedContainers: WeakSet<HTMLElement>;

  constructor(state: DatePickerState) {
    this.eventHandlers = new Map();
    this.state = state;
    this.destroyedContainers = new WeakSet();
  }

  /**
   * Attach event handlers to date picker elements
   */
  attachEventHandlers(
    container: HTMLElement,
    trigger: HTMLElement,
    popup: HTMLElement,
    calendarWrapper: HTMLElement,
    params: RenderParams,
    options: Required<
      Pick<DatePickerRendererOptions, 'format' | 'placeholder' | 'disabled'>
    > & {
      onChange?: DatePickerRendererOptions['onChange'];
    },
    _getCurrentValue: () => Date | null,
    setCurrentValue: (value: Date | null) => void,
    _getCalendar: () => any
  ): void {
    if (options.disabled) return;

    const handlers = new Map<string, EventListener>();

    // Trigger click - toggle popup
    const clickHandler = (e: Event) => {
      e.stopPropagation();
      this.togglePicker(container, popup, trigger, calendarWrapper);
    };
    trigger.addEventListener('click', clickHandler);
    handlers.set('click', clickHandler);

    // Date selection callback (called from calendar)
    const dateSelectHandler = (selectedDate: Date) => {
      // Check isDestroyed flag before proceeding (Fix 2)
      if (this.isDestroyed(container)) return;

      setCurrentValue(selectedDate);
      updateTriggerDisplay(trigger, selectedDate, options.format, options.placeholder);

      // Close picker immediately
      this.state.closePicker(popup, container);
      trigger.setAttribute('aria-expanded', 'false');

      // Call onChange immediately - no setTimeout (Fix 2)
      if (options.onChange) {
        try {
          options.onChange(selectedDate, params);
        } catch (error) {
          console.error('DatePickerRenderer: Error in onChange handler:', error);
        }
      }
    };
    // Store for access by calendar initialization
    (container as any).__dateSelectHandler = dateSelectHandler;

    // Document click - close on outside click
    const documentClickHandler = (e: Event) => {
      if (this.isDestroyed(container)) return;

      const target = e.target as Node;
      // Don't close if clicking inside container or popup
      if (container.contains(target) || popup.contains(target)) {
        return;
      }
      if (this.state.isOpen(container)) {
        this.state.closePicker(popup, container);
        trigger.setAttribute('aria-expanded', 'false');
      }
    };
    document.addEventListener('click', documentClickHandler);
    handlers.set('documentClick', documentClickHandler);

    // Grid scroll handler - close on grid scroll only (Fix 1)
    const scrollHandler = () => {
      if (this.isDestroyed(container)) return;
      if (this.state.isOpen(container)) {
        this.state.closePicker(popup, container);
        trigger.setAttribute('aria-expanded', 'false');
      }
    };

    // Find the grid scroll container and attach scroll listener
    const gridContainer = this.findGridScrollContainer(container);
    if (gridContainer) {
      gridContainer.addEventListener('scroll', scrollHandler);
      handlers.set('gridScroll', scrollHandler);
      (container as any).__gridContainer = gridContainer;
    }

    // Resize handler - reposition popup
    const resizeHandler = throttle(() => {
      if (this.isDestroyed(container)) return;
      if (this.state.isOpen(container)) {
        positionPopup(trigger, popup);
      }
    }, 100);
    window.addEventListener('resize', resizeHandler);
    handlers.set('resize', resizeHandler);

    // Keyboard handler
    const keydownHandler = (e: KeyboardEvent) => {
      if (this.isDestroyed(container)) return;

      if (e.key === 'Escape' && this.state.isOpen(container)) {
        e.preventDefault();
        e.stopPropagation();
        this.state.closePicker(popup, container);
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (!this.state.isOpen(container)) {
          e.preventDefault();
          this.togglePicker(container, popup, trigger, calendarWrapper);
        }
      }
    };
    container.addEventListener('keydown', keydownHandler as EventListener);
    handlers.set('keydown', keydownHandler as EventListener);

    this.eventHandlers.set(container, handlers);
  }

  /**
   * Remove all event handlers from container
   */
  removeEventHandlers(container: HTMLElement): void {
    // Mark as destroyed immediately
    this.destroyedContainers.add(container);

    const handlers = this.eventHandlers.get(container);
    if (!handlers) return;

    const trigger = container.querySelector('.zg-date-picker-trigger');
    const gridContainer = (container as any).__gridContainer as HTMLElement | undefined;

    for (const [eventType, handler] of handlers) {
      switch (eventType) {
        case 'click':
          trigger?.removeEventListener('click', handler);
          break;
        case 'documentClick':
          document.removeEventListener('click', handler);
          break;
        case 'gridScroll':
          gridContainer?.removeEventListener('scroll', handler);
          break;
        case 'resize':
          window.removeEventListener('resize', handler);
          break;
        case 'keydown':
          container.removeEventListener('keydown', handler);
          break;
      }
    }

    // Cleanup stored references
    delete (container as any).__dateSelectHandler;
    delete (container as any).__gridContainer;

    this.eventHandlers.delete(container);
  }

  /**
   * Check if a container has been destroyed (Fix 2 - isDestroyed flag)
   */
  private isDestroyed(container: HTMLElement): boolean {
    return this.destroyedContainers.has(container);
  }

  /**
   * Toggle picker open/closed
   */
  private togglePicker(
    container: HTMLElement,
    popup: HTMLElement,
    trigger: HTMLElement,
    _calendarWrapper: HTMLElement
  ): void {
    if (this.state.isOpen(container)) {
      this.state.closePicker(popup, container);
      trigger.setAttribute('aria-expanded', 'false');
    } else {
      this.state.openPicker(popup, container);
      trigger.setAttribute('aria-expanded', 'true');
      positionPopup(trigger, popup);
    }
  }

  /**
   * Find the grid scroll container (Fix 1 - only listen to grid scroll, not window)
   */
  private findGridScrollContainer(element: HTMLElement): HTMLElement | null {
    let parent = element.parentElement;
    while (parent) {
      if (
        parent.classList.contains('zg-grid') ||
        parent.classList.contains('zg-viewport') ||
        parent.classList.contains('zg-scroll-container')
      ) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  }

  /**
   * Get the date select handler for a container (used by calendar initialization)
   */
  getDateSelectHandler(container: HTMLElement): ((date: Date) => void) | undefined {
    return (container as any).__dateSelectHandler;
  }
}
