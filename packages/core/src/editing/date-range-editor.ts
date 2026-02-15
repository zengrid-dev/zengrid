import type { CellEditor, EditorParams, ValidationResult } from './cell-editor.interface';
import type { DateRange, DateRangeEditorOptions, DateRangeEditorNormalizedOptions } from './date-range/types';
import { parseRange } from './date-range/formatters';
import { findScrollContainer, positionCalendar } from './date-range/positioning';
import {
  createInputElement,
  createCalendarWrapper,
  createHeader,
  createCalendarsContainer,
  updateDatePill,
} from './date-range/ui-builder';
import { initializeCalendars } from './date-range/calendar-manager';
import { validateDateRange } from './date-range/validator';
import {
  createDateSelectionHandlers,
  createButtonHandlers,
  setupScrollHandler,
  setupResizeHandler,
  updateInputElementDisplay,
} from './date-range/event-handlers';

export type { DateRange, DateRangeEditorOptions };

/**
 * DateRangeEditor - Date range picker with dual calendars
 */
export class DateRangeEditor implements CellEditor<DateRange> {
  private options: DateRangeEditorNormalizedOptions;
  private inputElement: HTMLInputElement | null = null;
  private calendarWrapper: HTMLDivElement | null = null;
  private startCalendarDiv: HTMLDivElement | null = null;
  private endCalendarDiv: HTMLDivElement | null = null;
  private startCalendar: any = null;
  private endCalendar: any = null;
  private params: EditorParams | null = null;
  private initialValue: DateRange = { start: null, end: null };
  private currentValue: DateRange = { start: null, end: null };
  private scrollHandler: ((e: Event) => void) | null = null;
  private resizeHandler: (() => void) | null = null;
  private gridScrollContainer: HTMLElement | null = null;
  private cellElement: HTMLElement | null = null;
  private buttonHandlers: Array<{ element: HTMLElement; event: string; handler: EventListener }> = [];

  constructor(options: DateRangeEditorOptions = {}) {
    this.options = {
      format: options.format ?? 'DD/MM/YYYY',
      minDate: options.minDate ?? new Date('1900-01-01'),
      maxDate: options.maxDate ?? new Date('2099-12-31'),
      required: options.required ?? false,
      placeholder: options.placeholder ?? 'Select date range...',
      className: options.className ?? 'zg-date-range-editor',
      autoFocus: options.autoFocus ?? true,
      validator: options.validator,
      stopOnBlur: options.stopOnBlur ?? true,
      theme: options.theme ?? 'light',
      allowSameDate: options.allowSameDate ?? true,
    };
  }

  init(container: HTMLElement, value: DateRange | null, params: EditorParams): void {
    this.params = params;
    this.initialValue = parseRange(value);
    this.currentValue = { ...this.initialValue };
    this.cellElement = container;
    this.gridScrollContainer = findScrollContainer(container);

    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = `${this.options.className}-wrapper`;
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    this.inputElement = createInputElement(
      this.initialValue,
      this.options,
      () => this.showCalendar()
    );
    wrapper.appendChild(this.inputElement);

    this.calendarWrapper = createCalendarWrapper();
    const { handleClear, handleCancel, handleApply } = createButtonHandlers(
      this.currentValue,
      this.initialValue,
      this.calendarWrapper,
      this.startCalendar,
      this.endCalendar,
      this.options,
      this.params,
      () => this.updateInputDisplay()
    );

    const { header, buttonHandlers } = createHeader(handleClear, handleCancel, handleApply);
    this.buttonHandlers = buttonHandlers;
    this.calendarWrapper.appendChild(header);

    const { container: calendarsContainer, startCalendarDiv, endCalendarDiv } =
      createCalendarsContainer();
    this.startCalendarDiv = startCalendarDiv;
    this.endCalendarDiv = endCalendarDiv;
    this.calendarWrapper.appendChild(calendarsContainer);

    document.body.appendChild(this.calendarWrapper);

    if (params.registerPopup) {
      params.registerPopup(this.calendarWrapper);
    }

    container.appendChild(wrapper);

    this.initializeCalendarsAsync();
  }

  private async initializeCalendarsAsync(): Promise<void> {
    if (!this.startCalendarDiv || !this.endCalendarDiv) return;

    const { handleStartDateSelect, handleEndDateSelect } = createDateSelectionHandlers(
      this.currentValue,
      this.inputElement,
      this.calendarWrapper,
      this.endCalendar,
      this.options,
      () => this.updateInputDisplay()
    );

    const { startCalendar, endCalendar } = await initializeCalendars(
      this.startCalendarDiv,
      this.endCalendarDiv,
      this.currentValue,
      this.options,
      handleStartDateSelect,
      handleEndDateSelect
    );

    this.startCalendar = startCalendar;
    this.endCalendar = endCalendar;

    requestAnimationFrame(() => {
      this.positionCalendarWrapper();
      if (this.calendarWrapper) {
        this.calendarWrapper.style.display = 'block';
      }
      this.updateDatePillWrapper();
      if (this.options.autoFocus) {
        this.focus();
      }

      this.scrollHandler = setupScrollHandler(
        this.calendarWrapper,
        this.inputElement,
        this.cellElement,
        this.gridScrollContainer,
        this.currentValue,
        this.params
      );

      this.resizeHandler = setupResizeHandler(this.calendarWrapper, this.inputElement);
    });
  }

  private updateInputDisplay(): void {
    updateInputElementDisplay(this.inputElement, this.currentValue, this.options.format);
  }

  private updateDatePillWrapper(): void {
    if (this.calendarWrapper) {
      updateDatePill(this.calendarWrapper, this.currentValue);
    }
  }

  private positionCalendarWrapper(): void {
    if (this.inputElement && this.calendarWrapper) {
      positionCalendar(this.inputElement, this.calendarWrapper);
    }
  }

  private showCalendar(): void {
    if (this.calendarWrapper) {
      this.calendarWrapper.style.display = 'block';
      this.positionCalendarWrapper();
    }
  }

  onKeyDown(event: KeyboardEvent): boolean {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (this.params?.onComplete) {
        this.params.onComplete(this.initialValue, true);
      }
      return true;
    }
    return true;
  }

  getValue(): DateRange {
    return this.currentValue;
  }

  isValid(): boolean | ValidationResult {
    return validateDateRange(this.currentValue, this.options);
  }

  focus(): void {
    if (this.inputElement) {
      this.inputElement.focus();
    }
  }

  destroy(): void {
    if (this.startCalendar) {
      this.startCalendar.destroy();
      this.startCalendar = null;
    }

    if (this.endCalendar) {
      this.endCalendar.destroy();
      this.endCalendar = null;
    }

    for (const { element, event, handler } of this.buttonHandlers) {
      element.removeEventListener(event, handler);
    }
    this.buttonHandlers = [];

    if (this.scrollHandler && this.gridScrollContainer) {
      this.gridScrollContainer.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    if (this.inputElement) {
      this.inputElement.remove();
      this.inputElement = null;
    }

    if (this.params?.unregisterPopup && this.calendarWrapper) {
      this.params.unregisterPopup(this.calendarWrapper);
    }

    if (this.calendarWrapper) {
      this.calendarWrapper.remove();
      this.calendarWrapper = null;
    }

    this.startCalendarDiv = null;
    this.endCalendarDiv = null;
    this.params = null;
  }
}

export function createDateRangeEditor(options: DateRangeEditorOptions = {}): DateRangeEditor {
  return new DateRangeEditor(options);
}
