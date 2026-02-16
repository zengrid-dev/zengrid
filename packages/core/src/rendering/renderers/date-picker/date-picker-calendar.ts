import type { DatePickerRendererOptions } from './date-picker-types';
import { parseDate, formatDateForCalendar } from './date-picker-state';

/**
 * Initialize vanilla-calendar-pro in the calendar wrapper
 */
export async function initializeCalendar(
  calendarWrapper: HTMLElement,
  initialValue: Date | null,
  options: Required<
    Pick<DatePickerRendererOptions, 'format' | 'minDate' | 'maxDate' | 'theme'>
  >,
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
 * Update the selected date in an existing calendar
 */
export function updateCalendarDate(calendar: any, date: Date | null): void {
  if (!calendar) return;

  if (date) {
    calendar.settings.selected.dates = [formatDateForCalendar(date)];
  } else {
    calendar.settings.selected.dates = [];
  }
  calendar.update();
}

/**
 * Destroy a calendar instance
 */
export function destroyCalendar(calendar: any): void {
  if (calendar && typeof calendar.destroy === 'function') {
    calendar.destroy();
  }
}
