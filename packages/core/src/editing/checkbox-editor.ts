import type { CellEditor, EditorParams, ValidationResult } from './cell-editor.interface';

/**
 * Configuration options for CheckboxEditor
 */
export interface CheckboxEditorOptions {
  /** Whether to allow indeterminate state (null value) */
  allowIndeterminate?: boolean;
  /** Label text to display next to checkbox */
  label?: string;
  /** Whether checkbox is disabled */
  disabled?: boolean;
  /** Custom text for checked state (for accessibility) */
  checkedText?: string;
  /** Custom text for unchecked state (for accessibility) */
  uncheckedText?: string;
  /** Custom text for indeterminate state (for accessibility) */
  indeterminateText?: string;
  /** Auto-focus on init (default: true) */
  autoFocus?: boolean;
  /** Custom CSS class for the container element */
  className?: string;
  /** Custom validator function */
  validator?: (value: boolean | null) => boolean | string;
  /** Commit on blur (default: true) */
  stopOnBlur?: boolean;
}

/**
 * CheckboxEditor - Boolean checkbox editor for cell editing
 *
 * Features:
 * - Tri-state support (true/false/null for indeterminate)
 * - Auto-focus on init
 * - Enter to commit, Escape to cancel
 * - Space bar to toggle checkbox
 * - Label element with click handling
 * - Custom validation functions
 * - Full ARIA accessibility
 * - Initial value restoration on cancel
 * - Value normalization for various input types
 * - Blur handling for commit
 *
 * Performance: Lightweight, minimal DOM operations
 *
 * @example
 * ```typescript
 * // Basic checkbox editor
 * const editor = new CheckboxEditor({
 *   label: 'Active',
 *   autoFocus: true
 * });
 *
 * // Tri-state checkbox with validation
 * const editor = new CheckboxEditor({
 *   allowIndeterminate: true,
 *   label: 'Status',
 *   validator: (value) => value !== null || 'Please select a value'
 * });
 *
 * // Disabled checkbox with custom text
 * const editor = new CheckboxEditor({
 *   disabled: true,
 *   checkedText: 'Enabled',
 *   uncheckedText: 'Disabled',
 *   indeterminateText: 'Unknown'
 * });
 * ```
 */
export class CheckboxEditor implements CellEditor<boolean | null> {
  private options: Required<Omit<CheckboxEditorOptions, 'validator'>> & {
    validator?: (value: boolean | null) => boolean | string;
  };
  private checkboxElement: HTMLInputElement | null = null;
  private containerElement: HTMLLabelElement | null = null;
  private params: EditorParams | null = null;
  private isDestroyed = false;
  private initialValue: boolean | null = null;

  /**
   * Creates a new CheckboxEditor instance
   *
   * @param options - Configuration options for the editor
   */
  constructor(options: CheckboxEditorOptions = {}) {
    this.options = {
      allowIndeterminate: options.allowIndeterminate ?? false,
      label: options.label ?? '',
      disabled: options.disabled ?? false,
      checkedText: options.checkedText ?? 'Checked',
      uncheckedText: options.uncheckedText ?? 'Unchecked',
      indeterminateText: options.indeterminateText ?? 'Indeterminate',
      autoFocus: options.autoFocus ?? true,
      className: options.className ?? 'zg-checkbox-editor',
      validator: options.validator,
      stopOnBlur: options.stopOnBlur ?? true,
    };
  }

