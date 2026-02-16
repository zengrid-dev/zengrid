/**
 * Global set to track all open date pickers (singleton pattern - only one open at a time)
 */
export const globalOpenDatePickers = new Set<HTMLElement>();

/**
 * Parse value into a Date object
 */
export function parseDate(value: any): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

/**
 * Format date for display based on format string
 */
export function formatDateForDisplay(date: Date, format: string): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', String(year));
}

/**
 * Format date for Vanilla Calendar (YYYY-MM-DD)
 */
export function formatDateForCalendar(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Manages date picker state
 */
export class DatePickerState {
  /**
   * Opens a date picker popup and closes any other open pickers
   */
  openPicker(popup: HTMLElement, container: HTMLElement): void {
    // Close other pickers first (singleton pattern)
    this.closeOtherPickers(container);

    popup.style.display = 'block';
    container.classList.add('zg-date-picker-open');
    globalOpenDatePickers.add(container);
  }

  /**
   * Closes a date picker popup
   */
  closePicker(popup: HTMLElement, container: HTMLElement): void {
    popup.style.display = 'none';
    container.classList.remove('zg-date-picker-open');
    globalOpenDatePickers.delete(container);
  }

  /**
   * Closes all other open date pickers (singleton enforcement)
   */
  private closeOtherPickers(currentContainer: HTMLElement): void {
    for (const openContainer of globalOpenDatePickers) {
      if (openContainer !== currentContainer) {
        const popup = openContainer.querySelector('.zg-date-picker-popup') as HTMLElement;
        if (popup) {
          this.closePicker(popup, openContainer);
        }
      }
    }
  }

  /**
   * Check if a picker is currently open
   */
  isOpen(container: HTMLElement): boolean {
    return globalOpenDatePickers.has(container);
  }
}
