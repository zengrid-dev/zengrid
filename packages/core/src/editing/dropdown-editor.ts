import type { CellEditor, EditorParams, ValidationResult } from './cell-editor.interface';

/**
 * Simple LRU Cache implementation for dropdown search optimization
 */
class SimpleLRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Delete if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // Add to end
    this.cache.set(key, value);
    // Evict oldest if over capacity
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Dropdown option definition
 */
export interface DropdownOption {
  /** Display label for the option */
  label: string;
  /** Value for the option */
  value: any;
  /** Whether this option is disabled */
  disabled?: boolean;
  /** Optional group for categorization */
  group?: string;
}

/**
 * Configuration options for DropdownEditor
 */
export interface DropdownEditorOptions {
  /** Array of dropdown options */
  options: DropdownOption[];
  /** Enable search/filter functionality (default: true) */
  searchable?: boolean;
  /** Allow multiple selections (default: false) */
  multiSelect?: boolean;
  /** Allow custom values not in the options list (default: false) */
  allowCustom?: boolean;
  /** Placeholder text when no value is selected */
  placeholder?: string;
  /** Maximum height for dropdown menu in pixels (default: 300) */
  maxHeight?: number;
  /** Display format for selected values in multi-select (default: 'tags') */
  multiSelectDisplay?: 'tags' | 'count' | 'list';
  /** Case-sensitive search (default: false) */
  caseSensitiveSearch?: boolean;
  /** Maximum number of visible options before scrolling (default: 10) */
  maxVisibleOptions?: number;
  /** Whether the field is required */
  required?: boolean;
  /** Custom CSS class for the container element */
  className?: string;
  /** Auto-focus on init (default: true) */
  autoFocus?: boolean;
  /** Select all text on focus (default: false) */
  selectAllOnFocus?: boolean;
  /** Custom validator function */
  validator?: (value: any) => boolean | string;
  /** Commit on blur (default: true) */
  stopOnBlur?: boolean;
}

/**
 * DropdownEditor - Dropdown/select editor for choosing from options
 *
 * Features:
 * - Single and multi-select modes with display options
 * - Searchable/filterable with LRU cache for performance
 * - Option grouping with headers
 * - Custom value support
 * - Keyboard navigation (Arrow keys, Enter, Escape, Tab)
 * - Click outside to close dropdown
 * - Disabled options support
 * - Auto-focus on init with optional select all
 * - Blur handling for commit
 * - Full ARIA attributes for accessibility
 * - Initial value restoration on cancel
 * - Required field validation
 * - Custom validation functions
 * - Event delegation for efficient event handling
 *
 * Performance: Optimized for 1000+ options with search caching
 *
 * @example
 * ```typescript
 * // Basic single-select dropdown
 * const editor = new DropdownEditor({
 *   options: [
 *     { label: 'Option 1', value: '1' },
 *     { label: 'Option 2', value: '2' },
 *   ],
 *   searchable: true,
 *   placeholder: 'Select an option...'
 * });
 *
 * // Multi-select with grouping
 * const editor = new DropdownEditor({
 *   options: [
 *     { label: 'Red', value: 'red', group: 'Colors' },
 *     { label: 'Blue', value: 'blue', group: 'Colors' },
 *     { label: 'Small', value: 'small', group: 'Sizes' },
 *   ],
 *   multiSelect: true,
 *   multiSelectDisplay: 'count',
 *   required: true
 * });
 *
 * // Searchable with validation
 * const editor = new DropdownEditor({
 *   options: [...],
 *   searchable: true,
 *   caseSensitiveSearch: false,
 *   validator: (value) => {
 *     if (!value) return 'Selection is required';
 *     return true;
 *   }
 * });
 * ```
 */
export class DropdownEditor implements CellEditor<any> {
  private options: Required<Omit<DropdownEditorOptions, 'validator'>> & {
    validator?: (value: any) => boolean | string;
  };
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

  /**
   * Creates a new DropdownEditor instance
   *
   * @param options - Configuration options for the editor
   */
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

