/**
 * DatePickerRenderer - Interactive date picker with calendar popup
 *
 * Uses the new datetime-core infrastructure for:
 * - Reliable click-outside detection (fixes popup not closing)
 * - Unified scroll handling (fixes scroll UI bugs)
 * - CSS variable theming (easy customization)
 * - Keyboard navigation
 */

import type { CellRenderer, RenderParams } from '../../renderer.interface';
import type {
  DatePickerRendererOptions,
  ResolvedDatePickerOptions,
  DatePickerInstance,
} from './types';
import {
  createContainer,
  createTrigger,
  createPopup,
  createCalendarWrapper,
  updateTriggerDisplay,
  getDisplayText,
  setAriaAttributes,
  setAriaExpanded,
  setDataAttributes,
} from './dom';
import {
  PopupManager,
  parseDate,
  formatDateForCalendar,
  setupDatetimeKeyboard,
  ThemeManager,
} from '../../../../datetime-core';

/**
 * DatePickerRenderer - Renders an interactive date picker with calendar popup
 *
 * Key improvements over previous version:
 * - Reliable click-outside detection (handles body-appended calendars)
 * - Proper scroll handling (all ancestors + window)
 * - GPU-accelerated popup positioning with transform
 * - CSS variable theming
 * - Clean separation of concerns
 *
 * @example
 * ```typescript
 * const renderer = new DatePickerRenderer({
 *   format: 'DD/MM/YYYY',
 *   placeholder: 'Select date...',
 *   theme: 'dark',
 *   onChange: (value, params) => {
 *     console.log('Date changed to:', value);
 *   }
 * });
 * ```
 */
export class DatePickerRenderer implements CellRenderer {
  private options: ResolvedDatePickerOptions;
  private instances: WeakMap<HTMLElement, DatePickerInstance>;
  private popupManager: PopupManager;

  constructor(options: DatePickerRendererOptions = {}) {
    this.options = this.resolveOptions(options);
    this.instances = new WeakMap();
    this.popupManager = PopupManager.getInstance();

    // Apply theme
    if (this.options.theme !== 'auto') {
      ThemeManager.getInstance().setTheme(this.options.theme);
    }
  }

  private resolveOptions(options: DatePickerRendererOptions): ResolvedDatePickerOptions {
    return {
      format: options.format ?? 'DD/MM/YYYY',
      minDate: options.minDate ? parseDate(options.minDate) : null,
      maxDate: options.maxDate ? parseDate(options.maxDate) : null,
      placeholder: options.placeholder ?? 'Select date...',
      className: options.className ?? '',
      theme: options.theme ?? 'light',
      disabled: options.disabled ?? false,
      closeOnScroll: options.closeOnScroll ?? true,
      closeOnClickOutside: options.closeOnClickOutside ?? true,
      zIndex: options.zIndex ?? 9999,
      onChange: options.onChange,
      validator: options.validator,
    };
  }

  render(element: HTMLElement, params: RenderParams): void {
    element.classList.add('zg-cell-date-picker');

    // Parse initial value
    const initialValue = parseDate(params.value);

    // Create DOM elements
    const container = createContainer(this.options.className);
    const displayText = getDisplayText(initialValue, this.options.format, this.options.placeholder);
    const trigger = createTrigger(displayText, !initialValue, this.options.disabled);
    const popup = createPopup(this.options.zIndex);
    const calendarWrapper = createCalendarWrapper();

    popup.appendChild(calendarWrapper);
    container.appendChild(trigger);

    // Append popup to body for fixed positioning
    document.body.appendChild(popup);

    // Set ARIA attributes
    setAriaAttributes(trigger, popup, params);
    setDataAttributes(container, params);

    // Create instance record
    const instance: DatePickerInstance = {
      container,
      trigger,
      popup,
      calendarWrapper,
      calendar: null,
      currentValue: initialValue,
      params,
      isDestroyed: false,
      cleanup: null,
    };

    this.instances.set(container, instance);

    // Set up event handlers (if not disabled)
    if (!this.options.disabled) {
      this.setupEventHandlers(instance);
    }

    element.appendChild(container);
  }

  private setupEventHandlers(instance: DatePickerInstance): void {
    const { container, trigger, popup } = instance;

    // Trigger click - toggle popup
    const handleTriggerClick = (e: Event) => {
      e.stopPropagation();
      if (instance.isDestroyed) return;

      if (this.popupManager.isOpen(popup)) {
        this.closePopup(instance);
      } else {
        this.openPopup(instance);
      }
    };

    trigger.addEventListener('click', handleTriggerClick);

    // Keyboard navigation
    const cleanupKeyboard = setupDatetimeKeyboard(container, {
      onEscape: () => {
        if (this.popupManager.isOpen(popup)) {
          this.closePopup(instance);
          trigger.focus();
        }
      },
      onEnter: () => {
        if (!this.popupManager.isOpen(popup)) {
          this.openPopup(instance);
        }
      },
    });

    // Store cleanup function
    instance.cleanup = () => {
      trigger.removeEventListener('click', handleTriggerClick);
      cleanupKeyboard();
    };
  }

