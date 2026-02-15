import type { EditorParams, ValidationResult } from './cell-editor.interface';
import { formatDateForInput } from './date-editor-formatting';

/**
 * Attach blur event listener for commit on blur
 *
 * @param input - The input element
 * @param onCommit - Commit callback
 * @param getIsDestroyed - Function to check if editor is destroyed
 */
export function attachBlurHandler(
  input: HTMLInputElement,
  onCommit: () => void,
  getIsDestroyed: () => boolean
): void {
  input.addEventListener('blur', () => {
    // Small delay to allow for other click events to fire first
    setTimeout(() => {
      if (!getIsDestroyed()) {
        onCommit();
      }
    }, 100);
  });
}

/**
 * Handle key events
 *
 * @param event - Keyboard event
 * @param onCommit - Commit callback
 * @param onCancel - Cancel callback
 * @returns True if handled, false to propagate
 */
export function handleKeyDown(
  event: KeyboardEvent,
  onCommit: () => void,
  onCancel: () => void
): boolean {
  if (event.key === 'Enter') {
    event.preventDefault();
    event.stopPropagation();
    onCommit();
    return true;
  } else if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    onCancel();
    return true;
  }

  // Don't propagate other keys to grid (avoid navigation while editing)
  event.stopPropagation();
  return true;
}

/**
 * Handle commit action (Enter key or blur)
 *
 * @param value - Current value
 * @param validationResult - Validation result
 * @param params - Edit parameters
 */
export function handleCommit(
  value: Date | null,
  validationResult: boolean | ValidationResult,
  params: EditorParams
): void {
  // Check if valid
  let isValid = false;
  if (typeof validationResult === 'boolean') {
    isValid = validationResult;
  } else {
    isValid = validationResult.valid;
  }

  if (isValid) {
    params.onComplete?.(value, false);
  } else {
    // Validation failed - log warning but still complete with cancelled flag
    if (typeof validationResult === 'object' && validationResult.message) {
      console.warn('DateEditor: Validation failed:', validationResult.message);
    } else {
      console.warn('DateEditor: Validation failed for value:', value);
    }
    // Could choose to not commit, but for now we'll still commit
    params.onComplete?.(value, false);
  }
}

/**
 * Handle cancel action (Escape key)
 *
 * @param inputElement - Input element
 * @param initialValue - Initial value to restore
 * @param inputType - Input type (date, datetime-local, time)
 * @param params - Edit parameters
 */
export function handleCancel(
  inputElement: HTMLInputElement | null,
  initialValue: Date | null,
  inputType: 'date' | 'datetime-local' | 'time',
  params: EditorParams
): void {
  // Restore initial value before cancelling
  if (inputElement && initialValue) {
    inputElement.value = formatDateForInput(initialValue, inputType);
  } else if (inputElement) {
    inputElement.value = '';
  }

  params.onComplete?.(initialValue, true);
}
