import type { CellRenderer, RenderParams } from './renderer.interface';

/**
 * Configuration options for CheckboxRenderer
 */
export interface CheckboxRendererOptions {
  /** Value to consider as checked (default: true) */
  checkedValue?: any;
  /** Value to consider as unchecked (default: false) */
  uncheckedValue?: any;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  /** Whether to show indeterminate state for null values */
  indeterminate?: boolean;
  /** Callback when checkbox value changes */
  onChange?: (value: any, params: RenderParams) => void;
  /** Custom CSS class for the checkbox */
  className?: string;
}

/**
 * CheckboxRenderer - Renders a checkbox for boolean/tri-state values
 *
 * Features:
 * - Checked/unchecked/indeterminate states
 * - Disabled state support
 * - Custom checked/unchecked values (not just boolean)
 * - ARIA attributes for accessibility
 * - Efficient update() for value changes
 *
 * Performance: Optimized for virtual scrolling with update() method
 *
 * @example
 * ```typescript
 * const renderer = new CheckboxRenderer({
 *   checkedValue: 1,
 *   uncheckedValue: 0,
 *   indeterminate: true,
 *   onChange: (value, params) => {
 *     console.log(`Row ${params.cell.row} changed to:`, value);
 *   }
 * });
 * ```
 */
export class CheckboxRenderer implements CellRenderer {
  private options: Required<CheckboxRendererOptions>;
  private eventHandlers: Map<HTMLElement, EventListener>;

  constructor(options: CheckboxRendererOptions = {}) {
    this.options = {
      checkedValue: options.checkedValue ?? true,
      uncheckedValue: options.uncheckedValue ?? false,
      disabled: options.disabled ?? false,
      indeterminate: options.indeterminate ?? false,
      onChange: options.onChange ?? (() => {}),
      className: options.className ?? 'zg-cell-checkbox',
    };

    this.eventHandlers = new Map();
  }

  /**
   * Initial render - creates checkbox structure
   */
  render(element: HTMLElement, params: RenderParams): void {
    // Add base class
    element.classList.add('zg-cell-checkbox-container');

    // Create wrapper for styling
    const wrapper = document.createElement('div');
    wrapper.className = 'zg-checkbox-wrapper';

    // Create checkbox input
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = this.options.className;

    // Set data attributes for debugging
    checkbox.dataset.row = String(params.cell.row);
    checkbox.dataset.col = String(params.cell.col);
    if (params.column?.field) {
      checkbox.dataset.field = params.column.field;
    }

    wrapper.appendChild(checkbox);
    element.appendChild(wrapper);

    // Add change event handler
    const handler: EventListener = (e: Event) => {
      e.stopPropagation();
      const target = e.target as HTMLInputElement;
      const newValue = target.checked
        ? this.options.checkedValue
        : this.options.uncheckedValue;

      // Trigger onChange callback
      this.options.onChange(newValue, params);

      // Update ARIA
      this.updateAriaAttributes(target, target.checked, params);
    };

    checkbox.addEventListener('change', handler);
    this.eventHandlers.set(element, handler);

    // Set initial state via update()
    this.update(element, params);
  }

  /**
   * Update existing checkbox - called on value/state changes
   * Optimized for performance during scrolling
   */
  update(element: HTMLElement, params: RenderParams): void {
    const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
    if (!checkbox) return;

    // Determine checked state
    const isChecked = this.isValueChecked(params.value);
    const isIndeterminate = this.options.indeterminate && params.value === null;

    // Update checkbox state only if changed
    if (checkbox.checked !== isChecked) {
      checkbox.checked = isChecked;
    }
    if (checkbox.indeterminate !== isIndeterminate) {
      checkbox.indeterminate = isIndeterminate;
    }
    if (checkbox.disabled !== this.options.disabled) {
      checkbox.disabled = this.options.disabled;
    }

    // Update ARIA attributes
    this.updateAriaAttributes(checkbox, isChecked, params);
  }

  /**
   * Cleanup before element returns to pool
   */
  destroy(element: HTMLElement): void {
    // Remove event listener
    const handler = this.eventHandlers.get(element);
    if (handler) {
      const checkbox = element.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.removeEventListener('change', handler);
      }
      this.eventHandlers.delete(element);
    }

    // Clear content and remove classes
    element.innerHTML = '';
    element.classList.remove('zg-cell-checkbox-container');
  }

  /**
   * Optional: Return CSS class based on checked state
   */
  getCellClass(params: RenderParams): string | undefined {
    if (this.isValueChecked(params.value)) {
      return 'zg-cell-checkbox-checked';
    }
    return undefined;
  }

  /**
   * Check if a value is considered "checked"
   */
  private isValueChecked(value: any): boolean {
    return value === this.options.checkedValue;
  }

  /**
   * Update ARIA attributes for accessibility
   */
  private updateAriaAttributes(
    checkbox: HTMLInputElement,
    isChecked: boolean,
    params: RenderParams
  ): void {
    checkbox.setAttribute('role', 'checkbox');

    // Handle tri-state
    if (this.options.indeterminate && params.value === null) {
      checkbox.setAttribute('aria-checked', 'mixed');
    } else {
      checkbox.setAttribute('aria-checked', String(isChecked));
    }

    // Add label for screen readers
    const fieldName = params.column?.field || 'checkbox';
    const label = `${fieldName} for row ${params.cell.row}`;
    checkbox.setAttribute('aria-label', label);

    // Disabled state
    if (this.options.disabled) {
      checkbox.setAttribute('aria-disabled', 'true');
    } else {
      checkbox.removeAttribute('aria-disabled');
    }
  }
}

/**
 * Factory function to create CheckboxRenderer
 *
 * @example
 * ```typescript
 * // In column definition
 * const column = {
 *   field: 'selected',
 *   header: 'Select',
 *   renderer: 'checkbox', // Registered name
 * };
 *
 * // Or create directly
 * const renderer = createCheckboxRenderer({
 *   onChange: (value, params) => updateSelection(params.cell.row, value)
 * });
 * ```
 */
export function createCheckboxRenderer(
  options: CheckboxRendererOptions = {}
): CheckboxRenderer {
  return new CheckboxRenderer(options);
}
