import type { CellEditor, EditorParams, ValidationResult } from '../cell-editor.interface';
import type { DropdownOption, DropdownEditorOptions, DropdownEditorNormalizedOptions } from './types';
import { SimpleLRUCache } from './types';
import {
  getFilteredOptions,
  parseInitialValue,
  getDisplayText,
  getPlaceholderText,
} from './search-filter';
import {
  createContainer,
  createSearchInput,
  createDisplayElement,
  createDropdownMenu,
  renderFilteredOptions,
} from './ui-builder';
import { validateDropdownValue } from './validators';
import {
  openDropdown,
  closeDropdown,
  highlightNext,
  highlightPrevious,
  scrollToHighlighted,
  selectOption,
} from './dropdown-manager';
import {
  createEventHandlers,
  setupEventListeners,
  removeEventListeners,
  type EventHandlers,
} from './event-handlers';

export type { DropdownOption, DropdownEditorOptions };

/**
 * DropdownEditor - Dropdown/select editor with search and multi-select
 */
export class DropdownEditor implements CellEditor<any> {
  private options: DropdownEditorNormalizedOptions;
  private container: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private dropdownMenu: HTMLElement | null = null;
  private isDestroyed = false;
  private selectedValues: Set<any> = new Set();
  private initialValue: any = null;
  private params: EditorParams | null = null;
  private filteredOptionsCache: SimpleLRUCache<string, DropdownOption[]>;
  private isDropdownOpen = false;
  private highlightedIndex = -1;
  private eventHandlers: EventHandlers | null = null;

  constructor(options: DropdownEditorOptions) {
    if (!options.options || options.options.length === 0) {
      throw new Error('DropdownEditor requires at least one option');
    }

    this.options = {
      options: options.options,
      searchable: options.searchable ?? true,
      multiSelect: options.multiSelect ?? false,
      allowCustom: options.allowCustom ?? false,
      placeholder: options.placeholder ?? 'Select...',
      maxHeight: options.maxHeight ?? 300,
      multiSelectDisplay: options.multiSelectDisplay ?? 'tags',
      caseSensitiveSearch: options.caseSensitiveSearch ?? false,
      maxVisibleOptions: options.maxVisibleOptions ?? 10,
      required: options.required ?? false,
      className: options.className ?? 'zg-dropdown-editor',
      autoFocus: options.autoFocus ?? true,
      selectAllOnFocus: options.selectAllOnFocus ?? false,
      validator: options.validator,
      stopOnBlur: options.stopOnBlur ?? true,
    };

    this.filteredOptionsCache = new SimpleLRUCache<string, DropdownOption[]>(50);
  }

  init(container: HTMLElement, value: any, params: EditorParams): void {
    this.params = params;
    this.isDestroyed = false;
    this.isDropdownOpen = false;
    this.highlightedIndex = -1;
    this.initialValue = value;
    this.selectedValues = parseInitialValue(value, this.options.multiSelect);

    container.innerHTML = '';

    this.container = createContainer(this.options, params);

    const displayText = getDisplayText(this.selectedValues, this.options, this.options.options);
    const placeholder = getPlaceholderText(this.selectedValues, this.options.placeholder, this.options, this.options.options);

    if (this.options.searchable) {
      this.searchInput = createSearchInput(this.options, placeholder);
      this.container.appendChild(this.searchInput);
    } else {
      const display = createDisplayElement(this.options, displayText);
      this.container.appendChild(display);
    }

    this.dropdownMenu = createDropdownMenu(this.options);
    this.container.appendChild(this.dropdownMenu);

    container.appendChild(this.container);

    this.eventHandlers = createEventHandlers(
      this.searchInput,
      this.dropdownMenu,
      this.container,
      () => this.isDestroyed,
      this.options.stopOnBlur,
      () => this.handleOpenDropdown(),
      () => this.handleCloseDropdown(),
      () => this.handleCommit(),
      (searchTerm) => this.handleRenderFiltered(searchTerm)
    );

    setupEventListeners(this.searchInput, this.container, this.options.className, this.eventHandlers);

    if (this.options.autoFocus) {
      requestAnimationFrame(() => {
        this.focus();
        this.handleOpenDropdown();
      });
    }
  }

  private handleOpenDropdown(): void {
    if (this.isDropdownOpen) return;
    this.isDropdownOpen = true;
    openDropdown(this.dropdownMenu, this.container);
    this.handleRenderFiltered(this.searchInput?.value || '');
  }

  private handleCloseDropdown(): void {
    if (!this.isDropdownOpen) return;
    this.isDropdownOpen = false;
    closeDropdown(this.dropdownMenu, this.container);
  }

