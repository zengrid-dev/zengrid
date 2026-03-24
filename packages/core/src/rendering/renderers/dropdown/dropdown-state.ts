import type { DropdownOption } from './dropdown-types';
import { deepEqual, SimpleLRUCache } from '../renderer-utils';

/**
 * Global set to track all open dropdowns across all instances (singleton pattern)
 */
export const globalOpenDropdowns = new Set<HTMLElement>();

/**
 * Tracks the live menu element for each dropdown container. Menus stay body-portaled
 * for their whole lifetime so DOM ownership does not change between open/close.
 */
export const globalOpenDropdownMenus = new WeakMap<HTMLElement, HTMLElement>();

/**
 * Manages dropdown state and selection
 */
export class DropdownState {
  private filteredOptionsCache: SimpleLRUCache<string, DropdownOption[]>;

  constructor() {
    this.filteredOptionsCache = new SimpleLRUCache<string, DropdownOption[]>(200);
  }

  /**
   * Normalizes value to array format
   */
  normalizeValue(value: any): any[] {
    if (value === null || value === undefined) {
      return [];
    }
    return Array.isArray(value) ? value : [value];
  }

  /**
   * Gets option label for a value
   */
  getOptionLabel(value: any, options: DropdownOption[]): string {
    const option = options.find((opt) => deepEqual(opt.value, value));
    return option ? option.label : String(value);
  }

  /**
   * Gets display text for the current value(s)
   */
  getDisplayText(
    value: any,
    options: DropdownOption[],
    multiSelect: boolean,
    multiSelectDisplay: 'tags' | 'count' | 'list',
    placeholder: string
  ): string {
    if (value === null || value === undefined) {
      return placeholder;
    }

    const values = this.normalizeValue(value);

    if (values.length === 0) {
      return placeholder;
    }

    if (multiSelect) {
      if (multiSelectDisplay === 'count') {
        return `${values.length} selected`;
      } else if (multiSelectDisplay === 'list') {
        const labels = values.map((v) => this.getOptionLabel(v, options));
        return labels.join(', ');
      } else {
        return `${values.length} selected`;
      }
    } else {
      return this.getOptionLabel(values[0], options);
    }
  }

  /**
   * Filters options based on search query
   */
  filterOptions(
    query: string,
    options: DropdownOption[],
    caseSensitive: boolean
  ): DropdownOption[] {
    const cacheKey = `${query}_${caseSensitive}`;
    let filteredOptions = this.filteredOptionsCache.get(cacheKey);

    if (!filteredOptions) {
      const normalizedQuery = caseSensitive ? query : query.toLowerCase();

      filteredOptions = options.filter((option) => {
        const normalizedLabel = caseSensitive ? option.label : option.label.toLowerCase();
        return normalizedLabel.includes(normalizedQuery);
      });

      this.filteredOptionsCache.set(cacheKey, filteredOptions);
    }

    return filteredOptions;
  }

  /**
   * Updates selected states in the menu
   */
  updateSelectedStates(menu: HTMLElement, selectedValues: any[]): void {
    const optionsList = menu.querySelector('.zg-dropdown-options');
    if (!optionsList) return;

    optionsList.querySelectorAll('.zg-dropdown-option').forEach((optionEl) => {
      const valueStr = (optionEl as HTMLElement).dataset['value'];
      if (valueStr) {
        const value = JSON.parse(valueStr);
        const isSelected = selectedValues.some((v) => deepEqual(v, value));

        if (isSelected) {
          optionEl.classList.add('selected');
          optionEl.setAttribute('aria-selected', 'true');
          (optionEl as HTMLElement).style.backgroundColor = '#e3f2fd';
        } else {
          optionEl.classList.remove('selected');
          optionEl.setAttribute('aria-selected', 'false');
          (optionEl as HTMLElement).style.backgroundColor = '#fff';
        }
      }
    });
  }

