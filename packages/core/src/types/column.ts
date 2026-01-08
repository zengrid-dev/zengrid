/**
 * Column definition types
 */

import type { HeaderConfig } from './header';
import type { CellRenderer } from '../rendering/renderers';

/**
 * Column definition
 */
export interface ColumnDef {
  id?: string; // Unique identifier for the column (auto-generated if not provided)
  field: string;
  /**
   * Header configuration
   * - string: Simple text header (backward compatible)
   * - HeaderConfig: Full configuration object
   */
  header: string | HeaderConfig;
  width?: number;
  /**
   * Renderer configuration
   * - string: Renderer name registered in RendererRegistry (e.g., 'text', 'checkbox')
   * - CellRenderer: Direct renderer instance for custom behavior
   */
  renderer?: string | CellRenderer;
  sortable?: boolean;
  editable?: boolean;
  filterable?: boolean;
  resizable?: boolean; // Enable resize for this column (default: true)
  reorderable?: boolean; // Enable drag-to-reorder for this column (default: true)
  minWidth?: number; // Minimum width constraint
  maxWidth?: number; // Maximum width constraint
}

/**
 * Sort icons configuration
 */
export interface SortIcons {
  asc?: string;  // Icon for ascending sort (default: '▲')
  desc?: string; // Icon for descending sort (default: '▼')
}
