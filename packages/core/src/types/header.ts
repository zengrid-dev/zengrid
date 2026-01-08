/**
 * Header configuration types
 */

/**
 * Header type discriminator
 */
export type HeaderType =
  | 'text'           // Default text-only header
  | 'checkbox'       // Checkbox for row selection
  | 'icon'           // Icon-only header
  | 'sortable'       // Text with sort indicators
  | 'filterable'     // Text with filter dropdown
  | 'custom';        // Fully custom renderer

/**
 * Icon position within header
 */
export type IconPosition = 'leading' | 'trailing';

/**
 * Header icon configuration
 */
export interface HeaderIcon {
  /** Icon content (HTML string, SVG, or emoji) */
  content: string;
  /** Icon position relative to text */
  position: IconPosition;
  /** Optional CSS class for the icon */
  className?: string;
  /** Optional click handler */
  onClick?: (event: MouseEvent, columnIndex: number) => void;
}

/**
 * Header tooltip configuration
 */
export interface HeaderTooltip {
  /** Tooltip content (can be HTML) */
  content: string;
  /** Tooltip position */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay before showing (ms) */
  delay?: number;
}

/**
 * Header context menu item
 */
export interface HeaderContextMenuItem {
  /** Menu item label */
  label: string;
  /** Menu item icon (optional) */
  icon?: string;
  /** Click handler */
  action: (columnIndex: number) => void;
  /** Whether item is disabled */
  disabled?: boolean;
  /** Separator after this item */
  separator?: boolean;
}

/**
 * Sort indicator configuration
 */
export interface SortIndicatorConfig {
  /** Show sort indicator */
  show: boolean;
  /** Custom ascending icon */
  ascIcon?: string;
  /** Custom descending icon */
  descIcon?: string;
  /** Position of sort indicator */
  position?: IconPosition;
}

/**
 * Filter indicator configuration
 */
export interface FilterIndicatorConfig {
  /** Show filter dropdown trigger */
  show: boolean;
  /** Custom filter icon */
  icon?: string;
  /** Filter dropdown component type */
  dropdownType?: 'text' | 'select' | 'date' | 'number' | 'custom';
  /** Custom dropdown renderer name (when dropdownType is 'custom') */
  customDropdown?: string;
}

/**
 * Full header configuration
 */
export interface HeaderConfig {
  /** Header display text */
  text: string;

  /** Header type (determines default rendering behavior) */
  type?: HeaderType;

  /** Leading icon */
  leadingIcon?: HeaderIcon;

  /** Trailing icon */
  trailingIcon?: HeaderIcon;

  /** Tooltip configuration */
  tooltip?: HeaderTooltip;

  /** Additional CSS classes */
  className?: string;

  /** Inline styles */
  style?: Partial<CSSStyleDeclaration>;

  /** Click handler */
  onClick?: (event: MouseEvent, columnIndex: number) => void;

  /** Double-click handler */
  onDoubleClick?: (event: MouseEvent, columnIndex: number) => void;

  /** Context menu items */
  contextMenu?: HeaderContextMenuItem[];

  /** Sort indicator configuration */
  sortIndicator?: SortIndicatorConfig;

  /** Filter indicator configuration */
  filterIndicator?: FilterIndicatorConfig;

  /** Custom renderer name (for type: 'custom') */
  renderer?: string;

  /** Custom data passed to renderer */
  rendererData?: any;

  /** Whether header is interactive (enables hover/focus states) */
  interactive?: boolean;
}

/**
 * Resolved header config (after applying defaults)
 */
export interface ResolvedHeaderConfig extends Required<Pick<HeaderConfig, 'text' | 'type' | 'interactive'>> {
  leadingIcon?: HeaderIcon;
  trailingIcon?: HeaderIcon;
  tooltip?: HeaderTooltip;
  className?: string;
  style?: Partial<CSSStyleDeclaration>;
  onClick?: (event: MouseEvent, columnIndex: number) => void;
  onDoubleClick?: (event: MouseEvent, columnIndex: number) => void;
  contextMenu?: HeaderContextMenuItem[];
  sortIndicator?: SortIndicatorConfig;
  filterIndicator?: FilterIndicatorConfig;
  renderer?: string;
  rendererData?: any;
}
