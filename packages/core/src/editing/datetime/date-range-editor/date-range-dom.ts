import type { DateRange, ResolvedDateRangeEditorOptions } from './types';
import type { EditorParams } from '../../cell-editor.interface';
import { formatDateRange, PopupManager, setupDatetimeKeyboard } from '../../../datetime-core';
import { getDisplayText } from './date-range-validation';

export interface HeaderHandlers {
  onClear: () => void;
  onCancel: () => void;
  onApply: () => void;
}

export function createInputElement(
  options: ResolvedDateRangeEditorOptions,
  currentValue: DateRange
): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = `${options.className}-input zg-datetime-input`;
  input.placeholder = options.placeholder;
  input.readOnly = true;

  input.value = formatDateRange(
    currentValue.start,
    currentValue.end,
    options.format,
    options.separator
  );

  input.setAttribute('aria-label', 'Date range input');
  if (options.required) {
    input.setAttribute('aria-required', 'true');
  }

  return input;
}

export function createPopupElement(
  options: ResolvedDateRangeEditorOptions,
  currentValue: DateRange,
  handlers: HeaderHandlers
): {
  popup: HTMLDivElement;
  startCalendarDiv: HTMLDivElement;
  endCalendarDiv: HTMLDivElement;
} {
  const popup = document.createElement('div');
  popup.className = 'zg-datetime-popup zg-date-range-editor-popup';
  popup.style.display = 'none';
  popup.style.zIndex = '9999';

  const header = createHeaderElement(options, currentValue, handlers);
  popup.appendChild(header);

  const calendarsContainer = document.createElement('div');
  calendarsContainer.className = 'zg-date-range-calendars';
  calendarsContainer.style.cssText = 'display: flex; gap: 16px;';

  const startSection = document.createElement('div');
  startSection.className = 'zg-date-range-start';
  const startLabel = document.createElement('div');
  startLabel.className = 'zg-date-range-label';
  startLabel.textContent = 'Start Date';
  const startCalendarDiv = document.createElement('div');
  startCalendarDiv.className = 'zg-datetime-calendar-wrapper';
  startSection.appendChild(startLabel);
  startSection.appendChild(startCalendarDiv);

  const endSection = document.createElement('div');
  endSection.className = 'zg-date-range-end';
  const endLabel = document.createElement('div');
  endLabel.className = 'zg-date-range-label';
  endLabel.textContent = 'End Date';
  const endCalendarDiv = document.createElement('div');
  endCalendarDiv.className = 'zg-datetime-calendar-wrapper';
  endSection.appendChild(endLabel);
  endSection.appendChild(endCalendarDiv);

  calendarsContainer.appendChild(startSection);
  calendarsContainer.appendChild(endSection);
  popup.appendChild(calendarsContainer);

  return { popup, startCalendarDiv, endCalendarDiv };
}

function createHeaderElement(
  options: ResolvedDateRangeEditorOptions,
  currentValue: DateRange,
  handlers: HeaderHandlers
): HTMLElement {
  const header = document.createElement('div');
  header.className = 'zg-date-range-header';
  header.style.cssText =
    'display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--zg-datetime-border-color);';

  const rangeDisplay = document.createElement('div');
  rangeDisplay.className = 'zg-date-range-display';
  rangeDisplay.textContent = getDisplayText(currentValue, options);
  header.appendChild(rangeDisplay);

  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'zg-date-range-buttons';
  buttonContainer.style.cssText = 'display: flex; gap: 8px;';

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'zg-date-range-btn zg-date-range-btn-clear';
  clearBtn.textContent = 'Clear';
  clearBtn.onclick = () => handlers.onClear();

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'zg-date-range-btn zg-date-range-btn-cancel';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = () => handlers.onCancel();

  const applyBtn = document.createElement('button');
  applyBtn.type = 'button';
  applyBtn.className = 'zg-date-range-btn zg-date-range-btn-apply';
  applyBtn.textContent = 'Apply';
  applyBtn.onclick = () => handlers.onApply();

  buttonContainer.appendChild(clearBtn);
  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(applyBtn);
  header.appendChild(buttonContainer);

  return header;
}

export function updateDisplay(
  inputElement: HTMLInputElement | null,
  popup: HTMLDivElement | null,
  currentValue: DateRange,
  options: ResolvedDateRangeEditorOptions
): void {
  if (inputElement) {
    inputElement.value = formatDateRange(
      currentValue.start,
      currentValue.end,
      options.format,
      options.separator
    );
  }

  const display = popup?.querySelector('.zg-date-range-display');
  if (display) {
    display.textContent = getDisplayText(currentValue, options);
  }
}

export function setupEventHandlers(
  inputElement: HTMLInputElement,
  container: HTMLElement,
  popup: HTMLDivElement,
  popupManager: PopupManager,
  handlers: { onCancel: () => void; onApply: () => void; showPopup: () => void }
): () => void {
  const cleanupFns: (() => void)[] = [];

  const handleClick = () => {
    if (!popupManager.isOpen(popup)) handlers.showPopup();
  };
  inputElement.addEventListener('click', handleClick);
  cleanupFns.push(() => inputElement.removeEventListener('click', handleClick));

  const cleanupKeyboard = setupDatetimeKeyboard(container, {
    onEscape: () => handlers.onCancel(),
    onEnter: () => handlers.onApply(),
  });
  cleanupFns.push(cleanupKeyboard);

  return () => cleanupFns.forEach((fn) => fn());
}

export function showPopup(
  popup: HTMLDivElement,
  inputElement: HTMLInputElement,
  popupManager: PopupManager,
  options: ResolvedDateRangeEditorOptions,
  params: EditorParams | null,
  additionalElements: HTMLElement[]
): void {
  const scrollOptions: any = { closeOnOutOfView: options.closeOnScroll };
  if (params?.scrollContainer) {
    scrollOptions.additionalScrollContainers = [params.scrollContainer];
  }
  popupManager.open({
    popup,
    anchor: inputElement,
    onClose: () => {},
    additionalElements: additionalElements.filter(Boolean),
    positionOptions: { placement: 'bottom-start', offset: 4 },
    scrollOptions,
  });
}
