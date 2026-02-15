import type { EditorParams } from './cell-editor.interface';
import type { VanillaDateEditorOptions } from './date-editor-types';
import { parseDate, formatDateForCalendar } from './date-utils';

/**
 * Initialize Vanilla Calendar
 */
export async function initializeCalendar(
  calendarWrapper: HTMLDivElement,
  initialValue: Date | null,
  options: Required<Omit<VanillaDateEditorOptions, 'validator'>> & {
    validator?: (value: Date | null) => boolean | string;
  },
  onDateSelected: (date: Date) => void
): Promise<any> {
  const minDate = parseDate(options.minDate);
  const maxDate = parseDate(options.maxDate);

  const calendarOptions: any = {
    type: 'default',
    selectedWeekends: [],
    settings: {
      visibility: {
        theme: options.theme,
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
      clickDay: (_e: any, dates: any) => {
        if (dates.selectedDates && dates.selectedDates.length > 0) {
          const selectedDate = new Date(dates.selectedDates[0]);
          onDateSelected(selectedDate);
        }
      },
    },
  };

  if (initialValue) {
    calendarOptions.settings = {
      ...calendarOptions.settings,
      selected: {
        dates: [formatDateForCalendar(initialValue)],
      },
    };
  }

  const { Calendar } = await import('vanilla-calendar-pro');
  const calendar = new Calendar(calendarWrapper, calendarOptions);
  calendar.init();
  return calendar;
}

/**
 * Create calendar wrapper element
 */
export function createCalendarWrapper(params: EditorParams): HTMLDivElement {
  const calendarWrapper = document.createElement('div');
  calendarWrapper.className = 'vanilla-calendar-wrapper';
  calendarWrapper.style.cssText = `
    position: fixed;
    z-index: 10003;
    background: white;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    display: none;
  `;

  document.body.appendChild(calendarWrapper);

  if (params.registerPopup) {
    params.registerPopup(calendarWrapper);
  }

  return calendarWrapper;
}

/**
 * Position calendar popup relative to input element.
 * Automatically adjusts to stay within viewport boundaries.
 */
export function positionCalendar(
  inputElement: HTMLInputElement,
  calendarWrapper: HTMLDivElement
): void {
  const inputRect = inputElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const calendarRect = calendarWrapper.getBoundingClientRect();
  const calendarWidth = calendarRect.width > 0 ? calendarRect.width : 280;
  const calendarHeight = calendarRect.height > 0 ? calendarRect.height : 320;

  let top = inputRect.bottom + 4;
  let left = inputRect.left;

  const spaceBelow = viewportHeight - inputRect.bottom;
  const spaceAbove = inputRect.top;

  if (spaceBelow < calendarHeight + 8 && spaceAbove > spaceBelow) {
    top = inputRect.top - calendarHeight - 4;
  }

  if (top < 8) {
    top = 8;
  }

  if (top + calendarHeight > viewportHeight - 8) {
    top = viewportHeight - calendarHeight - 8;
  }

  if (left + calendarWidth > viewportWidth - 8) {
    left = viewportWidth - calendarWidth - 8;
  }

  if (left < 8) {
    left = 8;
  }

  calendarWrapper.style.left = `${left}px`;
  calendarWrapper.style.top = `${top}px`;
}

/**
 * Show calendar
 */
export function showCalendar(
  calendarWrapper: HTMLDivElement,
  inputElement: HTMLInputElement
): void {
  calendarWrapper.style.display = 'block';
  positionCalendar(inputElement, calendarWrapper);
}
