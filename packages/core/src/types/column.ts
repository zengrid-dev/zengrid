/**
 * Column definition types
 */

/**
 * Column definition
 */
export interface ColumnDef {
  field: string;
  header: string;
  width?: number;
  renderer?: string;
  sortable?: boolean;
  editable?: boolean;
  filterable?: boolean;
  resizable?: boolean; // Enable resize for this column (default: true)
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
