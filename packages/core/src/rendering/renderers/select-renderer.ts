import type { CellRenderer, RenderParams } from './renderer.interface';
import { deepEqual } from './renderer-utils';

/**
 * Option definition for SelectRenderer
 */
export interface SelectOption {
  /** Display label for the option */
  label: string;
  /** Value for the option */
  value: any;
  /** Whether this option is disabled */
  disabled?: boolean;
  /** Optional group for categorization */
  group?: string;
}

/**
 * Configuration options for SelectRenderer
 */
export interface SelectRendererOptions {
  /** Array of select options (default: empty array with warning) */
  options?: SelectOption[];
  /** Placeholder text when no value is selected */
  placeholder?: string;
  /** Callback when value changes */
  onChange?: (value: any, params: RenderParams) => void;
  /** Custom CSS class for the select element */
  className?: string;
  /** Allow multiple selections */
  multiple?: boolean;
  /** Size attribute for select (number of visible options) */
  size?: number;
}

/**
 * SelectRenderer - Renders a native HTML select element for choosing from options
 *
 * Features:
 * - Native <select> HTML element (better mobile support)
 * - Single and multi-select modes
 * - Option grouping with <optgroup>
 * - Deep value comparison for complex option values
 * - Simpler alternative to DropdownRenderer
 * - Full ARIA attributes for accessibility
 * - Lightweight and performant
 * - Optimized update() method for virtual scrolling
 *
 * Use SelectRenderer when:
 * - You want native browser behavior
 * - Mobile support is important
 * - You don't need custom styling or search
 * - Simplicity is preferred over customization
 *
 * Use DropdownRenderer when:
 * - You need searchable/filterable options
 * - Custom styling is required
 * - You need custom option rendering
 * - Desktop-first experience
 *
 * @example
 * ```typescript
 * // Simple select with static options
 * const renderer = new SelectRenderer({
 *   options: [
 *     { label: 'Active', value: 'active' },
 *     { label: 'Inactive', value: 'inactive' },
 *     { label: 'Pending', value: 'pending' }
 *   ],
 *   onChange: (value, params) => {
 *     console.log('Status changed to:', value);
 *   }
 * });
 *
 * // Multi-select with grouping
 * const renderer = new SelectRenderer({
 *   options: [
 *     { label: 'Red', value: 'red', group: 'Colors' },
 *     { label: 'Green', value: 'green', group: 'Colors' },
 *     { label: 'Circle', value: 'circle', group: 'Shapes' },
 *     { label: 'Square', value: 'square', group: 'Shapes' }
 *   ],
 *   multiple: true,
 *   size: 6
 * });
 * ```
 */
export class SelectRenderer implements CellRenderer {
  private options: Required<Omit<SelectRendererOptions, 'placeholder' | 'onChange'>> & {
    placeholder?: string;
    onChange?: (value: any, params: RenderParams) => void;
  };
  private eventHandlers: Map<HTMLElement, (e: Event) => void>;

  /**
   * Creates a new SelectRenderer instance
   */
  constructor(options: SelectRendererOptions = {}) {
    // Warn if no options provided (but not for default registry instances)
    const hasConfig = options.placeholder || options.onChange;
    if (hasConfig && (!options.options || options.options.length === 0)) {
      console.warn(
        'SelectRenderer: No options provided. Please provide options array in column definition.'
      );
    }

    this.options = {
      options: options.options ?? [],
      placeholder: options.placeholder,
      onChange: options.onChange,
      className: options.className ?? 'zg-select',
      multiple: options.multiple ?? false,
      size: options.size ?? (options.multiple ? 4 : 1),
    };

    this.eventHandlers = new Map();
  }

  /**
   * Initial render - creates select structure
   */
  render(element: HTMLElement, params: RenderParams): void {
    element.classList.add('zg-cell-select');

    // Create select element
    const select = document.createElement('select');
    select.className = this.options.className;

    // Set attributes
    if (this.options.multiple) {
      select.multiple = true;
      select.size = this.options.size;
    }

    element.appendChild(select);

    // Add change event handler
    if (this.options.onChange) {
      const handler = (e: Event) => {
        e.stopPropagation();
        const target = e.target as HTMLSelectElement;
        let newValue: any;

        if (this.options.multiple) {
          // Multi-select: collect all selected values
          const selectedOptions = Array.from(target.selectedOptions);
          newValue = selectedOptions
            .filter(opt => opt.value !== '')
            .map(opt => JSON.parse(opt.value));
        } else {
          // Single select: get single value
          const selectedOption = target.selectedOptions[0];
          if (selectedOption && selectedOption.value !== '') {
            newValue = JSON.parse(selectedOption.value);
          } else {
            newValue = null;
          }
        }

        // Trigger onChange callback
        this.options.onChange!(newValue, params);
      };

      select.addEventListener('change', handler);
      this.eventHandlers.set(element, handler);
    }

    // Set initial state via update()
    this.update(element, params);
  }

