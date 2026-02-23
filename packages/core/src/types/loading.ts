/**
 * Loading indicator types
 */

/**
 * Loading indicator template type - 4 built-in styles
 */
export type LoadingTemplate =
  | 'simple' // Simple text "Loading..."
  | 'animated' // Animated spinner with rotating dots
  | 'modern' // Modern circular loader
  | 'skeleton'; // Skeleton screen shimmer effect

/**
 * Loading indicator state
 */
export interface LoadingState {
  /**
   * Whether data is currently loading
   */
  isLoading: boolean;

  /**
   * Loading message to display
   */
  message?: string;

  /**
   * Loading progress (0-100) for progress bar
   */
  progress?: number;
}

/**
 * Loading indicator configuration
 */
export interface LoadingConfig {
  /**
   * Enable loading indicator
   * @default true
   */
  enabled?: boolean;

  /**
   * Template style
   * @default 'modern'
   */
  template?: LoadingTemplate;

  /**
   * Custom template renderer
   * If provided, overrides built-in templates
   */
  customTemplate?: (state: LoadingState) => HTMLElement;

  /**
   * Loading message
   * @default 'Loading...'
   */
  message?: string;

  /**
   * Minimum display time in ms (prevents flash for fast loads)
   * @default 300
   */
  minDisplayTime?: number;

  /**
   * Position of loading indicator
   * @default 'center'
   */
  position?: 'top' | 'center' | 'bottom';

  /**
   * Show overlay behind loading indicator
   * @default true
   */
  showOverlay?: boolean;

  /**
   * Overlay opacity (0-1)
   * @default 0.5
   */
  overlayOpacity?: number;
}
