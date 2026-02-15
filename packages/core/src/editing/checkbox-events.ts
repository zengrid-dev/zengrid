import type { EditorParams } from './cell-editor.interface';
import type { CheckboxEditorOptions, CheckboxEditorState } from './checkbox-types';
import { CheckboxState } from './checkbox-state';

/**
 * Manages event handling for checkbox editor
 */
export class CheckboxEventManager {
  constructor(
    private state: CheckboxEditorState,
    private checkboxState: CheckboxState,
    private options: Required<Omit<CheckboxEditorOptions, 'validator'>> & {
      validator?: (value: boolean | null) => boolean | string;
    }
  ) {}

  /**
   * Attach event listeners for keyboard navigation and interaction
   *
   * @param checkbox - The checkbox element
   * @param params - Edit parameters
   */
  attachEventListeners(checkbox: HTMLInputElement, params: EditorParams): void {
    // Handle change events (click or space key toggles checkbox)
    checkbox.addEventListener('change', () => {
      this.updateAriaAttributes();

      // Call onChange callback if provided
      if (params.onChange) {
        const value = this.checkboxState.getValue(this.state.checkboxElement);
        params.onChange(value);
      }
    });

    // Click on container should toggle checkbox
    if (this.state.containerElement) {
      this.state.containerElement.addEventListener('click', (e: MouseEvent) => {
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
          if (!this.state.isDestroyed) {
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
   * Toggle checkbox state, handling indeterminate if enabled
   */
  toggleCheckbox(): void {
    if (!this.state.checkboxElement || this.options.disabled) return;

    if (this.state.checkboxElement.indeterminate && this.options.allowIndeterminate) {
      // Indeterminate → Checked
      this.state.checkboxElement.indeterminate = false;
      this.state.checkboxElement.checked = true;
    } else if (this.state.checkboxElement.checked) {
      // Checked → Unchecked (or Indeterminate if allowed)
      this.state.checkboxElement.checked = false;
      if (this.options.allowIndeterminate) {
        this.state.checkboxElement.indeterminate = true;
      }
    } else {
      // Unchecked → Checked
      this.state.checkboxElement.checked = true;
    }

    this.updateAriaAttributes();

    // Trigger onChange callback
    if (this.state.params?.onChange) {
      const value = this.checkboxState.getValue(this.state.checkboxElement);
      this.state.params.onChange(value);
    }
  }

  /**
   * Update ARIA attributes based on current state
   */
  updateAriaAttributes(): void {
    if (!this.state.checkboxElement) return;

    const value = this.checkboxState.getValue(this.state.checkboxElement);
    this.checkboxState.updateAriaChecked(this.state.checkboxElement, value);
  }

  /**
   * Handle commit action (Enter key or blur)
   */
  handleCommit(): void {
    if (this.state.isDestroyed || !this.state.params) return;

    const value = this.checkboxState.getValue(this.state.checkboxElement);
    const validationResult = this.isValid(value);

    // Check if valid
    let isValid = false;
    if (typeof validationResult === 'boolean') {
      isValid = validationResult;
    } else {
      isValid = validationResult.valid;
    }

    if (isValid) {
      this.state.params.onComplete?.(value, false);
    } else {
      // Validation failed - log warning but still complete with cancelled flag
      if (typeof validationResult === 'object' && validationResult.message) {
        console.warn('CheckboxEditor: Validation failed:', validationResult.message);
      } else {
        console.warn('CheckboxEditor: Validation failed for value:', value);
      }
      // Could choose to not commit, but for now we'll still commit
      this.state.params.onComplete?.(value, false);
    }
  }

  /**
   * Handle cancel action (Escape key)
   */
  handleCancel(): void {
    if (this.state.isDestroyed || !this.state.params) return;

    // Restore initial value before cancelling
    if (this.state.checkboxElement) {
      if (this.state.initialValue === null && this.options.allowIndeterminate) {
        this.state.checkboxElement.indeterminate = true;
        this.state.checkboxElement.checked = false;
      } else {
        this.state.checkboxElement.indeterminate = false;
        this.state.checkboxElement.checked = this.state.initialValue === true;
      }
      this.updateAriaAttributes();
    }

    const value = this.state.initialValue;
    this.state.params.onComplete?.(value, true);
  }

  /**
   * Check if current value is valid
   *
   * Runs the custom validator if provided.
   *
   * @param value - Value to validate
   * @returns True if valid, false otherwise, or ValidationResult object
   */
  private isValid(value: boolean | null): boolean | { valid: boolean; message?: string } {
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
        this.state.checkboxElement &&
        this.state.checkboxElement.indeterminate &&
        this.options.allowIndeterminate
      ) {
        event.preventDefault();
        event.stopPropagation();
        this.state.checkboxElement.indeterminate = false;
        this.state.checkboxElement.checked = true;
        this.updateAriaAttributes();
        return true;
      }
    }

    // Don't propagate other keys to grid (avoid navigation while editing)
    event.stopPropagation();
    return true;
  }
}
