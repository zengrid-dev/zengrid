import { SingletonFactory } from '@zengrid/shared';
import type { HeaderRenderer } from './header-renderer.interface';

/**
 * HeaderRendererRegistry - Named header renderer lookup
 *
 * Manages a collection of header renderers by name for dynamic lookup.
 * Uses SingletonFactory from @zengrid/shared for efficient instance management.
 *
 * @example
 * ```typescript
 * const registry = new HeaderRendererRegistry();
 * registry.register('sortable', () => new SortableHeaderRenderer());
 * registry.register('filterable', () => new FilterableHeaderRenderer());
 *
 * const renderer = registry.get('sortable'); // Returns SortableHeaderRenderer (cached)
 * const fallback = registry.get('unknown'); // Returns TextHeaderRenderer (default)
 * ```
 */
export class HeaderRendererRegistry {
  private factory: SingletonFactory<HeaderRenderer>;
  private defaultRenderer: HeaderRenderer | null = null;

  constructor() {
    this.factory = new SingletonFactory<HeaderRenderer>();
  }

  /**
   * Set the default renderer (typically TextHeaderRenderer)
   * This should be called once during initialization
   *
   * @param renderer - Default header renderer instance
   */
  setDefaultRenderer(renderer: HeaderRenderer): void {
    this.defaultRenderer = renderer;
  }

  /**
   * Register a header renderer with a name
   *
   * @param name - Unique renderer name (e.g., 'text', 'sortable', 'filterable')
   * @param creator - Function that creates the renderer instance
   *
   * @example
   * ```typescript
   * registry.register('sortable', () => new SortableHeaderRenderer());
   * ```
   */
  register(name: string, creator: () => HeaderRenderer): void {
    this.factory.register(name, creator);
  }

  /**
   * Get a header renderer by name
   *
   * @param name - Renderer name (undefined returns default)
   * @returns Renderer instance or default if not found
   *
   * @example
   * ```typescript
   * const renderer = registry.get('sortable'); // Get sortable renderer
   * const defaultRenderer = registry.get(); // Get default renderer
   * ```
   */
  get(name?: string): HeaderRenderer {
    if (!name) {
      return this.getDefaultRenderer();
    }

    const renderer = this.factory.create(name);
    return renderer ?? this.getDefaultRenderer();
  }

  /**
   * Check if a renderer is registered
   *
   * @param name - Renderer name
   * @returns True if registered
   */
  has(name: string): boolean {
    return this.factory.has(name);
  }

  /**
   * Unregister a renderer
   *
   * @param name - Renderer name
   * @returns True if unregistered, false if not found or is default
   */
  unregister(name: string): boolean {
    if (name === 'text') return false; // Cannot unregister default
    return this.factory.unregister(name);
  }

  /**
   * Get all registered renderer names
   *
   * @returns Array of registered renderer names
   */
  get names(): string[] {
    return this.factory.keys();
  }

  /**
   * Clear all renderers except default
   */
  clear(): void {
    this.factory.clear();

    // Re-register default if it exists
    if (this.defaultRenderer) {
      this.factory.register('text', () => this.defaultRenderer!);
    }
  }

  /**
   * Get the default renderer
   * Throws error if default renderer is not set
   *
   * @returns Default header renderer
   */
  private getDefaultRenderer(): HeaderRenderer {
    if (!this.defaultRenderer) {
      throw new Error(
        'HeaderRendererRegistry: Default renderer not set. Call setDefaultRenderer() first.'
      );
    }
    return this.defaultRenderer;
  }
}