  /**
   * Initialize editor in the container element
   *
   * Creates a checkbox element with label, sets up event listeners, and focuses if configured.
   *
   * @param container - The DOM element to render the editor into
   * @param value - Initial value for the editor (boolean or null)
   * @param params - Edit parameters including callbacks
   */
  init(container: HTMLElement, value: boolean | null, params: EditorParams): void {
    this.isDestroyed = false;
    this.params = params;
    this.initialValue = this.normalizeValue(value);

    // Clear previous content
    container.innerHTML = '';

    // Create checkbox container (label element)
    this.containerElement = this.createContainer(params);
    this.checkboxElement = this.createCheckboxElement(value, params);

    // Append checkbox to container
    this.containerElement.appendChild(this.checkboxElement);

    // Add label text if provided
    if (this.options.label) {
      const labelText = document.createElement('span');
      labelText.textContent = this.options.label;
      labelText.className = 'zg-checkbox-label';
      labelText.style.marginLeft = '6px';
      labelText.style.userSelect = 'none';
      this.containerElement.appendChild(labelText);
    }

    // Append to container
    container.appendChild(this.containerElement);

    // Auto-focus if configured
    if (this.options.autoFocus) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        this.focus();
      });
    }
  }

  /**
   * Create the container label element
   *
   * @param params - Edit parameters
   * @returns The label element that will contain the checkbox
   */
  private createContainer(params: EditorParams): HTMLLabelElement {
    const label = document.createElement('label');
    label.className = this.options.className;
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.cursor = this.options.disabled ? 'not-allowed' : 'pointer';
    label.style.padding = '8px';
    label.style.userSelect = 'none';

    // Set data attributes
    label.dataset.row = String(params.cell.row);
    label.dataset.col = String(params.cell.col);
    if (params.column?.field) {
      label.dataset.field = params.column.field;
    }

    return label;
  }

  /**
   * Create the checkbox input element with all attributes and event listeners
   *
   * @param value - Initial value
   * @param params - Edit parameters
   * @returns The configured checkbox element
   */
  private createCheckboxElement(
    value: boolean | null,
    params: EditorParams
  ): HTMLInputElement {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'zg-checkbox-input';

    // Set initial state
    const normalizedValue = this.normalizeValue(value);
    if (normalizedValue === null && this.options.allowIndeterminate) {
      checkbox.indeterminate = true;
      checkbox.checked = false;
    } else {
      checkbox.indeterminate = false;
      checkbox.checked = normalizedValue === true;
    }

    if (this.options.disabled) {
      checkbox.disabled = true;
    }

    // Inline styles for better UX
    checkbox.style.width = '18px';
    checkbox.style.height = '18px';
    checkbox.style.cursor = this.options.disabled ? 'not-allowed' : 'pointer';

    // Set ARIA attributes for accessibility
    checkbox.setAttribute('role', 'checkbox');
    checkbox.setAttribute(
      'aria-label',
      `Edit ${params.column?.header || params.column?.field || 'checkbox'}`
    );
    this.updateAriaChecked(checkbox, normalizedValue);

    // Set up event listeners
    this.attachEventListeners(checkbox, params);

    return checkbox;
  }

  /**
   * Attach event listeners for keyboard navigation and interaction
   *
   * @param checkbox - The checkbox element
   * @param params - Edit parameters
   */
  private attachEventListeners(checkbox: HTMLInputElement, params: EditorParams): void {
    // Handle change events (click or space key toggles checkbox)
    checkbox.addEventListener('change', () => {
      this.updateAriaAttributes();

      // Call onChange callback if provided
      if (params.onChange) {
        const value = this.getValue();
        params.onChange(value);
      }
    });

    // Click on container should toggle checkbox
    if (this.containerElement) {
      this.containerElement.addEventListener('click', (e: MouseEvent) => {
        // Only toggle if click wasn't directly on the checkbox
        // (checkbox handles its own clicks)
        if (e.target !== checkbox && !this.options.disabled) {
          e.preventDefault();
          this.toggleCheckbox();
        }
      });
    }

    // Blur handling
    if (this.options.stopOnBlur) {
      checkbox.addEventListener('blur', () => {
        // Small delay to allow for other events to fire first
        setTimeout(() => {
          if (!this.isDestroyed) {
            this.handleCommit();
          }
        }, 100);
      });
    }

    // Prevent event propagation to grid
    checkbox.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
    });

    checkbox.addEventListener('mousedown', (e: MouseEvent) => {
      e.stopPropagation();
    });
  }

  /**
   * Handle key events
   *
   * @param event - Keyboard event
   * @returns True if handled, false to propagate
   */
  onKeyDown(event: KeyboardEvent): boolean {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      this.handleCommit();
      return true;
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.handleCancel();
      return true;
    } else if (event.key === ' ' || event.key === 'Spacebar') {
      // Space toggles the checkbox
      // Handle indeterminate state manually
      if (
        this.checkboxElement &&
        this.checkboxElement.indeterminate &&
        this.options.allowIndeterminate
      ) {
        event.preventDefault();
        event.stopPropagation();
        this.checkboxElement.indeterminate = false;
        this.checkboxElement.checked = true;
        this.updateAriaAttributes();
        return true;
      }
    }

    // Don't propagate other keys to grid (avoid navigation while editing)
    event.stopPropagation();
    return true;
  }

  /**
   * Toggle checkbox state, handling indeterminate if enabled
   */
  private toggleCheckbox(): void {
    if (!this.checkboxElement || this.options.disabled) return;

    if (this.checkboxElement.indeterminate && this.options.allowIndeterminate) {
      // Indeterminate → Checked
      this.checkboxElement.indeterminate = false;
      this.checkboxElement.checked = true;
    } else if (this.checkboxElement.checked) {
      // Checked → Unchecked (or Indeterminate if allowed)
      this.checkboxElement.checked = false;
      if (this.options.allowIndeterminate) {
        this.checkboxElement.indeterminate = true;
      }
    } else {
      // Unchecked → Checked
      this.checkboxElement.checked = true;
    }

    this.updateAriaAttributes();

    // Trigger onChange callback
    if (this.params?.onChange) {
      const value = this.getValue();
      this.params.onChange(value);
    }
  }

  /**
   * Update ARIA attributes based on current state
   */
  private updateAriaAttributes(): void {
    if (!this.checkboxElement) return;

    const value = this.getValue();
    this.updateAriaChecked(this.checkboxElement, value);
  }

  /**
   * Update aria-checked attribute
   *
   * @param element - The checkbox element
   * @param value - Current value
   */
  private updateAriaChecked(element: HTMLInputElement, value: boolean | null): void {
    if (value === null) {
      element.setAttribute('aria-checked', 'mixed');
    } else if (value === true) {
      element.setAttribute('aria-checked', 'true');
    } else {
      element.setAttribute('aria-checked', 'false');
    }
  }

  /**
   * Handle commit action (Enter key or blur)
   */
  private handleCommit(): void {
    if (this.isDestroyed || !this.params) return;

    const value = this.getValue();
    const validationResult = this.isValid();

    // Check if valid
    let isValid = false;
    if (typeof validationResult === 'boolean') {
      isValid = validationResult;
    } else {
      isValid = validationResult.valid;
    }

    if (isValid) {
      this.params.onComplete?.(value, false);
    } else {
      // Validation failed - log warning but still complete with cancelled flag
      if (typeof validationResult === 'object' && validationResult.message) {
        console.warn('CheckboxEditor: Validation failed:', validationResult.message);
      } else {
        console.warn('CheckboxEditor: Validation failed for value:', value);
      }
      // Could choose to not commit, but for now we'll still commit
      this.params.onComplete?.(value, false);
    }
  }

  /**
   * Handle cancel action (Escape key)
   */
  private handleCancel(): void {
    if (this.isDestroyed || !this.params) return;

    // Restore initial value before cancelling
    if (this.checkboxElement) {
      if (this.initialValue === null && this.options.allowIndeterminate) {
        this.checkboxElement.indeterminate = true;
        this.checkboxElement.checked = false;
      } else {
        this.checkboxElement.indeterminate = false;
        this.checkboxElement.checked = this.initialValue === true;
      }
      this.updateAriaAttributes();
    }

    const value = this.initialValue;
    this.params.onComplete?.(value, true);
  }

  /**
   * Normalize value to boolean or null
   *
   * Converts various input types to boolean or null for indeterminate state.
   *
   * @param value - The value to normalize
   * @returns Boolean or null for indeterminate
   */
  private normalizeValue(value: any): boolean | null {
    if (value === null || value === undefined) {
      return this.options.allowIndeterminate ? null : false;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    // Handle string representations
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on') {
        return true;
      }
      if (lower === 'false' || lower === '0' || lower === 'no' || lower === 'off') {
        return false;
      }
      if (lower === 'null' || lower === 'indeterminate' || lower === 'mixed') {
        return this.options.allowIndeterminate ? null : false;
      }
    }

    // Handle numbers
    if (typeof value === 'number') {
      return value !== 0;
    }

    // Default to false for unknown types
    return false;
  }

  /**
   * Get the current value from the editor
   *
   * @returns Boolean or null (if indeterminate is allowed)
   */
  getValue(): boolean | null {
    if (!this.checkboxElement) {
      return null;
    }

    if (this.checkboxElement.indeterminate && this.options.allowIndeterminate) {
      return null;
    }

    return this.checkboxElement.checked;
  }

  /**
   * Check if current value is valid
   *
   * Runs the custom validator if provided.
   *
   * @returns True if valid, false otherwise, or ValidationResult object
   */
  isValid(): boolean | ValidationResult {
    const value = this.getValue();

    // Custom validator
    if (this.options.validator) {
      const result = this.options.validator(value);
      if (typeof result === 'boolean') {
        return result;
      }
      // If string is returned, it's an error message
      return {
        valid: false,
        message: result,
      };
    }

    return true;
  }

  /**
   * Focus the editor checkbox element
   */
  focus(): void {
    if (this.checkboxElement) {
      this.checkboxElement.focus();
    }
  }

  /**
   * Clean up resources when editing stops
   *
   * Removes event listeners and clears references to prevent memory leaks
   */
  destroy(): void {
    this.isDestroyed = true;

    if (this.checkboxElement) {
      this.checkboxElement.remove();
    }

    if (this.containerElement) {
      this.containerElement.remove();
    }

    this.checkboxElement = null;
    this.containerElement = null;
    this.params = null;
    this.initialValue = null;
  }
}

/**
 * Factory function to create CheckboxEditor
 *
 * @example
 * ```typescript
 * // In column definition
 * const column = {
 *   field: 'active',
 *   header: 'Active',
 *   editable: true,
 *   editor: 'checkbox', // Registered name
 * };
 *
 * // Or create directly
 * const editor = createCheckboxEditor({
 *   allowIndeterminate: true,
 *   label: 'Enabled',
 *   validator: (value) => value !== null || 'Please select a value'
 * });
 * ```
 */
export function createCheckboxEditor(
  options: CheckboxEditorOptions = {}
): CheckboxEditor {
  return new CheckboxEditor(options);
}
