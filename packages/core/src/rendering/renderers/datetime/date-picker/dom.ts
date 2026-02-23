/**
 * DOM utilities for DatePickerRenderer
 */

import type { RenderParams } from '../../renderer.interface';
import { formatDateForDisplay } from '../../../../datetime-core';

/**
 * Calendar icon SVG
 */
const CALENDAR_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
  <line x1="16" y1="2" x2="16" y2="6"></line>
  <line x1="8" y1="2" x2="8" y2="6"></line>
  <line x1="3" y1="10" x2="21" y2="10"></line>
</svg>`;

/**
 * Create the date picker container
 */
export function createContainer(className: string): HTMLElement {
  const container = document.createElement('div');
  container.className = `zg-datetime-container zg-date-picker-wrapper ${className}`;
  return container;
}

/**
 * Create the trigger button
 */
export function createTrigger(
  displayText: string,
  isPlaceholder: boolean,
  disabled: boolean
): HTMLElement {
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'zg-datetime-trigger zg-date-picker-trigger';
  if (disabled) {
    trigger.classList.add('zg-datetime-disabled');
    trigger.disabled = true;
  }

  const textSpan = document.createElement('span');
  textSpan.className = 'zg-datetime-trigger-text';
  if (isPlaceholder) {
    textSpan.classList.add('placeholder');
  }
  textSpan.textContent = displayText;
  trigger.appendChild(textSpan);

  const icon = document.createElement('span');
  icon.className = 'zg-datetime-trigger-icon';
  icon.innerHTML = CALENDAR_ICON;
  icon.setAttribute('aria-hidden', 'true');
  trigger.appendChild(icon);

  return trigger;
}

/**
 * Create the popup container
 */
export function createPopup(zIndex: number): HTMLElement {
  const popup = document.createElement('div');
  popup.className = 'zg-datetime-popup zg-date-picker-popup';
  popup.style.zIndex = String(zIndex);
  popup.style.display = 'none';
  return popup;
}

/**
 * Create the calendar wrapper
 */
export function createCalendarWrapper(): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'zg-datetime-calendar-wrapper zg-date-picker-calendar-wrapper';
  return wrapper;
}

/**
 * Update trigger display text
 */
export function updateTriggerDisplay(
  trigger: HTMLElement,
  value: Date | null,
  format: string,
  placeholder: string
): void {
  const textSpan = trigger.querySelector('.zg-datetime-trigger-text');
  if (!textSpan) return;

  if (value) {
    textSpan.textContent = formatDateForDisplay(value, format);
    textSpan.classList.remove('placeholder');
  } else {
    textSpan.textContent = placeholder;
    textSpan.classList.add('placeholder');
  }
}

/**
 * Get display text for a date value
 */
export function getDisplayText(value: Date | null, format: string, placeholder: string): string {
  return value ? formatDateForDisplay(value, format) : placeholder;
}

/**
 * Set ARIA attributes for accessibility
 */
export function setAriaAttributes(
  trigger: HTMLElement,
  popup: HTMLElement,
  params: RenderParams
): void {
  // Generate unique IDs
  const popupId = `zg-date-picker-popup-${params.cell.row}-${params.cell.col}`;

  // Trigger attributes
  trigger.setAttribute('role', 'combobox');
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', popupId);
  trigger.setAttribute(
    'aria-label',
    `${params.column?.header || params.column?.field || 'Date'} date picker`
  );

  // Popup attributes
  popup.id = popupId;
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-modal', 'true');
  popup.setAttribute('aria-label', 'Choose date');
}

/**
 * Update ARIA expanded state
 */
export function setAriaExpanded(trigger: HTMLElement, expanded: boolean): void {
  trigger.setAttribute('aria-expanded', String(expanded));
}

/**
 * Set data attributes on container
 */
export function setDataAttributes(container: HTMLElement, params: RenderParams): void {
  container.dataset.row = String(params.cell.row);
  container.dataset.col = String(params.cell.col);
  if (params.column?.field) {
    container.dataset.field = params.column.field;
  }
}
