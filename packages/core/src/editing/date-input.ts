import type { VanillaDateEditorOptions } from './date-editor-types';
import { formatDateForDisplay } from './date-utils';

/**
 * Create the input element
 */
export function createInputElement(
  value: Date | null,
  options: Required<Omit<VanillaDateEditorOptions, 'validator'>> & {
    validator?: (value: Date | null) => boolean | string;
  },
  onShowCalendar: () => void
): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'text';
  input.readOnly = true;
  input.className = options.className;
  input.placeholder = options.placeholder;

  if (value) {
    input.value = formatDateForDisplay(value, options.format);
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
