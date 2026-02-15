import type { DropdownOption, SimpleLRUCache, DropdownEditorNormalizedOptions } from './types';

/**
 * Get filtered options based on search term with caching
 */
export function getFilteredOptions(
  searchTerm: string,
  options: DropdownOption[],
  cache: SimpleLRUCache<string, DropdownOption[]>,
  caseSensitive: boolean
): DropdownOption[] {
  if (!searchTerm) {
    return options;
  }

  const cacheKey = caseSensitive ? searchTerm : searchTerm.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const normalizedSearch = caseSensitive ? searchTerm : searchTerm.toLowerCase();

  const filtered = options.filter((option) => {
    const label = caseSensitive ? option.label : option.label.toLowerCase();
    return label.includes(normalizedSearch);
  });

  cache.set(cacheKey, filtered);

  return filtered;
}

/**
 * Group options by group property
 */
export function groupOptions(options: DropdownOption[]): Record<string, DropdownOption[]> {
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
 * Parse initial value into a Set of selected values
 */
export function parseInitialValue(value: any, multiSelect: boolean): Set<any> {
  const selected = new Set<any>();

  if (value === null || value === undefined) {
    return selected;
  }

  if (multiSelect) {
    if (Array.isArray(value)) {
      value.forEach((v) => selected.add(v));
    } else {
      selected.add(value);
    }
  } else {
    selected.add(value);
  }

  return selected;
}

/**
 * Get label for a given value from options
 */
export function getLabelForValue(value: any, options: DropdownOption[]): string {
  const option = options.find((opt) => opt.value === value);
  return option ? option.label : String(value);
}

/**
 * Get display text for selected values
 */
export function getDisplayText(
  selectedValues: Set<any>,
  options: DropdownEditorNormalizedOptions,
  allOptions: DropdownOption[]
): string {
  if (selectedValues.size === 0) {
    return '';
  }

  const values = Array.from(selectedValues);

  if (!options.multiSelect) {
    return getLabelForValue(values[0], allOptions);
  }

  if (options.multiSelectDisplay === 'count') {
    return `${values.length} selected`;
  }

  if (options.multiSelectDisplay === 'list') {
    return values.map((v) => getLabelForValue(v, allOptions)).join(', ');
  }

  // tags mode
  return values.map((v) => getLabelForValue(v, allOptions)).join(', ');
}

/**
 * Get placeholder text
 */
export function getPlaceholderText(
  selectedValues: Set<any>,
  placeholder: string
): string {
  return selectedValues.size === 0 ? placeholder : '';
}
