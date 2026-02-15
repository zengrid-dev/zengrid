/**
 * Event handling for DropdownEditor
 */

export interface EventHandlers {
  handleSearch: () => void;
  handleFocus: () => void;
  handleBlur: (e: Event) => void;
  handleDisplayClick: (e: Event) => void;
  handleDocumentClick: (e: Event) => void;
  stopPropagation: (e: Event) => void;
}

/**
 * Create event handlers for dropdown editor
 */
export function createEventHandlers(
  searchInput: HTMLInputElement | null,
  dropdownMenu: HTMLElement | null,
  container: HTMLElement | null,
  isDestroyed: () => boolean,
  stopOnBlur: boolean,
  onOpen: () => void,
  onClose: () => void,
  onCommit: () => void,
  onRenderFiltered: (searchTerm: string) => void
): EventHandlers {
  const handleSearch = (): void => {
    const searchTerm = searchInput?.value || '';
    onRenderFiltered(searchTerm);
    onOpen();
  };

  const handleFocus = (): void => {
    onOpen();
  };

  const handleBlur = (_e: Event): void => {
    setTimeout(() => {
      if (isDestroyed()) {
        return;
      }

      const activeElement = document.activeElement;
      if (dropdownMenu && dropdownMenu.contains(activeElement)) {
        return;
      }

      onClose();

      if (stopOnBlur) {
        onCommit();
      }
    }, 200);
  };

  const handleDisplayClick = (e: Event): void => {
    e.stopPropagation();
    // Toggle handled by caller
  };

  const handleDocumentClick = (e: Event): void => {
    if (container && !container.contains(e.target as Node)) {
      onClose();
    }
  };

  const stopPropagation = (e: Event): void => {
    e.stopPropagation();
  };

  return {
    handleSearch,
    handleFocus,
    handleBlur,
    handleDisplayClick,
    handleDocumentClick,
    stopPropagation,
  };
}

/**
 * Setup event listeners
 */
export function setupEventListeners(
  searchInput: HTMLInputElement | null,
  container: HTMLElement | null,
  className: string,
  handlers: EventHandlers
): void {
  if (searchInput) {
    searchInput.addEventListener('input', handlers.handleSearch);
    searchInput.addEventListener('focus', handlers.handleFocus);
    searchInput.addEventListener('blur', handlers.handleBlur);
    searchInput.addEventListener('click', handlers.stopPropagation);
    searchInput.addEventListener('mousedown', handlers.stopPropagation);
  } else if (container) {
    const display = container.querySelector(`.${className}-display`);
    if (display) {
      display.addEventListener('click', handlers.handleDisplayClick);
      display.addEventListener('blur', handlers.handleBlur);
    }
  }

  document.addEventListener('click', handlers.handleDocumentClick);
}

/**
 * Remove event listeners
 */
export function removeEventListeners(
  searchInput: HTMLInputElement | null,
  container: HTMLElement | null,
  className: string,
  handlers: EventHandlers
): void {
  if (searchInput) {
    searchInput.removeEventListener('input', handlers.handleSearch);
    searchInput.removeEventListener('focus', handlers.handleFocus);
    searchInput.removeEventListener('blur', handlers.handleBlur);
    searchInput.removeEventListener('click', handlers.stopPropagation);
    searchInput.removeEventListener('mousedown', handlers.stopPropagation);
  } else if (container) {
    const display = container.querySelector(`.${className}-display`);
    if (display) {
      display.removeEventListener('click', handlers.handleDisplayClick);
      display.removeEventListener('blur', handlers.handleBlur);
    }
  }

  document.removeEventListener('click', handlers.handleDocumentClick);
}
