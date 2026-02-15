import type { DropdownOption } from './types';

/**
 * Open dropdown menu
 */
export function openDropdown(
  dropdownMenu: HTMLElement | null,
  container: HTMLElement | null,
  onOpen?: () => void
): void {
  if (!dropdownMenu) return;

  dropdownMenu.style.display = 'block';
  if (container) {
    container.setAttribute('aria-expanded', 'true');
  }

  if (onOpen) {
    onOpen();
  }
}

/**
 * Close dropdown menu
 */
export function closeDropdown(
  dropdownMenu: HTMLElement | null,
  container: HTMLElement | null,
  onClose?: () => void
): void {
  if (!dropdownMenu) return;

  dropdownMenu.style.display = 'none';
  if (container) {
    container.setAttribute('aria-expanded', 'false');
  }

  if (onClose) {
    onClose();
  }
}

/**
 * Highlight next option in dropdown
 */
export function highlightNext(
  currentIndex: number,
  filteredOptionsLength: number
): number {
  if (filteredOptionsLength === 0) {
    return -1;
  }

  let newIndex = currentIndex + 1;
  if (newIndex >= filteredOptionsLength) {
    newIndex = 0;
  }
  return newIndex;
}

/**
 * Highlight previous option in dropdown
 */
export function highlightPrevious(
  currentIndex: number,
  filteredOptionsLength: number
): number {
  if (filteredOptionsLength === 0) {
    return -1;
  }

  let newIndex = currentIndex - 1;
  if (newIndex < 0) {
    newIndex = filteredOptionsLength - 1;
  }
  return newIndex;
}

/**
 * Scroll to highlighted option
 */
export function scrollToHighlighted(
  dropdownMenu: HTMLElement | null,
  highlightedIndex: number
): void {
  if (!dropdownMenu || highlightedIndex < 0) return;

  const options = dropdownMenu.querySelectorAll('[role="option"]');
  const highlighted = options[highlightedIndex] as HTMLElement;

  if (highlighted) {
    const menuRect = dropdownMenu.getBoundingClientRect();
    const optionRect = highlighted.getBoundingClientRect();

    if (optionRect.bottom > menuRect.bottom) {
      dropdownMenu.scrollTop += optionRect.bottom - menuRect.bottom;
    } else if (optionRect.top < menuRect.top) {
      dropdownMenu.scrollTop -= menuRect.top - optionRect.top;
    }
  }
}

/**
 * Select an option
 */
export function selectOption(
  option: DropdownOption,
  selectedValues: Set<any>,
  multiSelect: boolean
): Set<any> {
  const newSelected = new Set(selectedValues);

  if (multiSelect) {
    if (newSelected.has(option.value)) {
      newSelected.delete(option.value);
    } else {
      newSelected.add(option.value);
    }
  } else {
    newSelected.clear();
    newSelected.add(option.value);
  }

  return newSelected;
}
