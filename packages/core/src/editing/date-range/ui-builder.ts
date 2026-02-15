import type { DateRange, DateRangeEditorNormalizedOptions } from './types';
import { formatRangeForDisplay, formatDateLong } from './formatters';

/**
 * Create the input element
 */
export function createInputElement(
  value: DateRange,
  options: DateRangeEditorNormalizedOptions,
  onShowCalendar: () => void
): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'text';
  input.readOnly = true;
  input.className = options.className;
  input.placeholder = options.placeholder;

  if (value.start && value.end) {
    input.value = formatRangeForDisplay(value, options.format);
  }

  input.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    outline: 2px solid #4CAF50;
    padding: 4px 8px;
    font-size: 13px;
    font-family: inherit;
    background: #fff;
    box-sizing: border-box;
    cursor: pointer;
  `;

  input.addEventListener('click', (e) => {
    e.stopPropagation();
    onShowCalendar();
  });

  return input;
}

/**
 * Create calendar wrapper
 */
export function createCalendarWrapper(): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'date-range-calendar-wrapper zg-date-range-picker zg-custom-popup';
  wrapper.style.cssText = `
    position: fixed;
    z-index: 10003;
    background: white;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border-radius: 12px;
    display: none;
    padding: 20px 24px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  return wrapper;
}

/**
 * Create header with date pill and action buttons
 */
export function createHeader(
  onClear: () => void,
  onCancel: () => void,
  onApply: () => void
): { header: HTMLElement; buttonHandlers: Array<{ element: HTMLElement; event: string; handler: EventListener }> } {
  const buttonHandlers: Array<{ element: HTMLElement; event: string; handler: EventListener }> = [];

  const header = document.createElement('div');
  header.className = 'zg-date-range-header';
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
    gap: 16px;
  `;

  const dateRangePill = document.createElement('div');
  dateRangePill.id = 'date-range-pill';
  dateRangePill.className = 'zg-date-range-pill';
  dateRangePill.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 24px;
    font-size: 14px;
    color: #374151;
    white-space: nowrap;
  `;
  dateRangePill.innerHTML = `
    <span id="pill-start-date" style="color: #111827;">Select start date</span>
    <span style="color: #9ca3af;">—</span>
    <span id="pill-end-date" style="color: #111827;">Select end date</span>
  `;

  const actionsContainer = document.createElement('div');
  actionsContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
  `;

  const clearBtn = document.createElement('button');
  clearBtn.id = 'range-clear-btn';
  clearBtn.textContent = 'Clear filters';
  clearBtn.style.cssText = `
    background: transparent;
    color: #4f7df3;
    border: none;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  `;
  clearBtn.addEventListener('mouseenter', () => { clearBtn.style.textDecoration = 'underline'; });
  clearBtn.addEventListener('mouseleave', () => { clearBtn.style.textDecoration = 'none'; });
  clearBtn.addEventListener('click', onClear);
  buttonHandlers.push({ element: clearBtn, event: 'click', handler: onClear });

  const cancelBtn = document.createElement('button');
  cancelBtn.id = 'range-cancel-btn';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = `
    background: transparent;
    color: #374151;
    border: none;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  `;
  cancelBtn.addEventListener('mouseenter', () => { cancelBtn.style.color = '#111827'; });
  cancelBtn.addEventListener('mouseleave', () => { cancelBtn.style.color = '#374151'; });
  cancelBtn.addEventListener('click', onCancel);
  buttonHandlers.push({ element: cancelBtn, event: 'click', handler: onCancel });

  const applyBtn = document.createElement('button');
  applyBtn.id = 'range-apply-btn';
  applyBtn.textContent = 'Apply';
  applyBtn.style.cssText = `
    background: #4f7df3;
    color: white;
    border: none;
    padding: 8px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background 0.2s;
  `;
  applyBtn.addEventListener('mouseenter', () => { applyBtn.style.background = '#3b6ce7'; });
  applyBtn.addEventListener('mouseleave', () => { applyBtn.style.background = '#4f7df3'; });
  applyBtn.addEventListener('click', onApply);
  buttonHandlers.push({ element: applyBtn, event: 'click', handler: onApply });

  actionsContainer.appendChild(clearBtn);
  actionsContainer.appendChild(cancelBtn);
  actionsContainer.appendChild(applyBtn);

  header.appendChild(dateRangePill);
  header.appendChild(actionsContainer);

  return { header, buttonHandlers };
}

/**
 * Create calendars container with start and end calendar divs
 */
export function createCalendarsContainer(): {
  container: HTMLElement;
  startCalendarDiv: HTMLDivElement;
  endCalendarDiv: HTMLDivElement;
} {
  const container = document.createElement('div');
  container.style.cssText = `display: flex; gap: 32px;`;

  const startSection = document.createElement('div');
  startSection.style.cssText = `flex: 1;`;
  const startLabel = document.createElement('div');
  startLabel.textContent = 'From';
  startLabel.style.cssText = `
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 12px;
  `;
  startSection.appendChild(startLabel);

  const startCalendarDiv = document.createElement('div');
  startCalendarDiv.className = 'start-calendar zg-custom-calendar';
  startSection.appendChild(startCalendarDiv);
  container.appendChild(startSection);

  const endSection = document.createElement('div');
  endSection.style.cssText = `flex: 1;`;
  const endLabel = document.createElement('div');
  endLabel.textContent = 'To';
  endLabel.style.cssText = `
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 12px;
  `;
  endSection.appendChild(endLabel);

  const endCalendarDiv = document.createElement('div');
  endCalendarDiv.className = 'end-calendar zg-custom-calendar';
  endSection.appendChild(endCalendarDiv);
  container.appendChild(endSection);

  return { container, startCalendarDiv, endCalendarDiv };
}

/**
 * Update the date pill display in header
 */
export function updateDatePill(calendarWrapper: HTMLDivElement, currentValue: DateRange): void {
  const startDateEl = calendarWrapper.querySelector('#pill-start-date');
  const endDateEl = calendarWrapper.querySelector('#pill-end-date');

  if (startDateEl) {
    startDateEl.textContent = currentValue.start
      ? formatDateLong(currentValue.start)
      : 'Select start date';
  }

  if (endDateEl) {
    endDateEl.textContent = currentValue.end
      ? formatDateLong(currentValue.end)
      : 'Select end date';
  }
}
