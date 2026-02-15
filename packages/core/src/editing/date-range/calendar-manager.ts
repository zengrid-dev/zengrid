import type { DateRange, DateRangeEditorNormalizedOptions } from './types';
import { parseDate, formatDateForCalendar } from './formatters';

/**
 * Initialize both start and end calendars
 */
export async function initializeCalendars(
  startCalendarDiv: HTMLDivElement,
  endCalendarDiv: HTMLDivElement,
  currentValue: DateRange,
  options: DateRangeEditorNormalizedOptions,
  onStartDateSelect: (date: Date) => void,
  onEndDateSelect: (date: Date) => void
): Promise<{ startCalendar: any; endCalendar: any }> {
  const { Calendar } = await import('vanilla-calendar-pro');

  const minDate = parseDate(options.minDate);
  const maxDate = parseDate(options.maxDate);

  const startViewDate = currentValue.start || new Date();
  const startMonth = startViewDate.getMonth();
  const startYear = startViewDate.getFullYear();
  const endViewDate = new Date(startYear, startMonth + 1, 1);

  const startOptions: any = {
    type: 'default',
    dateMin: minDate ? formatDateForCalendar(minDate) : '1900-01-01',
    dateMax: maxDate ? formatDateForCalendar(maxDate) : '2099-12-31',
    selectedDates: currentValue.start ? [formatDateForCalendar(currentValue.start)] : [],
    selectedMonth: startViewDate.getMonth(),
    selectedYear: startViewDate.getFullYear(),
    selectedWeekends: [],
    onClickDate: (self: any) => {
      const selectedDates = self.context.selectedDates;
      if (selectedDates && selectedDates.length > 0) {
        onStartDateSelect(new Date(selectedDates[0]));
      }
    },
  };

  const endMinDate = currentValue.start
    ? formatDateForCalendar(currentValue.start)
    : minDate
      ? formatDateForCalendar(minDate)
      : '1900-01-01';

  const endOptions: any = {
    type: 'default',
    dateMin: endMinDate,
    dateMax: maxDate ? formatDateForCalendar(maxDate) : '2099-12-31',
    selectedDates: currentValue.end ? [formatDateForCalendar(currentValue.end)] : [],
    selectedMonth: endViewDate.getMonth(),
    selectedYear: endViewDate.getFullYear(),
    selectedWeekends: [],
    onClickDate: (self: any) => {
      const selectedDates = self.context.selectedDates;
      if (selectedDates && selectedDates.length > 0) {
        onEndDateSelect(new Date(selectedDates[0]));
      }
    },
  };

  const startCalendar = new Calendar(startCalendarDiv, startOptions);
  startCalendar.init();

  const endCalendar = new Calendar(endCalendarDiv, endOptions);
  endCalendar.init();

  return { startCalendar, endCalendar };
}

/**
 * Update end calendar's minimum date after start date selection
 */
export function updateEndCalendarMinDate(
  endCalendar: any,
  startDate: Date | null,
  endDate: Date | null
): void {
  if (!endCalendar || !startDate) return;

  const newMinDate = formatDateForCalendar(startDate);
  endCalendar.set({ dateMin: newMinDate });

  if (!endDate) {
    endCalendar.set({ selectedDates: [] });
  }

  endCalendar.update();
}

/**
 * Reinitialize calendars (for Clear button)
 */
export function reinitializeCalendars(
  startCalendar: any,
  endCalendar: any,
  minDate: Date | string
): void {
  const parsedMinDate = parseDate(minDate);

  if (startCalendar) {
    startCalendar.set({ selectedDates: [] });
    startCalendar.update();
  }

  if (endCalendar) {
    endCalendar.set({
      dateMin: parsedMinDate ? formatDateForCalendar(parsedMinDate) : '1900-01-01',
      selectedDates: [],
    });
    endCalendar.update();
  }
}
