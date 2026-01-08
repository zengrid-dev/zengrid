/**
 * Shared Utilities for Cell Renderers
 *
 * Common helper functions and classes used across multiple renderers.
 */

/**
 * Simple LRU (Least Recently Used) Cache
 *
 * Used by DateRenderer and DropdownRenderer for caching formatted values
 * and filtered options to improve performance.
 *
 * @template K - Key type
 * @template V - Value type
 */
export class SimpleLRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get a value from the cache
   * Moves the accessed item to the end (most recently used)
   */
  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * Set a value in the cache
   * Evicts the oldest item if cache exceeds max size
   */
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

  /**
   * Check if a key exists in the cache
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the current size of the cache
   */
  get size(): number {
    return this.cache.size;
  }
}

/**
 * Escape HTML to prevent XSS attacks
 *
 * Converts HTML special characters to their entity equivalents.
 * Used by renderers that need to safely display user-provided content.
 *
 * @param text - Text to escape
 * @returns Escaped HTML-safe text
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Deep equality comparison for values
 *
 * Used by renderers to determine if a value has actually changed
 * and whether update() needs to modify the DOM.
 *
 * Handles:
 * - Primitives (string, number, boolean, null, undefined)
 * - Arrays (recursive comparison)
 * - Objects (recursive comparison)
 * - Dates
 *
 * @param a - First value
 * @param b - Second value
 * @returns True if values are deeply equal
 */
export function deepEqual(a: any, b: any): boolean {
  // Same reference
  if (a === b) return true;

  // Different types or one is null/undefined
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;

  // Dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  // Objects
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every(key =>
      keysB.includes(key) && deepEqual(a[key], b[key])
    );
  }

  // Primitives (already checked by ===)
  return false;
}

/**
 * Format a number as a percentage
 *
 * Helper for ProgressBarRenderer and other numeric displays.
 *
 * @param value - Numeric value
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Clamp a number between min and max values
 *
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Check if a value is a valid URL
 *
 * Used by LinkRenderer for validation.
 *
 * @param value - Value to check
 * @returns True if value is a valid URL
 */
export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Add URL prefix if needed
 *
 * Used by LinkRenderer to handle relative URLs.
 *
 * @param url - URL to process
 * @param prefix - Prefix to add for relative URLs
 * @returns Complete URL
 */
export function addUrlPrefix(url: string, prefix?: string): string {
  if (!url) return url;

  // Already has protocol
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
    return url;
  }

  // Add prefix for relative URLs
  if (prefix) {
    return prefix + url;
  }

  return url;
}

/**
 * Generate a unique ID for DOM elements
 *
 * Used by renderers that need to create unique IDs for ARIA relationships.
 *
 * @param prefix - Prefix for the ID
 * @returns Unique ID string
 */
let idCounter = 0;
export function generateId(prefix: string = 'zg'): string {
  return `${prefix}-${Date.now()}-${++idCounter}`;
}
