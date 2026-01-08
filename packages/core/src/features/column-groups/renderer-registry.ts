/**
 * Renderer Registry - Manages pluggable column group renderers
 *
 * Provides a registry pattern for managing multiple renderer implementations.
 * Allows registering custom renderers by name and retrieving them when needed.
 *
 * Features:
 * - Register renderer factories by name
 * - Retrieve renderer instances by name
 * - Default renderer fallback
 * - Type-safe renderer creation
 * - Singleton pattern for global registry
 */

import { ColumnGroupRenderer, ColumnGroupRendererOptions } from './column-group-renderer';

/**
 * Factory function type for creating renderer instances
 */
export type RendererFactory = (options?: ColumnGroupRendererOptions) => ColumnGroupRenderer;

/**
 * Interface for the renderer registry
 */
export interface IRendererRegistry {
  /**
   * Register a renderer factory by name
   *
   * @param name - Unique name for the renderer
   * @param factory - Factory function to create renderer instances
   */
  register(name: string, factory: RendererFactory): void;

  /**
   * Get a renderer instance by name
   *
   * @param name - Name of the registered renderer
   * @param options - Optional configuration for the renderer
   * @returns Renderer instance or undefined if not found
   */
  get(name: string, options?: ColumnGroupRendererOptions): ColumnGroupRenderer | undefined;

  /**
   * Check if a renderer is registered
   *
   * @param name - Name to check
   * @returns Whether the renderer is registered
   */
  has(name: string): boolean;

  /**
   * Unregister a renderer by name
   *
   * @param name - Name of the renderer to remove
   * @returns Whether the renderer was removed
   */
  unregister(name: string): boolean;

  /**
   * Get all registered renderer names
   *
   * @returns Array of registered renderer names
   */
  getRegisteredNames(): string[];

  /**
   * Set the default renderer name
   *
   * @param name - Name of the renderer to use as default
   */
  setDefaultRenderer(name: string): void;

  /**
   * Get the default renderer instance
   *
   * @param options - Optional configuration for the renderer
   * @returns Default renderer instance
   */
  getDefaultRenderer(options?: ColumnGroupRendererOptions): ColumnGroupRenderer;

  /**
   * Clear all registered renderers
   */
  clear(): void;
}

/**
 * Default implementation of the renderer registry
 */
export class RendererRegistry implements IRendererRegistry {
  private factories: Map<string, RendererFactory>;
  private defaultRendererName: string;

  /**
   * Create a new renderer registry
   *
   * @param defaultRenderer - Optional default renderer name
   */
  constructor(defaultRenderer: string = 'default') {
    this.factories = new Map();
    this.defaultRendererName = defaultRenderer;

    // Register the default column group renderer
    this.register('default', (options?: ColumnGroupRendererOptions) => {
      return new ColumnGroupRenderer(options);
    });
  }

  /**
   * Register a renderer factory by name
   */
  register(name: string, factory: RendererFactory): void {
    if (!name || name.trim() === '') {
      throw new Error('Renderer name cannot be empty');
    }

    if (!factory || typeof factory !== 'function') {
      throw new Error('Renderer factory must be a function');
    }

    if (this.factories.has(name)) {
      console.warn(`Renderer "${name}" is already registered. Overwriting.`);
    }

    this.factories.set(name, factory);
  }

  /**
   * Get a renderer instance by name
   */
  get(name: string, options?: ColumnGroupRendererOptions): ColumnGroupRenderer | undefined {
    const factory = this.factories.get(name);
    if (!factory) {
      return undefined;
    }

    try {
      return factory(options);
    } catch (error) {
      console.error(`Error creating renderer "${name}":`, error);
      return undefined;
    }
  }

  /**
   * Check if a renderer is registered
   */
  has(name: string): boolean {
    return this.factories.has(name);
  }

  /**
   * Unregister a renderer by name
   */
  unregister(name: string): boolean {
    // Don't allow unregistering the default renderer
    if (name === 'default') {
      console.warn('Cannot unregister the default renderer');
      return false;
    }

    return this.factories.delete(name);
  }

  /**
   * Get all registered renderer names
   */
  getRegisteredNames(): string[] {
    return Array.from(this.factories.keys());
  }

  /**
   * Set the default renderer name
   */
  setDefaultRenderer(name: string): void {
    if (!this.factories.has(name)) {
      throw new Error(`Cannot set default renderer: "${name}" is not registered`);
    }
    this.defaultRendererName = name;
  }

  /**
   * Get the default renderer instance
   */
  getDefaultRenderer(options?: ColumnGroupRendererOptions): ColumnGroupRenderer {
    const renderer = this.get(this.defaultRendererName, options);
    if (!renderer) {
      throw new Error(`Default renderer "${this.defaultRendererName}" is not available`);
    }
    return renderer;
  }

  /**
   * Get the current default renderer name
   */
  getDefaultRendererName(): string {
    return this.defaultRendererName;
  }

  /**
   * Clear all registered renderers except the default
   */
  clear(): void {
    const defaultFactory = this.factories.get('default');
    this.factories.clear();

    // Restore default renderer
    if (defaultFactory) {
      this.factories.set('default', defaultFactory);
    }
    this.defaultRendererName = 'default';
  }
}

/**
 * Global renderer registry instance
 *
 * This singleton provides a shared registry for the entire application.
 * Use this for most cases unless you need isolated registries.
 */
export const globalRendererRegistry = new RendererRegistry();

/**
 * Register a renderer in the global registry
 *
 * Convenience function for registering renderers globally.
 *
 * @param name - Unique name for the renderer
 * @param factory - Factory function to create renderer instances
 *
 * @example
 * ```typescript
 * // Register a custom renderer
 * registerRenderer('compact', (options) => {
 *   return new ColumnGroupRenderer({
 *     ...options,
 *     showChildCount: false,
 *     expandedIcon: '−',
 *     collapsedIcon: '+'
 *   });
 * });
 *
 * // Use it in a manager
 * const manager = new ColumnGroupManager({
 *   rendererName: 'compact'
 * });
 * ```
 */
export function registerRenderer(name: string, factory: RendererFactory): void {
  globalRendererRegistry.register(name, factory);
}

/**
 * Get a renderer from the global registry
 *
 * @param name - Name of the registered renderer
 * @param options - Optional configuration for the renderer
 * @returns Renderer instance or undefined if not found
 *
 * @example
 * ```typescript
 * const renderer = getRenderer('compact', {
 *   classPrefix: 'my-grid'
 * });
 * ```
 */
export function getRenderer(
  name: string,
  options?: ColumnGroupRendererOptions
): ColumnGroupRenderer | undefined {
  return globalRendererRegistry.get(name, options);
}

/**
 * Check if a renderer is registered globally
 *
 * @param name - Name to check
 * @returns Whether the renderer is registered
 */
export function hasRenderer(name: string): boolean {
  return globalRendererRegistry.has(name);
}

/**
 * Create a new isolated renderer registry
 *
 * Use this when you need a separate registry instance
 * (e.g., for testing or isolated components).
 *
 * @param defaultRenderer - Optional default renderer name
 * @returns A new renderer registry instance
 *
 * @example
 * ```typescript
 * const customRegistry = createRendererRegistry('custom-default');
 * customRegistry.register('theme1', (opts) => new ColumnGroupRenderer(opts));
 * ```
 */
export function createRendererRegistry(defaultRenderer?: string): RendererRegistry {
  return new RendererRegistry(defaultRenderer);
}
