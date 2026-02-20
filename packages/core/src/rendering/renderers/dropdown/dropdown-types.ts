import type { RenderParams } from '../renderer.interface';

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
 * Configuration options for DropdownRenderer
 */
export interface DropdownRendererOptions {
  /** Array of dropdown options (default: empty array with warning) */
  options?: DropdownOption[];
  /** Enable search/filter functionality */
  searchable?: boolean;
  /** Allow multiple selections */
  multiSelect?: boolean;
  /** Allow custom values not in the options list */
  allowCustom?: boolean;
  /** Placeholder text when no value is selected */
  placeholder?: string;
  /** Callback when value changes */
  onChange?: (value: any | any[], params: RenderParams) => void;
  /** Custom CSS class for the dropdown */
  className?: string;
  /** Maximum height for dropdown menu in pixels */
  maxHeight?: number;
  /** Display format for selected values in multi-select */
  multiSelectDisplay?: 'tags' | 'count' | 'list';
  /** Custom option renderer function */
  optionRenderer?: (option: DropdownOption) => HTMLElement;
  /** Case-sensitive search */
  caseSensitiveSearch?: boolean;
  /** Maximum number of visible options before scrolling */
  maxVisibleOptions?: number;
}
