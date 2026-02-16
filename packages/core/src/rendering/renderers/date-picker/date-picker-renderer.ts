import type { CellRenderer, RenderParams } from '../renderer.interface';
import type { DatePickerRendererOptions } from './date-picker-types';
import {
  createDatePickerTrigger,
  createCalendarPopup,
  createCalendarWrapper,
  updateTriggerDisplay,
  setAriaAttributes,
  getDisplayText,
} from './date-picker-dom';
import { DatePickerState, parseDate } from './date-picker-state';
import { DatePickerEventManager } from './date-picker-events';
import { initializeCalendar, destroyCalendar } from './date-picker-calendar';

/**
 * DatePickerRenderer - Renders an interactive date picker with calendar popup
 *
 * Features:
 * - vanilla-calendar-pro integration
 * - Global singleton pattern (only one picker open at a time)
 * - Viewport-aware positioning (flips above/below)
 * - CSS variable theming (no hardcoded colors)
 * - Proper scroll handling (grid scroll only, not calendar internal scroll)
 * - Immediate value updates (no setTimeout race conditions)
 * - Full keyboard navigation
 * - ARIA accessibility attributes
 *
 * @example
 * ```typescript
 * const renderer = new DatePickerRenderer({
 *   format: 'DD/MM/YYYY',
 *   placeholder: 'Select date...',
 *   onChange: (value, params) => {
 *     console.log('Date changed to:', value);
 *   }
 * });
 * ```
 */
export class DatePickerRenderer implements CellRenderer {
  private options: Required<
    Pick<
      DatePickerRendererOptions,
      'format' | 'placeholder' | 'className' | 'theme' | 'disabled'
    >
  > & {
    minDate: Date | string;
    maxDate: Date | string;
    onChange?: DatePickerRendererOptions['onChange'];
    validator?: DatePickerRendererOptions['validator'];
  };

  private state: DatePickerState;
  private eventManager: DatePickerEventManager;

  // WeakMap for calendar instances (memory-safe)
  private calendarInstances: WeakMap<HTMLElement, any>;
  // WeakMap for current values
  private currentValues: WeakMap<HTMLElement, Date | null>;

  constructor(options: DatePickerRendererOptions = {}) {
    this.options = {
      format: options.format ?? 'DD/MM/YYYY',
      minDate: options.minDate ?? new Date('1900-01-01'),
      maxDate: options.maxDate ?? new Date('2099-12-31'),
      placeholder: options.placeholder ?? 'Select date...',
      className: options.className ?? 'zg-date-picker',
      theme: options.theme ?? 'light',
      disabled: options.disabled ?? false,
      onChange: options.onChange,
      validator: options.validator,
    };

    this.state = new DatePickerState();
    this.eventManager = new DatePickerEventManager(this.state);
    this.calendarInstances = new WeakMap();
    this.currentValues = new WeakMap();
  }

  render(element: HTMLElement, params: RenderParams): void {
    element.classList.add('zg-cell-date-picker');

    const container = document.createElement('div');
    container.className = `zg-date-picker-wrapper ${this.options.className}`;

    // Parse initial value
    const initialValue = parseDate(params.value);
    this.currentValues.set(container, initialValue);

    // Create trigger button
    const displayText = getDisplayText(initialValue, this.options.format, this.options.placeholder);
    const trigger = createDatePickerTrigger(displayText, this.options.disabled);
    container.appendChild(trigger);

    // Create popup (fixed positioned)
    const popup = createCalendarPopup();
    const calendarWrapper = createCalendarWrapper();
    popup.appendChild(calendarWrapper);

    // Append popup to body for proper fixed positioning
    document.body.appendChild(popup);

    // Store popup reference on container for cleanup
    (container as any).__popup = popup;

    // Attach event handlers
    this.eventManager.attachEventHandlers(
      container,
      trigger,
      popup,
      calendarWrapper,
      params,
      {
        format: this.options.format,
        placeholder: this.options.placeholder,
        disabled: this.options.disabled,
        onChange: this.options.onChange,
      },
      () => this.currentValues.get(container) ?? null,
      (value) => this.currentValues.set(container, value),
      () => this.calendarInstances.get(container)
    );

    // Initialize calendar asynchronously
    const dateSelectHandler = this.eventManager.getDateSelectHandler(container);
    if (dateSelectHandler) {
      initializeCalendar(
        calendarWrapper,
        initialValue,
        {
          format: this.options.format,
          minDate: this.options.minDate,
          maxDate: this.options.maxDate,
          theme: this.options.theme,
        },
        dateSelectHandler
      ).then((calendar) => {
        this.calendarInstances.set(container, calendar);
      });
    }

    // Set ARIA attributes
    setAriaAttributes(container, params);

    element.appendChild(container);

    // Store data attributes
    container.dataset.row = String(params.cell.row);
    container.dataset.col = String(params.cell.col);
    if (params.column?.field) {
      container.dataset.field = params.column.field;
    }
  }

  update(element: HTMLElement, params: RenderParams): void {
    const container = element.querySelector('.zg-date-picker-wrapper') as HTMLElement;
    if (!container) return;

    const trigger = container.querySelector('.zg-date-picker-trigger') as HTMLElement;
    if (!trigger) return;

    // Parse new value
    const newValue = parseDate(params.value);
    const currentValue = this.currentValues.get(container);

    // Only update if value changed
    if (newValue?.getTime() !== currentValue?.getTime()) {
      this.currentValues.set(container, newValue);
      updateTriggerDisplay(trigger, newValue, this.options.format, this.options.placeholder);

      // Update calendar if it exists
      const calendar = this.calendarInstances.get(container);
      if (calendar && newValue) {
        // Calendar will be updated when opened next time
      }
    }

    // Update data attributes
    container.dataset.row = String(params.cell.row);
    container.dataset.col = String(params.cell.col);
    if (params.column?.field) {
      container.dataset.field = params.column.field;
    }
  }

  destroy(element: HTMLElement): void {
    const container = element.querySelector('.zg-date-picker-wrapper') as HTMLElement;
    if (container) {
      // Get popup reference
      const popup = (container as any).__popup as HTMLElement | undefined;

      // Close picker if open
      if (popup && this.state.isOpen(container)) {
        this.state.closePicker(popup, container);
      }

      // Remove event handlers (also marks as destroyed)
      this.eventManager.removeEventHandlers(container);

      // Destroy calendar instance
      const calendar = this.calendarInstances.get(container);
      if (calendar) {
        destroyCalendar(calendar);
        this.calendarInstances.delete(container);
      }

      // Remove popup from DOM
      if (popup) {
        popup.remove();
      }

      // Clean up WeakMap entries
      this.currentValues.delete(container);
    }

    element.innerHTML = '';
    element.classList.remove('zg-cell-date-picker');
  }

  getCellClass(params: RenderParams): string | undefined {
    const value = parseDate(params.value);
    if (!value) {
      return 'zg-date-picker-empty';
    }
    return 'zg-date-picker-has-value';
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
