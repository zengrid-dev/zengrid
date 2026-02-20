import type { EditorParams } from '../cell-editor.interface';

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
 * Internal state for checkbox editor
 */
export interface CheckboxEditorState {
  checkboxElement: HTMLInputElement | null;
  containerElement: HTMLLabelElement | null;
  params: EditorParams | null;
  isDestroyed: boolean;
  initialValue: boolean | null;
}
