import type { RenderParams } from '../renderer.interface';
import { formatDateForDisplay } from './date-picker-state';

/**
 * Creates the date picker trigger button
 */
export function createDatePickerTrigger(
  displayText: string,
  disabled: boolean = false
): HTMLElement {
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'zg-date-picker-trigger';
  if (disabled) {
    trigger.classList.add('zg-date-picker-disabled');
    trigger.disabled = true;
  }

  const textSpan = document.createElement('span');
  textSpan.className = 'zg-date-picker-text';
  textSpan.textContent = displayText;
  trigger.appendChild(textSpan);

  const icon = document.createElement('span');
  icon.className = 'zg-date-picker-icon';
  icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>`;
  icon.setAttribute('aria-hidden', 'true');
  trigger.appendChild(icon);

  return trigger;
}

/**
 * Creates the calendar popup container (fixed positioned)
 */
export function createCalendarPopup(): HTMLElement {
  const popup = document.createElement('div');
  popup.className = 'zg-date-picker-popup';
  popup.style.display = 'none';
  return popup;
}

/**
 * Creates the wrapper for vanilla-calendar-pro
 */
export function createCalendarWrapper(): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'zg-date-picker-calendar-wrapper';
  return wrapper;
}

/**
 * Position popup relative to trigger element with viewport awareness
 */
export function positionPopup(
  trigger: HTMLElement,
  popup: HTMLElement
): void {
  const triggerRect = trigger.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Get popup dimensions (estimate if not visible)
  const popupRect = popup.getBoundingClientRect();
  const popupWidth = popupRect.width > 0 ? popupRect.width : 280;
  const popupHeight = popupRect.height > 0 ? popupRect.height : 320;

  // Calculate available space above and below
  const spaceBelow = viewportHeight - triggerRect.bottom;
  const spaceAbove = triggerRect.top;

  // Default: position below trigger
  let top = triggerRect.bottom + 4;
  let left = triggerRect.left;

  // Flip above if not enough space below and more space above
  if (spaceBelow < popupHeight + 8 && spaceAbove > spaceBelow) {
    top = triggerRect.top - popupHeight - 4;
  }

  // Clamp to viewport bounds
  if (top < 8) {
    top = 8;
  }
  if (top + popupHeight > viewportHeight - 8) {
    top = viewportHeight - popupHeight - 8;
  }

  // Horizontal positioning
  if (left + popupWidth > viewportWidth - 8) {
    left = viewportWidth - popupWidth - 8;
  }
  if (left < 8) {
    left = 8;
  }

  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
}

/**
 * Update the trigger display text
 */
export function updateTriggerDisplay(
  trigger: HTMLElement,
  value: Date | null,
  format: string,
  placeholder: string
): void {
  const textSpan = trigger.querySelector('.zg-date-picker-text');
  if (textSpan) {
    textSpan.textContent = value ? formatDateForDisplay(value, format) : placeholder;
  }
}

/**
 * Set ARIA attributes for accessibility
 */
export function setAriaAttributes(
  container: HTMLElement,
  params: RenderParams
): void {
  const trigger = container.querySelector('.zg-date-picker-trigger') as HTMLElement;
  const popup = container.querySelector('.zg-date-picker-popup') as HTMLElement;

  if (trigger) {
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute(
      'aria-label',
      `${params.column?.header || params.column?.field || 'Date'} date picker`
    );
  }

  if (popup) {
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');
    popup.setAttribute('aria-label', 'Choose date');
  }
}

/**
 * Get display text for a date value
 */
export function getDisplayText(
  value: Date | null,
  format: string,
  placeholder: string
): string {
  if (!value) {
    return placeholder;
  }
  return formatDateForDisplay(value, format);
}
