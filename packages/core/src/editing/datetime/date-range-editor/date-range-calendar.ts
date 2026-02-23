import type { DateRange, ResolvedDateRangeEditorOptions } from './types';
import { formatDateForCalendar } from '../../../datetime-core';

export interface CalendarRefs {
  startCalendar: any;
  endCalendar: any;
}

export interface CalendarHandlers {
  onStartDateSelect: (date: Date) => void;
  onEndDateSelect: (date: Date) => void;
}

export async function initializeCalendars(
  startDiv: HTMLDivElement,
  endDiv: HTMLDivElement,
  options: ResolvedDateRangeEditorOptions,
  currentValue: DateRange,
  handlers: CalendarHandlers
): Promise<CalendarRefs> {
  const { minDate, maxDate, theme } = options;
  const baseSettings = {
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
  };

  try {
    const { Calendar } = await import('vanilla-calendar-pro');

    const startOptions: any = {
      type: 'default',
      enableJumpToSelectedDate: true,
      settings: {
        ...baseSettings,
        selected: currentValue.start
          ? {
              dates: [formatDateForCalendar(currentValue.start)],
              month: currentValue.start.getMonth(),
              year: currentValue.start.getFullYear(),
            }
          : {},
      },
      actions: {
        clickDay: (_e: any, self: any) => {
          if (self.selectedDates && self.selectedDates.length > 0) {
            const selectedDate = new Date(self.selectedDates[0]);
            if (!isNaN(selectedDate.getTime())) {
              handlers.onStartDateSelect(selectedDate);
            }
          }
        },
      },
    };
    const startCalendar = new Calendar(startDiv, startOptions);
    startCalendar.init();

    const endOptions: any = {
      type: 'default',
      enableJumpToSelectedDate: true,
      settings: {
        ...baseSettings,
        selected: currentValue.end
          ? {
              dates: [formatDateForCalendar(currentValue.end)],
              month: currentValue.end.getMonth(),
              year: currentValue.end.getFullYear(),
            }
          : {},
        range: {
          ...baseSettings.range,
          min: currentValue.start
            ? formatDateForCalendar(currentValue.start)
            : baseSettings.range.min,
        },
      },
      actions: {
        clickDay: (_e: any, self: any) => {
          if (self.selectedDates && self.selectedDates.length > 0) {
            const selectedDate = new Date(self.selectedDates[0]);
            if (!isNaN(selectedDate.getTime())) {
              handlers.onEndDateSelect(selectedDate);
            }
          }
        },
      },
    };
    const endCalendar = new Calendar(endDiv, endOptions);
    endCalendar.init();

    return { startCalendar, endCalendar };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('DateRangeEditor: Failed to load vanilla-calendar-pro:', error);
    return { startCalendar: null, endCalendar: null };
  }
}

export function clearCalendars(
  refs: CalendarRefs,
  options: ResolvedDateRangeEditorOptions
): void {
  if (refs.startCalendar) {
    refs.startCalendar.settings.selected.dates = [];
    refs.startCalendar.update();
  }
  if (refs.endCalendar) {
    refs.endCalendar.settings.selected.dates = [];
    refs.endCalendar.settings.range.min = options.minDate
      ? formatDateForCalendar(options.minDate)
      : '1900-01-01';
    refs.endCalendar.update();
  }
}

export function updateEndCalendarMinDate(endCalendar: any, date: Date): void {
  if (!endCalendar) return;
  endCalendar.settings.range.min = formatDateForCalendar(date);
  endCalendar.update();
}

export function resetEndCalendarSelection(endCalendar: any, endDate: Date | null): void {
  if (!endCalendar) return;
  endCalendar.settings.selected.dates = endDate ? [formatDateForCalendar(endDate)] : [];
  endCalendar.update();
}

export function destroyCalendars(refs: CalendarRefs): void {
  if (refs.startCalendar && typeof refs.startCalendar.destroy === 'function') {
    try {
      refs.startCalendar.destroy();
    } catch (_e) {
      // Ignore errors during cleanup
    }
  }
  if (refs.endCalendar && typeof refs.endCalendar.destroy === 'function') {
    try {
      refs.endCalendar.destroy();
    } catch (_e) {
      // Ignore errors during cleanup
    }
  }
}