  private async openPopup(instance: DatePickerInstance): Promise<void> {
    const { trigger, popup, calendarWrapper } = instance;

    // Initialize calendar if not already done
    if (!instance.calendar) {
      instance.calendar = await this.initializeCalendar(
        calendarWrapper,
        instance.currentValue,
        (date) => this.handleDateSelect(instance, date)
      );
    } else {
      // Update calendar with current value
      this.updateCalendarSelection(instance.calendar, instance.currentValue);
    }

    // Open popup using PopupManager
    this.popupManager.open({
      popup,
      anchor: trigger,
      onClose: () => {
        setAriaExpanded(trigger, false);
      },
      onOpen: () => {
        setAriaExpanded(trigger, true);
      },
      additionalElements: [calendarWrapper],
      positionOptions: {
        placement: 'bottom-start',
        offset: 4,
        viewportPadding: 8,
      },
      scrollOptions: {
        closeOnOutOfView: this.options.closeOnScroll,
        repositionOnScroll: !this.options.closeOnScroll,
      },
    });
  }

  private closePopup(instance: DatePickerInstance): void {
    this.popupManager.close(instance.popup);
  }

  private async initializeCalendar(
    calendarWrapper: HTMLElement,
    initialValue: Date | null,
    onSelect: (date: Date) => void
  ): Promise<any> {
    const { minDate, maxDate, theme } = this.options;

    const calendarOptions: any = {
      type: 'default',
      settings: {
        visibility: {
          theme: theme === 'auto' ? 'system' : theme,
        },
        selection: {
          day: 'single',
        },
        range: {
          min: minDate ? formatDateForCalendar(minDate) : '1900-01-01',
          max: maxDate ? formatDateForCalendar(maxDate) : '2099-12-31',
        },
      },
      actions: {
        clickDay: (_e: any, self: any) => {
          if (self.selectedDates && self.selectedDates.length > 0) {
            const selectedDateStr = self.selectedDates[0];
            const selectedDate = new Date(selectedDateStr);
            if (!isNaN(selectedDate.getTime())) {
              onSelect(selectedDate);
            }
          }
        },
      },
    };

    if (initialValue) {
      calendarOptions.settings.selected = {
        dates: [formatDateForCalendar(initialValue)],
      };
    }

    try {
      const { Calendar } = await import('vanilla-calendar-pro');
      const calendar = new Calendar(calendarWrapper, calendarOptions);
      calendar.init();
      return calendar;
    } catch (error) {
      console.error('DatePickerRenderer: Failed to load vanilla-calendar-pro:', error);
      return null;
    }
  }

  private updateCalendarSelection(calendar: any, date: Date | null): void {
    if (!calendar) return;

    try {
      if (date) {
        calendar.settings.selected.dates = [formatDateForCalendar(date)];
        calendar.settings.selected.month = date.getMonth();
        calendar.settings.selected.year = date.getFullYear();
      } else {
        calendar.settings.selected.dates = [];
      }
      calendar.update();
    } catch (error) {
      // Calendar might be destroyed
    }
  }

  private handleDateSelect(instance: DatePickerInstance, date: Date): void {
    if (instance.isDestroyed) return;

    // Validate if validator provided
    if (this.options.validator) {
      const result = this.options.validator(date);
      if (result !== true) {
        // Invalid - don't select
        return;
      }
    }

    // Update instance value
    instance.currentValue = date;

    // Update trigger display
    updateTriggerDisplay(instance.trigger, date, this.options.format, this.options.placeholder);

    // Close popup
    this.closePopup(instance);

    // Focus trigger
    instance.trigger.focus();

    // Call onChange callback
    if (this.options.onChange) {
      try {
        this.options.onChange(date, instance.params);
      } catch (error) {
        console.error('DatePickerRenderer: Error in onChange handler:', error);
      }
    }
  }

  update(element: HTMLElement, params: RenderParams): void {
    const container = element.querySelector('.zg-date-picker-wrapper') as HTMLElement;
    if (!container) return;

    const instance = this.instances.get(container);
    if (!instance) return;

    // Parse new value
    const newValue = parseDate(params.value);
    const currentValue = instance.currentValue;

    // Only update if value changed
    if (newValue?.getTime() !== currentValue?.getTime()) {
      instance.currentValue = newValue;
      instance.params = params;

      updateTriggerDisplay(
        instance.trigger,
        newValue,
        this.options.format,
        this.options.placeholder
      );

      // Update calendar if initialized
      if (instance.calendar) {
        this.updateCalendarSelection(instance.calendar, newValue);
      }
    }

    // Update data attributes
    setDataAttributes(container, params);
  }

  destroy(element: HTMLElement): void {
    const container = element.querySelector('.zg-date-picker-wrapper') as HTMLElement;
    if (!container) return;

    const instance = this.instances.get(container);
    if (!instance) return;

    // Mark as destroyed
    instance.isDestroyed = true;

    // Close popup if open
    if (this.popupManager.isOpen(instance.popup)) {
      this.popupManager.close(instance.popup);
    }

    // Clean up event handlers
    if (instance.cleanup) {
      instance.cleanup();
    }

    // Destroy calendar instance
    if (instance.calendar && typeof instance.calendar.destroy === 'function') {
      try {
        instance.calendar.destroy();
      } catch (error) {
        // Ignore errors during cleanup
      }
    }

    // Remove popup from DOM
    instance.popup.remove();

    // Remove instance from WeakMap
    this.instances.delete(container);

    // Clean up element
    element.innerHTML = '';
    element.classList.remove('zg-cell-date-picker');
  }

  getCellClass(params: RenderParams): string | undefined {
    const value = parseDate(params.value);
    return value ? 'zg-date-picker-has-value' : 'zg-date-picker-empty';
  }
}

/**
 * Factory function to create DatePickerRenderer
 */
export function createDatePickerRenderer(
  options: DatePickerRendererOptions = {}
): DatePickerRenderer {
  return new DatePickerRenderer(options);
}