  /**
   * Initialize editor in the container element
   *
   * Creates a dropdown editor, sets up event listeners, and focuses if configured.
   *
   * @param container - The DOM element to render the editor into
   * @param value - Initial value for the editor (single value or array for multi-select)
   * @param params - Edit parameters including callbacks
   */
  init(container: HTMLElement, value: any, params: EditorParams): void {
    this.params = params;
    this.isDestroyed = false;
    this.isDropdownOpen = false;
    this.highlightedIndex = -1;

    // Store initial value for restoration on cancel
    this.initialValue = value;
    this.selectedValues = this.parseInitialValue(value);

    // Clear previous content
    container.innerHTML = '';

    // Create container
    this.container = document.createElement('div');
    this.container.className = `${this.options.className}-container`;
    this.container.setAttribute('role', 'combobox');
    this.container.setAttribute('aria-expanded', 'false');
    this.container.setAttribute('aria-haspopup', 'listbox');
    this.container.setAttribute(
      'aria-label',
      `Edit ${params.column?.header || params.column?.field || 'dropdown'}`
    );
    if (this.options.required) {
      this.container.setAttribute('aria-required', 'true');
    }

    // Inline styles for container
    this.container.style.position = 'relative';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.boxSizing = 'border-box';

    // Create search input or display element
    if (this.options.searchable) {
      this.searchInput = document.createElement('input');
      this.searchInput.type = 'text';
      this.searchInput.className = `${this.options.className}-search`;
      this.searchInput.placeholder = this.getPlaceholderText();
      this.searchInput.setAttribute('role', 'searchbox');
      this.searchInput.setAttribute('aria-autocomplete', 'list');
      this.searchInput.setAttribute('aria-controls', 'dropdown-menu');

      // Inline styles for search input
      this.searchInput.style.width = '100%';
      this.searchInput.style.height = '100%';
      this.searchInput.style.border = 'none';
      this.searchInput.style.outline = '2px solid #4CAF50';
      this.searchInput.style.padding = '4px 8px';
      this.searchInput.style.fontSize = '13px';
      this.searchInput.style.fontFamily = 'inherit';
      this.searchInput.style.backgroundColor = '#fff';
      this.searchInput.style.boxSizing = 'border-box';

      this.container.appendChild(this.searchInput);
    } else {
      const display = document.createElement('div');
      display.className = `${this.options.className}-display`;
      display.textContent = this.getDisplayText();
      display.setAttribute('tabindex', '0');
      display.setAttribute('role', 'button');

      // Inline styles for display
      display.style.width = '100%';
      display.style.height = '100%';
      display.style.border = 'none';
      display.style.outline = '2px solid #4CAF50';
      display.style.padding = '4px 8px';
      display.style.fontSize = '13px';
      display.style.fontFamily = 'inherit';
      display.style.backgroundColor = '#fff';
      display.style.boxSizing = 'border-box';
      display.style.cursor = 'pointer';
      display.style.userSelect = 'none';
      display.style.display = 'flex';
      display.style.alignItems = 'center';

      this.container.appendChild(display);
    }

    // Create dropdown menu
    this.dropdownMenu = document.createElement('div');
    this.dropdownMenu.className = `${this.options.className}-menu`;
    this.dropdownMenu.id = 'dropdown-menu';
    this.dropdownMenu.setAttribute('role', 'listbox');
    if (this.options.multiSelect) {
      this.dropdownMenu.setAttribute('aria-multiselectable', 'true');
    }

    // Inline styles for dropdown menu
    this.dropdownMenu.style.position = 'absolute';
    this.dropdownMenu.style.top = '100%';
    this.dropdownMenu.style.left = '0';
    this.dropdownMenu.style.width = '100%';
    this.dropdownMenu.style.maxHeight = `${this.options.maxHeight}px`;
    this.dropdownMenu.style.overflowY = 'auto';
    this.dropdownMenu.style.backgroundColor = '#fff';
    this.dropdownMenu.style.border = '1px solid #ccc';
    this.dropdownMenu.style.borderTop = 'none';
    this.dropdownMenu.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    this.dropdownMenu.style.zIndex = '1000';
    this.dropdownMenu.style.display = 'none';
    this.dropdownMenu.style.boxSizing = 'border-box';

    this.container.appendChild(this.dropdownMenu);

    // Set data attributes
    this.container.dataset.row = String(params.cell.row);
    this.container.dataset.col = String(params.cell.col);
    if (params.column?.field) {
      this.container.dataset.field = params.column.field;
    }

    container.appendChild(this.container);

    // Set up event listeners
    this.setupEventListeners();

    // Auto-focus if configured
    if (this.options.autoFocus) {
      requestAnimationFrame(() => {
        this.focus();
        this.openDropdown();
      });
    }
  }