  /**
   * Update existing select - called on value/state changes
   * Optimized for performance during scrolling
   */
  update(element: HTMLElement, params: RenderParams): void {
    const select = element.querySelector('select');
    if (!select) return;

    // Clear existing options
    select.innerHTML = '';

    // Add placeholder option if not multi-select
    if (!this.options.multiple && this.options.placeholder) {
      const placeholderOption = document.createElement('option');
      placeholderOption.value = '';
      placeholderOption.textContent = this.options.placeholder;
      placeholderOption.disabled = true;
      placeholderOption.selected = params.value === null || params.value === undefined;
      select.appendChild(placeholderOption);
    }

    // Group options by group property
    const groupedOptions = this.groupOptions(this.options.options);

    for (const [groupName, options] of Object.entries(groupedOptions)) {
      if (groupName !== '__default__') {
        // Create optgroup for grouped options
        const optgroup = document.createElement('optgroup');
        optgroup.label = groupName;

        for (const option of options) {
          const optionElement = this.createOptionElement(option, params.value);
          optgroup.appendChild(optionElement);
        }

        select.appendChild(optgroup);
      } else {
        // Add ungrouped options directly
        for (const option of options) {
          const optionElement = this.createOptionElement(option, params.value);
          select.appendChild(optionElement);
        }
      }
    }

    // Update data attributes
    select.dataset.row = String(params.cell.row);
    select.dataset.col = String(params.cell.col);
    if (params.column?.field) {
      select.dataset.field = params.column.field;
    }

    // Update ARIA attributes
    this.setAriaAttributes(select, params);
  }

  /**
   * Cleanup before element returns to pool
   */
  destroy(element: HTMLElement): void {
    // Remove event listener
    const handler = this.eventHandlers.get(element);
    if (handler) {
      const select = element.querySelector('select');
      if (select) {
        select.removeEventListener('change', handler);
      }
      this.eventHandlers.delete(element);
    }

    // Clear content and remove classes
    element.innerHTML = '';
    element.classList.remove('zg-cell-select');
  }

  /**
   * Optional: Return CSS class based on selection state
   */
  getCellClass(params: RenderParams): string | undefined {
    if (params.value === null || params.value === undefined) {
      return 'zg-select-empty';
    }

    if (this.options.multiple && Array.isArray(params.value)) {
      if (params.value.length === 0) {
        return 'zg-select-empty';
      }
      if (params.value.length > 1) {
        return 'zg-select-multiple';
      }
    }

    return 'zg-select-has-value';
  }

  /**
   * Create a single option element
   */
  private createOptionElement(option: SelectOption, currentValue: any): HTMLOptionElement {
    const optionEl = document.createElement('option');
    optionEl.value = JSON.stringify(option.value);
    optionEl.textContent = option.label;

    if (option.disabled) {
      optionEl.disabled = true;
    }

    // Set selected state
    const isSelected = this.isValueSelected(option.value, currentValue);
    if (isSelected) {
      optionEl.selected = true;
    }

    return optionEl;
  }

  /**
   * Check if a value is selected
   */
  private isValueSelected(optionValue: any, currentValue: any): boolean {
    if (this.options.multiple && Array.isArray(currentValue)) {
      return currentValue.some(v => deepEqual(v, optionValue));
    }

    return deepEqual(optionValue, currentValue);
  }

  /**
   * Group options by their group property
   */
  private groupOptions(options: SelectOption[]): Record<string, SelectOption[]> {
    const grouped: Record<string, SelectOption[]> = {};

    for (const option of options) {
      const groupName = option.group || '__default__';
      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(option);
    }

    return grouped;
  }

  /**
   * Set ARIA attributes for accessibility
   */
  private setAriaAttributes(select: HTMLSelectElement, params: RenderParams): void {
    const fieldLabel = params.column?.header || params.column?.field || 'Select';
    select.setAttribute('aria-label', `${fieldLabel} select`);

    if (this.options.multiple) {
      select.setAttribute('aria-multiselectable', 'true');
    }
  }
}

/**
 * Factory function to create SelectRenderer
 *
 * @example
 * ```typescript
 * // In column definition
 * const column = {
 *   field: 'status',
 *   header: 'Status',
 *   renderer: 'select', // Registered name
 * };
 *
 * // Or create directly
 * const renderer = createSelectRenderer({
 *   options: [
 *     { label: 'Active', value: 'active' },
 *     { label: 'Inactive', value: 'inactive' },
 *     { label: 'Pending', value: 'pending' }
 *   ],
 *   onChange: (value) => console.log('Status changed to:', value)
 * });
 * ```
 */
export function createSelectRenderer(
  options: SelectRendererOptions
): SelectRenderer {
  return new SelectRenderer(options);
}
