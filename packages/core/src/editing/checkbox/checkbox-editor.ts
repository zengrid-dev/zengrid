import type { CellEditor, EditorParams, ValidationResult } from '../cell-editor.interface';
import type { CheckboxEditorOptions, CheckboxEditorState } from './checkbox-types';
import { createContainer, createCheckboxElement, createLabelText } from './checkbox-dom';
import { CheckboxState } from './checkbox-state';
import { CheckboxEventManager } from './checkbox-events';

export type { CheckboxEditorOptions };

export class CheckboxEditor implements CellEditor<boolean | null> {
  private options: Required<Omit<CheckboxEditorOptions, 'validator'>> & {
    validator?: (value: boolean | null) => boolean | string;
  };
  private checkboxState: CheckboxState;
  private eventManager!: CheckboxEventManager;

  private state: CheckboxEditorState = {
    checkboxElement: null,
    containerElement: null,
    params: null,
    isDestroyed: false,
    initialValue: null,
  };

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
    this.checkboxState = new CheckboxState(this.options);
  }

  init(container: HTMLElement, value: boolean | null, params: EditorParams): void {
    this.state.isDestroyed = false;
    this.state.params = params;
    this.state.initialValue = this.checkboxState.normalizeValue(value);

    // Clear previous content
    container.innerHTML = '';

    // Create checkbox container (label element)
    this.state.containerElement = createContainer(params, this.options);
    this.state.checkboxElement = createCheckboxElement(
      value,
      params,
      this.options,
      this.checkboxState
    );

    // Append checkbox to container
    this.state.containerElement.appendChild(this.state.checkboxElement);

    // Add label text if provided
    if (this.options.label) {
      this.state.containerElement.appendChild(createLabelText(this.options.label));
    }

    // Append to container
    container.appendChild(this.state.containerElement);

    // Set up event handling
    this.eventManager = new CheckboxEventManager(this.state, this.checkboxState, this.options);
    this.eventManager.attachEventListeners(this.state.checkboxElement, params);

    // Auto-focus if configured
    if (this.options.autoFocus) {
      requestAnimationFrame(() => {
        this.focus();
      });
    }
  }

  onKeyDown(event: KeyboardEvent): boolean {
    return this.eventManager.onKeyDown(event);
  }

  getValue(): boolean | null {
    return this.checkboxState.getValue(this.state.checkboxElement);
  }

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

  focus(): void {
    if (this.state.checkboxElement) {
      this.state.checkboxElement.focus();
    }
  }

  destroy(): void {
    this.state.isDestroyed = true;

    if (this.state.checkboxElement) {
      this.state.checkboxElement.remove();
    }

    if (this.state.containerElement) {
      this.state.containerElement.remove();
    }

    this.state.checkboxElement = null;
    this.state.containerElement = null;
    this.state.params = null;
    this.state.initialValue = null;
  }
}

export function createCheckboxEditor(options: CheckboxEditorOptions = {}): CheckboxEditor {
  return new CheckboxEditor(options);
}