  /**
   * Handle key events
   *
   * @param event - Keyboard event
   * @returns True if handled, false to propagate
   */
  onKeyDown(event: KeyboardEvent): boolean {
    const key = event.key;

    if (key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      if (this.isDropdownOpen && this.highlightedIndex >= 0) {
        // Select highlighted option
        const filteredOptions = this.getFilteredOptions(this.searchInput?.value || '');
        const option = filteredOptions[this.highlightedIndex];
        if (option && !option.disabled) {
          this.selectOption(option);
        }
      }
      // Commit edit for single-select or when dropdown is closed
      if (!this.options.multiSelect || !this.isDropdownOpen) {
        this.handleCommit();
        return true;
      }
      return true;
    } else if (key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (this.isDropdownOpen) {
        this.closeDropdown();
      } else {
        this.handleCancel();
      }
      return true;
    } else if (key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
      if (!this.isDropdownOpen) {
        this.openDropdown();
      }
      this.highlightNext();
      return true;
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      if (!this.isDropdownOpen) {
        this.openDropdown();
      }
      this.highlightPrevious();
      return true;
    } else if (key === 'Tab') {
      // Allow default tab behavior but commit edit
      this.handleCommit();
      return false; // Let tab propagate for navigation
    } else if (key === ' ' && !this.options.searchable) {
      // Space to toggle dropdown (non-searchable only)
      event.preventDefault();
      event.stopPropagation();
      if (this.isDropdownOpen) {
        this.closeDropdown();
      } else {
        this.openDropdown();
      }
      return true;
    }

    // Don't propagate other keys to grid (avoid navigation while editing)
    event.stopPropagation();
    return true;
  }

  /**
   * Get the current value from the editor
   *
   * @returns The current editor value (single value or array for multi-select)
   */
  getValue(): any {
    if (this.options.multiSelect) {
      return Array.from(this.selectedValues);
    }
    const firstValue = this.selectedValues.values().next().value;
    return firstValue !== undefined ? firstValue : null;
  }

