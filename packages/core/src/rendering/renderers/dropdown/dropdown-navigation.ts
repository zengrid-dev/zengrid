/**
 * Handles keyboard navigation for dropdown
 */
export class DropdownNavigation {
  /**
   * Handles keyboard navigation
   */
  handleKeyboardNavigation(
    e: KeyboardEvent,
    menu: HTMLElement,
    container: HTMLElement,
    onOpen: () => void,
    onClose: () => void
  ): void {
    const isOpen = menu.style.display !== 'none';

    switch (e.key) {
      case 'Enter':
      case ' ':
        if (!isOpen) {
          e.preventDefault();
          onOpen();
        }
        break;

      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          onClose();
          const trigger = container.querySelector('.zg-dropdown-trigger') as HTMLElement;
          if (trigger) {
            trigger.focus();
          }
        }
        break;

      case 'ArrowDown':
      case 'ArrowUp':
        if (isOpen) {
          e.preventDefault();
          this.navigateOptions(e.key === 'ArrowDown' ? 1 : -1, menu);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          onOpen();
        }
        break;

      case 'Home':
        if (isOpen) {
          e.preventDefault();
          this.navigateToFirstOption(menu);
        }
        break;

      case 'End':
        if (isOpen) {
          e.preventDefault();
          this.navigateToLastOption(menu);
        }
        break;
    }
  }

  /**
   * Navigates through options with arrow keys
   */
  private navigateOptions(direction: number, menu: HTMLElement): void {
    const options = this.getVisibleOptions(menu);
    if (options.length === 0) return;

    const focusedIndex = options.findIndex((opt) => opt === document.activeElement);

    let newIndex: number;
    if (focusedIndex === -1) {
      newIndex = direction > 0 ? 0 : options.length - 1;
    } else {
      newIndex = focusedIndex + direction;
      if (newIndex < 0) newIndex = options.length - 1;
      if (newIndex >= options.length) newIndex = 0;
    }

    options[newIndex].focus();
  }

  /**
   * Navigates to first option
   */
  private navigateToFirstOption(menu: HTMLElement): void {
    const options = this.getVisibleOptions(menu);
    if (options.length > 0) {
      options[0].focus();
    }
  }

  /**
   * Navigates to last option
   */
  private navigateToLastOption(menu: HTMLElement): void {
    const options = this.getVisibleOptions(menu);
    if (options.length > 0) {
      options[options.length - 1].focus();
    }
  }

  /**
   * Gets all visible, non-disabled options
   */
  private getVisibleOptions(menu: HTMLElement): HTMLElement[] {
    const optionsList = menu.querySelector('.zg-dropdown-options');
    if (!optionsList) return [];

    return Array.from(optionsList.querySelectorAll('.zg-dropdown-option:not(.disabled)')).filter(
      (opt) => (opt as HTMLElement).style.display !== 'none'
    ) as HTMLElement[];
  }

  /**
   * Focuses search input if available
   */
  focusSearchInput(menu: HTMLElement): void {
    const searchInput = menu.querySelector('.zg-dropdown-search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }
}
