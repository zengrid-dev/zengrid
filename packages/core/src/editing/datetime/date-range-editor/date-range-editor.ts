import type { CellEditor, EditorParams, ValidationResult } from '../../cell-editor.interface';
import type { DateRange, DateRangeEditorOptions, ResolvedDateRangeEditorOptions } from './types';
import { PopupManager, isDateInRange, ThemeManager } from '../../../datetime-core';
import { resolveOptions, parseRange, validateRange } from './date-range-validation';
import { createInputElement, createPopupElement, updateDisplay, setupEventHandlers, showPopup as showPopupFn } from './date-range-dom';
import { initializeCalendars, clearCalendars, updateEndCalendarMinDate, resetEndCalendarSelection, destroyCalendars, type CalendarRefs } from './date-range-calendar';

export class DateRangeEditor implements CellEditor<DateRange> {
  private options: ResolvedDateRangeEditorOptions;
  private container: HTMLElement | null = null;
  private inputElement: HTMLInputElement | null = null;
  private popup: HTMLDivElement | null = null;
  private startCalendarDiv: HTMLDivElement | null = null;
  private endCalendarDiv: HTMLDivElement | null = null;
  private calendarRefs: CalendarRefs = { startCalendar: null, endCalendar: null };
  private params: EditorParams | null = null;
  private initialValue: DateRange = { start: null, end: null };
  private currentValue: DateRange = { start: null, end: null };
  private isDestroyed: boolean = false;
  private cleanup: (() => void) | null = null;
  private popupManager: PopupManager;

  constructor(options: DateRangeEditorOptions = {}) {
    this.options = resolveOptions(options);
    this.popupManager = PopupManager.getInstance();
    if (this.options.theme !== 'auto') {
      ThemeManager.getInstance().setTheme(this.options.theme);
    }
  }

  init(container: HTMLElement, value: DateRange | null, params: EditorParams): void {
    this.isDestroyed = false;
    this.params = params;
    this.container = container;
    this.initialValue = parseRange(value);
    this.currentValue = { ...this.initialValue };
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = `${this.options.className}-wrapper zg-datetime-container`;
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    this.inputElement = createInputElement(this.options, this.currentValue);
    wrapper.appendChild(this.inputElement);
    container.appendChild(wrapper);

    const popupResult = createPopupElement(this.options, this.currentValue, {
      onClear: () => this.handleClear(),
      onCancel: () => this.handleCancel(),
      onApply: () => this.handleApply(),
    });
    this.popup = popupResult.popup;
    this.startCalendarDiv = popupResult.startCalendarDiv;
    this.endCalendarDiv = popupResult.endCalendarDiv;
    document.body.appendChild(this.popup);

    if (params.registerPopup) params.registerPopup(this.popup);

    initializeCalendars(this.startCalendarDiv, this.endCalendarDiv, this.options, this.currentValue, {
      onStartDateSelect: (date) => this.handleStartDateSelect(date),
      onEndDateSelect: (date) => this.handleEndDateSelect(date),
    }).then((refs) => {
      this.calendarRefs = refs;
      requestAnimationFrame(() => {
        if (!this.isDestroyed) this.showPopup();
      });
    });

    if (this.inputElement) {
      this.cleanup = setupEventHandlers(
        this.inputElement, this.container!, this.popup, this.popupManager,
        {
          onCancel: () => this.handleCancel(),
          onApply: () => this.handleApply(),
          showPopup: () => this.showPopup(),
        }
      );
    }
    if (this.options.autoFocus) requestAnimationFrame(() => this.focus());
  }

  private showPopup(): void {
    if (!this.popup || !this.inputElement) return;
    showPopupFn(
      this.popup, this.inputElement, this.popupManager, this.options, this.params,
      [this.startCalendarDiv!, this.endCalendarDiv!]
    );
  }

  private hidePopup(): void {
    if (this.popup) this.popupManager.close(this.popup);
  }

  private handleStartDateSelect(date: Date): void {
    if (this.isDestroyed) return;
    if (!isDateInRange(date, this.options.minDate, this.options.maxDate)) return;

    this.currentValue.start = date;
    if (this.currentValue.end && this.currentValue.end < date) {
      this.currentValue.end = null;
      resetEndCalendarSelection(this.calendarRefs.endCalendar, null);
    }
    updateEndCalendarMinDate(this.calendarRefs.endCalendar, date);
    updateDisplay(this.inputElement, this.popup, this.currentValue, this.options);
    this.params?.onChange?.(this.currentValue);
  }

  private handleEndDateSelect(date: Date): void {
    if (this.isDestroyed) return;
    if (!isDateInRange(date, this.options.minDate, this.options.maxDate)) return;
    if (this.currentValue.start && !this.options.allowSameDate) {
      if (date.getTime() === this.currentValue.start.getTime()) return;
    }
    if (this.currentValue.start && date < this.currentValue.start) return;

    this.currentValue.end = date;
    updateDisplay(this.inputElement, this.popup, this.currentValue, this.options);
    this.params?.onChange?.(this.currentValue);
  }

  private handleClear(): void {
    this.currentValue = { start: null, end: null };
    clearCalendars(this.calendarRefs, this.options);
    updateDisplay(this.inputElement, this.popup, this.currentValue, this.options);
    this.params?.onChange?.(this.currentValue);
  }

  private handleCancel(): void {
    if (this.isDestroyed || !this.params) return;
    this.hidePopup();
    this.params.onComplete?.(this.initialValue, true);
  }

  private handleApply(): void {
    if (this.isDestroyed || !this.params) return;
    const result = this.isValid();
    if (result === true || (typeof result === 'object' && result.valid)) {
      this.hidePopup();
      this.params.onComplete?.(this.currentValue, false);
    }
  }

  onKeyDown(event: KeyboardEvent): boolean {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.handleCancel();
      return true;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      this.handleApply();
      return true;
    }
    return true;
  }

  getValue(): DateRange {
    return this.currentValue;
  }

  isValid(): boolean | ValidationResult {
    return validateRange(this.currentValue, this.options);
  }

  focus(): void {
    this.inputElement?.focus();
  }

  destroy(): void {
    this.isDestroyed = true;
    this.cleanup?.();
    this.cleanup = null;
    if (this.popup) {
      this.hidePopup();
      this.params?.unregisterPopup?.(this.popup);
    }
    destroyCalendars(this.calendarRefs);
    this.calendarRefs = { startCalendar: null, endCalendar: null };
    this.popup?.remove();
    this.inputElement?.remove();
    this.container = this.inputElement = this.popup = null;
    this.startCalendarDiv = this.endCalendarDiv = this.params = null;
    this.initialValue = this.currentValue = { start: null, end: null };
  }
}

export function createDateRangeEditor(options: DateRangeEditorOptions = {}): DateRangeEditor {
  return new DateRangeEditor(options);
}