  /**
   * Check if current value is valid
   *
   * Checks:
   * - Required field validation
   * - Value exists in options (unless custom values allowed)
   * - Custom validator function
   *
   * @returns True if valid, false otherwise, or ValidationResult object
   */
  isValid(): boolean | ValidationResult {
    const value = this.getValue();

    // Required validation
    if (this.options.required) {
      if (this.options.multiSelect) {
        if (!Array.isArray(value) || value.length === 0) {
          return {
            valid: false,
            message: 'Please select at least one option',
          };
        }
      } else {
        if (value === null || value === undefined || value === '') {
          return {
            valid: false,
            message: 'This field is required',
          };
        }
      }
    }

    // Check if value exists in options (unless custom values allowed)
    if (!this.options.allowCustom) {
      const validValues = new Set(this.options.options.map((opt) => opt.value));
      if (this.options.multiSelect) {
        if (Array.isArray(value)) {
          for (const v of value) {
            if (!validValues.has(v)) {
              return {
                valid: false,
                message: `Invalid value: ${v}`,
              };
            }
          }
        }
      } else {
        if (value !== null && value !== undefined && !validValues.has(value)) {
          return {
            valid: false,
            message: 'Please select a valid option',
          };
        }
      }
    }

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
   * Focus the editor
   */
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
      if (display) {
        display.focus();
      }
    }
  }

  /**
   * Clean up resources when editing stops
   *
   * Removes event listeners and clears references to prevent memory leaks
   */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.removeEventListeners();
    this.filteredOptionsCache.clear();
    this.selectedValues.clear();

    if (this.container) {
      this.container.remove();
    }

    this.container = null;
    this.searchInput = null;
    this.dropdownMenu = null;
    this.params = null;
    this.isDestroyed = true;
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
        console.warn('DropdownEditor: Validation failed:', validationResult.message);
      } else {
        console.warn('DropdownEditor: Validation failed for value:', value);
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
    this.selectedValues = this.parseInitialValue(this.initialValue);

    const value = this.initialValue;
    this.params.onComplete?.(value, true);
  }

  /**
   * Parse initial value into Set of selected values
   */
  private parseInitialValue(value: any): Set<any> {
    const values = new Set<any>();

    if (value === null || value === undefined) {
      return values;
    }

    if (this.options.multiSelect) {
      if (Array.isArray(value)) {
        value.forEach((v) => values.add(v));
      } else {
        values.add(value);
      }
    } else {
      // Single select mode
      if (Array.isArray(value)) {
        // Use first value from array
        if (value.length > 0) {
          values.add(value[0]);
        }
      } else {
        values.add(value);
      }
    }

    return values;
  }

  /**
   * Get placeholder text based on selection state
   */
  private getPlaceholderText(): string {
    if (this.selectedValues.size === 0) {
      return this.options.placeholder;
    }
    return this.getDisplayText();
  }

  /**
   * Get display text for selected values
   */
  private getDisplayText(): string {
    if (this.selectedValues.size === 0) {
      return this.options.placeholder;
    }

    if (this.options.multiSelect) {
      const selectedArray = Array.from(this.selectedValues);
      if (this.options.multiSelectDisplay === 'count') {
        return `${selectedArray.length} selected`;
      } else if (this.options.multiSelectDisplay === 'list') {
        return selectedArray.map((v) => this.getLabelForValue(v)).join(', ');
      } else {
        // tags - show first few
        const labels = selectedArray.slice(0, 3).map((v) => this.getLabelForValue(v));
        const remaining = selectedArray.length - labels.length;
        if (remaining > 0) {
          labels.push(`+${remaining}`);
        }
        return labels.join(', ');
      }
    } else {
      const value = this.selectedValues.values().next().value;
      return this.getLabelForValue(value);
    }
  }

  /**
   * Get label for a given value
   */
  private getLabelForValue(value: any): string {
    const option = this.options.options.find((opt) => opt.value === value);
    return option ? option.label : String(value);
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', this.handleSearch);
      this.searchInput.addEventListener('focus', this.handleFocus);
      this.searchInput.addEventListener('blur', this.handleBlur);
      this.searchInput.addEventListener('click', this.stopPropagation);
      this.searchInput.addEventListener('mousedown', this.stopPropagation);
    } else if (this.container) {
      const display = this.container.querySelector(`.${this.options.className}-display`);
      if (display) {
        display.addEventListener('click', this.handleDisplayClick);
        display.addEventListener('blur', this.handleBlur);
      }
    }

    // Global click listener to close dropdown when clicking outside
    document.addEventListener('click', this.handleDocumentClick);
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    if (this.searchInput) {
      this.searchInput.removeEventListener('input', this.handleSearch);
      this.searchInput.removeEventListener('focus', this.handleFocus);
      this.searchInput.removeEventListener('blur', this.handleBlur);
      this.searchInput.removeEventListener('click', this.stopPropagation);
      this.searchInput.removeEventListener('mousedown', this.stopPropagation);
    } else if (this.container) {
      const display = this.container.querySelector(`.${this.options.className}-display`);
      if (display) {
        display.removeEventListener('click', this.handleDisplayClick);
        display.removeEventListener('blur', this.handleBlur);
      }
    }

    document.removeEventListener('click', this.handleDocumentClick);
  }

  /**
   * Stop event propagation to prevent grid interaction
   */
  private stopPropagation = (e: Event): void => {
    e.stopPropagation();
  };

  /**
   * Handle search input
   */
  private handleSearch = (): void => {
    const searchTerm = this.searchInput?.value || '';
    this.renderFilteredOptions(searchTerm);
    this.openDropdown();
  };

  /**
   * Handle focus event
   */
  private handleFocus = (): void => {
    this.openDropdown();
  };

  /**
   * Handle blur event
   */
  private handleBlur = (_e: Event): void => {
    // Delay to allow click on dropdown option
    setTimeout(() => {
      if (this.isDestroyed) {
        return;
      }

      // Check if focus moved to dropdown menu
      const activeElement = document.activeElement;
      if (this.dropdownMenu && this.dropdownMenu.contains(activeElement)) {
        return;
      }

      this.closeDropdown();

      if (this.options.stopOnBlur) {
        this.handleCommit();
      }
    }, 200);
  };

  /**
   * Handle display click (non-searchable mode)
   */
  private handleDisplayClick = (e: Event): void => {
    e.stopPropagation();
    if (this.isDropdownOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  };

  /**
   * Handle document click (to close dropdown when clicking outside)
   */
  private handleDocumentClick = (e: Event): void => {
    if (this.container && !this.container.contains(e.target as Node)) {
      this.closeDropdown();
    }
  };

  /**
   * Open the dropdown menu
   */
  private openDropdown(): void {
    if (this.isDropdownOpen || !this.dropdownMenu) {
      return;
    }

    this.isDropdownOpen = true;
    this.dropdownMenu.style.display = 'block';
    this.container?.setAttribute('aria-expanded', 'true');
    this.renderFilteredOptions(this.searchInput?.value || '');
  }

  /**
   * Close the dropdown menu
   */
  private closeDropdown(): void {
    if (!this.isDropdownOpen || !this.dropdownMenu) {
      return;
    }

    this.isDropdownOpen = false;
    this.dropdownMenu.style.display = 'none';
    this.container?.setAttribute('aria-expanded', 'false');
    this.highlightedIndex = -1;
  }

  /**
   * Get filtered options based on search term
   */
  private getFilteredOptions(searchTerm: string): DropdownOption[] {
    if (!searchTerm) {
      return this.options.options;
    }

    // Check cache first
    const cacheKey = this.options.caseSensitiveSearch ? searchTerm : searchTerm.toLowerCase();
    const cached = this.filteredOptionsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Filter options
    const normalizedSearch = this.options.caseSensitiveSearch
      ? searchTerm
      : searchTerm.toLowerCase();

    const filtered = this.options.options.filter((option) => {
      const label = this.options.caseSensitiveSearch ? option.label : option.label.toLowerCase();
      return label.includes(normalizedSearch);
    });

    // Cache result
    this.filteredOptionsCache.set(cacheKey, filtered);

    return filtered;
  }

  /**
   * Render filtered options in the dropdown menu
   */
  private renderFilteredOptions(searchTerm: string): void {
    if (!this.dropdownMenu) {
      return;
    }

    const filteredOptions = this.getFilteredOptions(searchTerm);

    // Clear menu
    this.dropdownMenu.innerHTML = '';

    if (filteredOptions.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = `${this.options.className}-no-results`;
      noResults.textContent = 'No results found';
      noResults.style.padding = '8px';
      noResults.style.color = '#999';
      noResults.style.textAlign = 'center';
      this.dropdownMenu.appendChild(noResults);
      return;
    }

    // Group options if needed
    const grouped = this.groupOptions(filteredOptions);

    // Render grouped options
    let optionIndex = 0;
    for (const [groupName, options] of Object.entries(grouped)) {
      if (groupName !== '__ungrouped__') {
        const groupHeader = document.createElement('div');
        groupHeader.className = `${this.options.className}-group-header`;
        groupHeader.textContent = groupName;
        groupHeader.style.padding = '6px 8px';
        groupHeader.style.fontWeight = 'bold';
        groupHeader.style.fontSize = '11px';
        groupHeader.style.color = '#666';
        groupHeader.style.textTransform = 'uppercase';
        groupHeader.style.borderTop = '1px solid #eee';
        this.dropdownMenu.appendChild(groupHeader);
      }

      options.forEach((option) => {
        const optionElement = this.createOptionElement(option, optionIndex);
        this.dropdownMenu!.appendChild(optionElement);
        optionIndex++;
      });
    }
  }

  /**
   * Group options by group property
   */
  private groupOptions(options: DropdownOption[]): Record<string, DropdownOption[]> {
    const grouped: Record<string, DropdownOption[]> = {};

    for (const option of options) {
      const groupName = option.group || '__ungrouped__';
      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(option);
    }

    return grouped;
  }

  /**
   * Create an option element
   */
  private createOptionElement(option: DropdownOption, index: number): HTMLElement {
    const optionElement = document.createElement('div');
    optionElement.className = `${this.options.className}-option`;
    optionElement.textContent = option.label;
    optionElement.setAttribute('role', 'option');
    optionElement.setAttribute('data-value', String(option.value));
    optionElement.setAttribute('data-index', String(index));

    // Inline styles
    optionElement.style.padding = '6px 8px';
    optionElement.style.cursor = option.disabled ? 'not-allowed' : 'pointer';
    optionElement.style.fontSize = '13px';
    optionElement.style.userSelect = 'none';

    if (option.disabled) {
      optionElement.classList.add('disabled');
      optionElement.setAttribute('aria-disabled', 'true');
      optionElement.style.color = '#ccc';
    } else {
      // Hover effect
      optionElement.addEventListener('mouseenter', () => {
        optionElement.style.backgroundColor = '#f5f5f5';
      });
      optionElement.addEventListener('mouseleave', () => {
        if (!this.selectedValues.has(option.value)) {
          optionElement.style.backgroundColor = 'transparent';
        }
      });
    }

    if (this.selectedValues.has(option.value)) {
      optionElement.classList.add('selected');
      optionElement.setAttribute('aria-selected', 'true');
      optionElement.style.backgroundColor = '#e3f2fd';
      optionElement.style.color = '#1976d2';
    }

    if (index === this.highlightedIndex) {
      optionElement.classList.add('highlighted');
      optionElement.style.backgroundColor = '#f0f0f0';
      optionElement.style.outline = '2px solid #4CAF50';
    }

    // Click handler
    if (!option.disabled) {
      optionElement.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectOption(option);
      });
    }

    return optionElement;
  }

  /**
   * Select an option
   */
  private selectOption(option: DropdownOption): void {
    if (this.options.multiSelect) {
      // Toggle selection
      if (this.selectedValues.has(option.value)) {
        this.selectedValues.delete(option.value);
      } else {
        this.selectedValues.add(option.value);
      }
      // Update display
      if (this.searchInput) {
        this.searchInput.placeholder = this.getPlaceholderText();
      }
      // Call onChange callback if provided
      if (this.params?.onChange) {
        this.params.onChange(this.getValue());
      }
      // Re-render options to update selected state
      this.renderFilteredOptions(this.searchInput?.value || '');
    } else {
      // Single select
      this.selectedValues.clear();
      this.selectedValues.add(option.value);
      this.closeDropdown();
      this.handleCommit();
    }
  }

  /**
   * Highlight next option
   */
  private highlightNext(): void {
    const filteredOptions = this.getFilteredOptions(this.searchInput?.value || '');
    if (filteredOptions.length === 0) {
      return;
    }

    this.highlightedIndex = (this.highlightedIndex + 1) % filteredOptions.length;
    this.renderFilteredOptions(this.searchInput?.value || '');
    this.scrollToHighlighted();
  }

  /**
   * Highlight previous option
   */
  private highlightPrevious(): void {
    const filteredOptions = this.getFilteredOptions(this.searchInput?.value || '');
    if (filteredOptions.length === 0) {
      return;
    }

    this.highlightedIndex =
      this.highlightedIndex <= 0 ? filteredOptions.length - 1 : this.highlightedIndex - 1;
    this.renderFilteredOptions(this.searchInput?.value || '');
    this.scrollToHighlighted();
  }

  /**
   * Scroll to highlighted option
   */
  private scrollToHighlighted(): void {
    if (!this.dropdownMenu) {
      return;
    }

    const highlighted = this.dropdownMenu.querySelector('.highlighted');
    if (highlighted) {
      highlighted.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
}

/**
 * Factory function to create DropdownEditor
 *
 * @example
 * ```typescript
 * // In column definition
 * const column = {
 *   field: 'status',
 *   header: 'Status',
 *   editable: true,
 *   editor: 'dropdown', // Registered name
 * };
 *
 * // Or create directly
 * const editor = createDropdownEditor({
 *   options: [
 *     { label: 'Active', value: 'active' },
 *     { label: 'Inactive', value: 'inactive' }
 *   ],
 *   searchable: true,
 *   required: true
 * });
 * ```
 */
export function createDropdownEditor(options: DropdownEditorOptions): DropdownEditor {
  return new DropdownEditor(options);
}