  private handleRenderFiltered(searchTerm: string): void {
    if (!this.dropdownMenu) return;

    const filtered = getFilteredOptions(
      searchTerm,
      this.options.options,
      this.filteredOptionsCache,
      this.options.caseSensitiveSearch
    );

    renderFilteredOptions(
      this.dropdownMenu,
      filtered,
      this.options.className,
      this.selectedValues,
      this.highlightedIndex,
      (option) => this.handleSelectOption(option)
    );
  }

  private handleSelectOption(option: DropdownOption): void {
    this.selectedValues = selectOption(option, this.selectedValues, this.options.multiSelect);

    if (this.searchInput) {
      this.searchInput.placeholder = getPlaceholderText(
        this.selectedValues,
        this.options.placeholder,
        this.options,
        this.options.options
      );
    }

    if (this.params?.onChange) {
      this.params.onChange(this.getValue());
    }

    this.handleRenderFiltered(this.searchInput?.value || '');

    if (!this.options.multiSelect) {
      this.handleCloseDropdown();
      this.handleCommit();
    }
  }

  onKeyDown(event: KeyboardEvent): boolean {
    const key = event.key;

    if (key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      if (this.isDropdownOpen && this.highlightedIndex >= 0) {
        const filtered = getFilteredOptions(
          this.searchInput?.value || '',
          this.options.options,
          this.filteredOptionsCache,
          this.options.caseSensitiveSearch
        );
        const option = filtered[this.highlightedIndex];
        if (option && !option.disabled) {
          this.handleSelectOption(option);
        }
      }
      if (!this.options.multiSelect || !this.isDropdownOpen) {
        this.handleCommit();
      }
      return true;
    } else if (key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.isDropdownOpen ? this.handleCloseDropdown() : this.handleCancel();
      return true;
    } else if (key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
      if (!this.isDropdownOpen) this.handleOpenDropdown();
      const filtered = getFilteredOptions(
        this.searchInput?.value || '',
        this.options.options,
        this.filteredOptionsCache,
        this.options.caseSensitiveSearch
      );
      this.highlightedIndex = highlightNext(this.highlightedIndex, filtered.length);
      scrollToHighlighted(this.dropdownMenu, this.highlightedIndex);
      this.handleRenderFiltered(this.searchInput?.value || '');
      return true;
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      if (!this.isDropdownOpen) this.handleOpenDropdown();
      const filtered = getFilteredOptions(
        this.searchInput?.value || '',
        this.options.options,
        this.filteredOptionsCache,
        this.options.caseSensitiveSearch
      );
      this.highlightedIndex = highlightPrevious(this.highlightedIndex, filtered.length);
      scrollToHighlighted(this.dropdownMenu, this.highlightedIndex);
      this.handleRenderFiltered(this.searchInput?.value || '');
      return true;
    } else if (key === 'Tab') {
      this.handleCommit();
      return false;
    }

    event.stopPropagation();
    return true;
  }

  getValue(): any {
    if (this.options.multiSelect) {
      return Array.from(this.selectedValues);
    }
    const firstValue = this.selectedValues.values().next().value;
    return firstValue !== undefined ? firstValue : null;
  }

  isValid(): boolean | ValidationResult {
    return validateDropdownValue(this.getValue(), this.options, this.options.options);
  }

  focus(): void {
    if (this.searchInput) {
      this.searchInput.focus();
      if (this.options.selectAllOnFocus) {
        this.searchInput.select();
      }
    } else if (this.container) {
      const display = this.container.querySelector(
        `.${this.options.className}-display`
      ) as HTMLElement;
      if (display) display.focus();
    }
  }

  destroy(): void {
    if (this.isDestroyed) return;

    if (this.eventHandlers) {
      removeEventListeners(
        this.searchInput,
        this.container,
        this.options.className,
        this.eventHandlers
      );
    }

    this.filteredOptionsCache.clear();
    this.selectedValues.clear();

    if (this.container) this.container.remove();

    this.container = null;
    this.searchInput = null;
    this.dropdownMenu = null;
    this.params = null;
    this.eventHandlers = null;
    this.isDestroyed = true;
  }

  private handleCommit(): void {
    if (this.isDestroyed || !this.params) return;

    const value = this.getValue();
    const validationResult = this.isValid();

    const isValid =
      typeof validationResult === 'boolean' ? validationResult : validationResult.valid;

    if (!isValid && typeof validationResult === 'object') {
      console.warn('DropdownEditor: Validation failed:', validationResult.message);
    }

    this.params.onComplete?.(value, false);
  }

  private handleCancel(): void {
    if (this.isDestroyed || !this.params) return;
    this.params.onComplete?.(this.initialValue, true);
  }
}

export function createDropdownEditor(options: DropdownEditorOptions): DropdownEditor {
  return new DropdownEditor(options);
}
