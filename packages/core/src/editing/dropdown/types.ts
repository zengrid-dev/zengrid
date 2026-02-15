/**
 * Type definitions for DropdownEditor
 */

/**
 * Simple LRU Cache implementation for dropdown search optimization
 */
export class SimpleLRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, value);
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
  label: string;
  value: any;
  disabled?: boolean;
  group?: string;
}

/**
 * Configuration options for DropdownEditor
 */
export interface DropdownEditorOptions {
  options: DropdownOption[];
  searchable?: boolean;
  multiSelect?: boolean;
  allowCustom?: boolean;
  placeholder?: string;
  maxHeight?: number;
  multiSelectDisplay?: 'tags' | 'count' | 'list';
  caseSensitiveSearch?: boolean;
  maxVisibleOptions?: number;
  required?: boolean;
  className?: string;
  autoFocus?: boolean;
  selectAllOnFocus?: boolean;
  validator?: (value: any) => boolean | string;
  stopOnBlur?: boolean;
}

/**
 * Normalized options with defaults applied
 */
export type DropdownEditorNormalizedOptions = Required<
  Omit<DropdownEditorOptions, 'validator'>
> & {
  validator?: (value: any) => boolean | string;
};
