/**
 * ZenGrid DateTime Core
 *
 * Shared infrastructure for all datetime components:
 * - Date/Time pickers (renderers)
 * - Date/Time editors
 * - Date range components
 *
 * Key features:
 * - Reliable click-outside detection
 * - Unified scroll handling
 * - CSS variable theming
 * - Keyboard navigation
 * - vanilla-calendar-pro integration
 */

// Popup management
export {
  PopupManager,
  createPopupController,
  ClickOutsideManager,
  onClickOutside,
  positionPopup,
  updatePopupPosition,
  calculatePosition,
  canShowPopup,
} from './popup';
export type {
  PopupConfig,
  ClickOutsideRegistration,
  PositionOptions,
  PositionResult,
} from './popup';

// Scroll handling
export { ScrollHandler, onScroll } from './scroll';
export type { ScrollAction, ScrollHandlerOptions } from './scroll';

// Keyboard navigation
export { createKeyboardHandler, FocusTrap, setupDatetimeKeyboard } from './keyboard';
export type { KeyboardNavOptions } from './keyboard';

// Theming
export { ThemeManager, setDatetimeTheme, setDatetimeThemeConfig } from './theming';
export type { DatetimeTheme, ThemeConfig } from './theming';

// Calendar adapter
export {
  VanillaCalendarAdapter,
  createCalendar,
  formatDateForCalendar,
  parseCalendarDate,
} from './calendar';
export type { CalendarOptions } from './calendar';

// Parsing
export { parseDate, parseTime, parseDateTime, isDateInRange, isValidDate } from './parsing';

// Formatting
export {
  formatDate,
  formatDateForDisplay,
  formatTime,
  formatDateTime,
  formatDateRange,
  getRelativeTime,
  getDateLabel,
} from './formatting';