  /**
   * Applies filter to options list in the DOM
   */
  applyFilterToMenu(menu: HTMLElement, filteredOptions: DropdownOption[]): void {
    const optionsList = menu.querySelector('.zg-dropdown-options') as HTMLElement;
    if (!optionsList) return;

    const optionElements = optionsList.querySelectorAll('.zg-dropdown-option');
    optionElements.forEach((optionEl) => {
      const valueStr = (optionEl as HTMLElement).dataset['value'];
      if (valueStr) {
        const value = JSON.parse(valueStr);
        const isVisible = filteredOptions.some((opt) => deepEqual(opt.value, value));
        (optionEl as HTMLElement).style.display = isVisible ? '' : 'none';
      }
    });

    this.updateGroupHeadersVisibility(optionsList);
  }

  /**
   * Updates group headers visibility based on visible options
   */
  private updateGroupHeadersVisibility(optionsList: HTMLElement): void {
    const groupHeaders = optionsList.querySelectorAll('.zg-dropdown-group-header');
    groupHeaders.forEach((header) => {
      const nextOptions: HTMLElement[] = [];
      let sibling = header.nextElementSibling;

      while (sibling && !sibling.classList.contains('zg-dropdown-group-header')) {
        if (sibling.classList.contains('zg-dropdown-option')) {
          nextOptions.push(sibling as HTMLElement);
        }
        sibling = sibling.nextElementSibling;
      }

      const hasVisibleOptions = nextOptions.some((opt) => opt.style.display !== 'none');
      (header as HTMLElement).style.display = hasVisibleOptions ? '' : 'none';
    });
  }

  /**
   * Registers a dropdown menu and keeps it portaled to document.body for its full lifetime.
   */
  registerMenu(menu: HTMLElement, container: HTMLElement): void {
    if (menu.parentElement !== document.body) {
      document.body.appendChild(menu);
    }

    globalOpenDropdownMenus.set(container, menu);
    menu.style.display = 'none';
  }

  /**
   * Opens dropdown menu
   */
  openDropdown(menu: HTMLElement, container: HTMLElement): void {
    this.closeOtherDropdowns(container);

    // Append menu to body to escape overflow:hidden on grid cells
    if (menu.parentElement !== document.body) {
      document.body.appendChild(menu);
    }

    menu.style.display = 'block';
    container.classList.add('open');
    globalOpenDropdowns.add(container);
    globalOpenDropdownMenus.set(container, menu);

    // Position menu below the trigger
    const trigger = container.querySelector('.zg-dropdown-trigger') as HTMLElement;
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'true');
      const rect = trigger.getBoundingClientRect();
      menu.style.position = 'fixed';
      menu.style.left = `${rect.left}px`;
      menu.style.top = `${rect.bottom + 2}px`;
      menu.style.minWidth = `${rect.width}px`;

      // If menu would overflow below viewport, open above
      const menuRect = menu.getBoundingClientRect();
      if (menuRect.bottom > window.innerHeight) {
        menu.style.top = `${rect.top - menuRect.height - 2}px`;
      }
    }
  }

  /**
   * Closes dropdown menu
   */
  closeDropdown(menu: HTMLElement, container: HTMLElement): void {
    menu.style.display = 'none';
    container.classList.remove('open');
    globalOpenDropdowns.delete(container);

    const trigger = container.querySelector('.zg-dropdown-trigger') as HTMLElement;
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    }
  }

  /**
   * Closes all other open dropdowns
   */
  private closeOtherDropdowns(currentContainer: HTMLElement): void {
    for (const openContainer of Array.from(globalOpenDropdowns)) {
      if (openContainer !== currentContainer) {
        const openMenu =
          globalOpenDropdownMenus.get(openContainer) ||
          (openContainer.querySelector('.zg-dropdown-menu') as HTMLElement | null);
        if (openMenu) {
          this.closeDropdown(openMenu, openContainer);
        }
      }
    }
  }

  /**
   * Clears search input and resets options display
   */
  clearSearch(menu: HTMLElement): void {
    const searchInput = menu.querySelector('.zg-dropdown-search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';

      const optionsList = menu.querySelector('.zg-dropdown-options') as HTMLElement;
      if (optionsList) {
        optionsList.querySelectorAll('.zg-dropdown-option').forEach((opt) => {
          (opt as HTMLElement).style.display = '';
        });
        optionsList.querySelectorAll('.zg-dropdown-group-header').forEach((header) => {
          (header as HTMLElement).style.display = '';
        });
      }
    }
  }
}
