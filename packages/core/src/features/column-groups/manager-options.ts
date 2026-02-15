import type { ColumnGroupRenderer, ColumnGroupRendererOptions } from './column-group-renderer';
import type { ColumnGroupModelConfig } from './types';
import type { IRendererRegistry } from './renderer-registry';
import { ColumnGroupRenderer as Renderer } from './column-group-renderer';
import { globalRendererRegistry } from './renderer-registry';

/**
 * Options for ColumnGroupManager
 */
export interface ColumnGroupManagerOptions {
  /**
   * Model configuration
   */
  modelConfig?: ColumnGroupModelConfig;

  /**
   * Renderer configuration (used when creating a renderer directly)
   */
  rendererConfig?: ColumnGroupRendererOptions;

  /**
   * Renderer name to lookup from the registry
   * If both rendererName and rendererConfig are provided, rendererName takes precedence
   */
  rendererName?: string;

  /**
   * Custom renderer registry to use (defaults to global registry)
   */
  rendererRegistry?: IRendererRegistry;

  /**
   * Enable automatic rendering when groups change
   */
  autoRender?: boolean;
}

/**
 * Internal options type with required fields
 */
export interface InternalColumnGroupManagerOptions {
  modelConfig: ColumnGroupModelConfig;
  rendererConfig: ColumnGroupRendererOptions;
  rendererName?: string;
  rendererRegistry: IRendererRegistry;
  autoRender: boolean;
}

/**
 * Configuration for renderer initialization
 */
export interface RendererInitConfig {
  rendererName?: string;
  rendererConfig: ColumnGroupRendererOptions;
  rendererRegistry: IRendererRegistry;
}

/**
 * Initialize renderer based on options
 */
export function initializeRenderer(config: RendererInitConfig): ColumnGroupRenderer | null {
  const { rendererName, rendererConfig, rendererRegistry } = config;

  // Priority:
  // 1. Use rendererName to lookup from registry
  // 2. Use rendererConfig to create directly
  // 3. Use default renderer from registry
  if (rendererName) {
    const renderer = rendererRegistry.get(rendererName, rendererConfig);
    if (!renderer) {
      throw new Error(`Renderer "${rendererName}" not found in registry`);
    }
    return renderer;
  } else if (rendererConfig && Object.keys(rendererConfig).length > 0) {
    return new Renderer(rendererConfig);
  } else {
    return rendererRegistry.getDefaultRenderer();
  }
}

/**
 * Create internal options from user options
 */
export function createInternalOptions(
  options: ColumnGroupManagerOptions
): InternalColumnGroupManagerOptions {
  const rendererRegistry = options.rendererRegistry || globalRendererRegistry;

  return {
    modelConfig: options.modelConfig || {},
    rendererConfig: options.rendererConfig || {},
    rendererName: options.rendererName,
    rendererRegistry,
    autoRender: options.autoRender ?? true,
  };
}
