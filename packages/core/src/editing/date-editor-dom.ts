import type { EditorParams } from './cell-editor.interface';
import type { DateEditorOptions } from './date-editor-types-native';
import { parseDate, formatDateForInput } from './date-editor-formatting';

/**
 * Create the date input element with all attributes and event listeners
 *
 * @param value - Initial value
 * @param params - Edit parameters
 * @param options - Editor options
 * @param onInput - Input change callback
 * @returns The configured input element
 */
export function createInputElement(
  value: Date | null,
  params: EditorParams,
  options: Required<Omit<DateEditorOptions, 'validator'>> & {
    validator?: (value: Date | null) => boolean | string;
  },
  onInput?: (value: Date | null) => void
): HTMLInputElement {
  const input = document.createElement('input');

  // Set input type based on configuration
  input.type = options.useNativePicker ? options.type : 'text';
  input.className = options.className;

  // Set initial value
  const dateValue = parseDate(value);
  if (dateValue) {
    input.value = formatDateForInput(dateValue, options.type);
  }

  if (options.placeholder) {
    input.placeholder = options.placeholder;
  }

  if (options.required) {
    input.required = true;
  }

  // Set min/max attributes for native date picker
  if (options.useNativePicker) {
    const minDate = parseDate(options.minDate);
    const maxDate = parseDate(options.maxDate);

    if (minDate) {
      input.min = formatDateForInput(minDate, options.type);
    }
    if (maxDate) {
      input.max = formatDateForInput(maxDate, options.type);
    }
  }

  // Set ARIA attributes for accessibility
  input.setAttribute('role', 'textbox');
  input.setAttribute(
    'aria-label',
    `Edit ${params.column?.header || params.column?.field || 'date'}`
  );
  input.setAttribute('aria-required', String(options.required));

  // Set data attributes
  input.dataset.row = String(params.cell.row);
  input.dataset.col = String(params.cell.col);
  if (params.column?.field) {
    input.dataset.field = params.column.field;
  }

  // Inline styles for better UX
  input.style.width = '100%';
  input.style.height = '100%';
  input.style.border = 'none';
  input.style.outline = '2px solid #4CAF50';
  input.style.padding = '4px 8px';
  input.style.fontSize = '13px';
  input.style.fontFamily = 'inherit';
  input.style.backgroundColor = '#fff';
  input.style.boxSizing = 'border-box';

  // onChange callback for real-time updates
  if (onInput) {
    input.addEventListener('input', () => {
      const inputValue = input.value === '' ? null : parseDate(input.value);
      onInput(inputValue);
    });
  }

  // Prevent event propagation to grid
  input.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
  });

  input.addEventListener('mousedown', (e: MouseEvent) => {
    e.stopPropagation();
  });

  return input;
}
