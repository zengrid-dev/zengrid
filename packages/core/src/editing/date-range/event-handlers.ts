import type { EditorParams } from '../cell-editor.interface';
import type { DateRange, DateRangeEditorNormalizedOptions } from './types';
import { throttle } from '@zengrid/shared';
import { isCellInViewport, positionCalendar } from './positioning';
import { formatDateForDisplay, formatRangeForDisplay } from './formatters';
import { updateDatePill } from './ui-builder';
import { updateEndCalendarMinDate, reinitializeCalendars } from './calendar-manager';

/**
 * Create date selection handlers
 */
export function createDateSelectionHandlers(
  currentValue: DateRange,
  _inputElement: HTMLInputElement | null,
  calendarWrapper: HTMLDivElement | null,
  endCalendar: any,
  _options: DateRangeEditorNormalizedOptions,
  updateInputDisplay: () => void
) {
  const handleStartDateSelect = (date: Date): void => {
    currentValue.start = date;
    if (currentValue.end && currentValue.end < date) {
      currentValue.end = null;
    }
    updateInputDisplay();
    if (calendarWrapper) {
      updateDatePill(calendarWrapper, currentValue);
    }
    updateEndCalendarMinDate(endCalendar, currentValue.start, currentValue.end);
  };

  const handleEndDateSelect = (date: Date): void => {
    currentValue.end = date;
    updateInputDisplay();
    if (calendarWrapper) {
      updateDatePill(calendarWrapper, currentValue);
    }
  };

  return { handleStartDateSelect, handleEndDateSelect };
}

/**
 * Create button action handlers
 */
export function createButtonHandlers(
  currentValue: DateRange,
  initialValue: DateRange,
  calendarWrapper: HTMLDivElement | null,
  startCalendar: any,
  endCalendar: any,
  options: DateRangeEditorNormalizedOptions,
  params: EditorParams | null,
  updateInputDisplay: () => void
) {
  const handleClear = (): void => {
    currentValue.start = null;
    currentValue.end = null;
    updateInputDisplay();
    if (calendarWrapper) {
      updateDatePill(calendarWrapper, currentValue);
    }
    reinitializeCalendars(startCalendar, endCalendar, options.minDate);
  };

  const handleCancel = (): void => {
    if (params?.onComplete) {
      params.onComplete(initialValue, true);
    }
  };

  const handleApply = (): void => {
    if (params?.onComplete) {
      params.onComplete(currentValue, false);
    }
  };

  return { handleClear, handleCancel, handleApply };
}

/**
 * Setup scroll handler for calendar repositioning
 */
export function setupScrollHandler(
  calendarWrapper: HTMLDivElement | null,
  inputElement: HTMLInputElement | null,
  cellElement: HTMLElement | null,
  gridScrollContainer: HTMLElement | null,
  currentValue: DateRange,
  params: EditorParams | null
): ((e: Event) => void) | null {
  if (!gridScrollContainer) return null;

  const scrollHandler = throttle((e: Event) => {
    if (!calendarWrapper || calendarWrapper.style.display === 'none') return;
    if (e.target && calendarWrapper.contains(e.target as Node)) return;

    if (!isCellInViewport(cellElement, gridScrollContainer)) {
      if (params?.onComplete) {
        params.onComplete(currentValue, false);
      }
    } else if (inputElement) {
      positionCalendar(inputElement, calendarWrapper);
    }
  }, 50);

  gridScrollContainer.addEventListener('scroll', scrollHandler);
  return scrollHandler;
}

/**
 * Setup resize handler for calendar repositioning
 */
export function setupResizeHandler(
  calendarWrapper: HTMLDivElement | null,
  inputElement: HTMLInputElement | null
): (() => void) | null {
  const resizeHandler = throttle(() => {
    if (calendarWrapper && calendarWrapper.style.display !== 'none' && inputElement) {
      positionCalendar(inputElement, calendarWrapper);
    }
  }, 100);

  window.addEventListener('resize', resizeHandler);
  return resizeHandler;
}

/**
 * Update input display with current value
 */
export function updateInputElementDisplay(
  inputElement: HTMLInputElement | null,
  currentValue: DateRange,
  format: string
): void {
  if (!inputElement) return;

  if (currentValue.start && currentValue.end) {
    inputElement.value = formatRangeForDisplay(currentValue, format);
  } else if (currentValue.start) {
    inputElement.value = `${formatDateForDisplay(currentValue.start, format)} - ...`;
  } else {
    inputElement.value = '';
  }
}
