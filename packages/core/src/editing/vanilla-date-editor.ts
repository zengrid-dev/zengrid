import type { CellEditor, EditorParams, ValidationResult } from './cell-editor.interface';
import { throttle } from '@zengrid/shared';
import type { VanillaDateEditorOptions } from './date-editor-types';
import { parseDate, formatDateForDisplay } from './date-utils';
import { createInputElement } from './date-input';
import { createCalendarWrapper, initializeCalendar, positionCalendar, showCalendar } from './date-calendar';
import { validateDate } from './date-validation';

export type { VanillaDateEditorOptions };

export class VanillaDateEditor implements CellEditor<Date | null> {
  private options: Required<Omit<VanillaDateEditorOptions, 'validator'>> & {
    validator?: (value: Date | null) => boolean | string;
  };
  private inputElement: HTMLInputElement | null = null;
  private calendarWrapper: HTMLDivElement | null = null;
  private calendar: any = null;
  private params: EditorParams | null = null;
  private initialValue: Date | null = null;
  private currentValue: Date | null = null;
  private scrollHandler: (() => void) | null = null;
  private resizeHandler: (() => void) | null = null;

  constructor(options: VanillaDateEditorOptions = {}) {
    this.options = {
      format: options.format ?? 'DD/MM/YYYY',
      minDate: options.minDate ?? new Date('1900-01-01'),
      maxDate: options.maxDate ?? new Date('2099-12-31'),
      required: options.required ?? false,
      placeholder: options.placeholder ?? 'Select date...',
      className: options.className ?? 'zg-vanilla-date-editor',
      autoFocus: options.autoFocus ?? true,
      validator: options.validator,
      stopOnBlur: options.stopOnBlur ?? true,
      theme: options.theme ?? 'light',
    };
  }

  init(container: HTMLElement, value: Date | null, params: EditorParams): void {
    this.params = params;
    this.initialValue = parseDate(value);
    this.currentValue = this.initialValue;

    container.innerHTML = '';

    // Create wrapper for input + calendar
    const wrapper = document.createElement('div');
    wrapper.className = `${this.options.className}-wrapper`;
    wrapper.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
    `;

    // Create input element
    this.inputElement = createInputElement(
      this.initialValue,
      this.options,
      () => this.handleShowCalendar()
    );
    wrapper.appendChild(this.inputElement);

    // Create calendar wrapper
    this.calendarWrapper = createCalendarWrapper(params);

    container.appendChild(wrapper);

    // Initialize Vanilla Calendar (async)
    initializeCalendar(
      this.calendarWrapper,
      this.initialValue,
      this.options,
      (selectedDate) => this.handleDateSelected(selectedDate)
    ).then((calendar) => {
      this.calendar = calendar;

      requestAnimationFrame(() => {
        if (this.calendarWrapper && this.inputElement) {
          showCalendar(this.calendarWrapper, this.inputElement);
        }

        if (this.options.autoFocus) {
          this.focus();
        }

        // Setup scroll handler to close editor on scroll
        this.scrollHandler = () => {
          if (this.calendarWrapper && this.calendarWrapper.style.display !== 'none') {
            if (this.params?.onComplete) {
              this.params.onComplete(this.currentValue, false);
            }
          }
        };
        window.addEventListener('scroll', this.scrollHandler, true);

        // Setup resize handler to reposition on window resize
        this.resizeHandler = throttle(() => {
          if (this.calendarWrapper && this.inputElement && this.calendarWrapper.style.display !== 'none') {
            positionCalendar(this.inputElement, this.calendarWrapper);
          }
        }, 100);
        window.addEventListener('resize', this.resizeHandler);
      });
    });
  }

  private handleDateSelected(selectedDate: Date): void {
    this.currentValue = selectedDate;

    if (this.inputElement) {
      this.inputElement.value = formatDateForDisplay(selectedDate, this.options.format);
    }

    setTimeout(() => {
      if (this.params?.onComplete) {
        this.params.onComplete(this.currentValue, false);
      }
    }, 100);
  }

  private handleShowCalendar(): void {
    if (this.calendarWrapper && this.inputElement) {
      showCalendar(this.calendarWrapper, this.inputElement);
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

  getValue(): Date | null {
    return this.currentValue;
  }

  isValid(): boolean | ValidationResult {
    return validateDate(this.currentValue, this.options);
  }

  focus(): void {
    if (this.inputElement) {
      this.inputElement.focus();
    }
  }

  destroy(): void {
    if (this.calendar) {
      this.calendar.destroy();
      this.calendar = null;
    }

    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler, true);
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

    this.params = null;
    this.initialValue = null;
    this.currentValue = null;
  }
}

export function createVanillaDateEditor(
  options: VanillaDateEditorOptions = {}
): VanillaDateEditor {
  return new VanillaDateEditor(options);
}
