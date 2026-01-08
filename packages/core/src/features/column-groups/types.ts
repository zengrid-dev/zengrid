/**
 * Column group types for hierarchical column organization
 */

/**
 * Column group definition
 * Supports nested groups for 2+ levels of hierarchy
 */
export interface ColumnGroup {
  /** Unique identifier for the group */
  groupId: string;

  /** Display name for the group header */
  headerName: string;

  /** Parent group ID (null for root groups) */
  parentGroupId: string | null;

  /** Child group IDs */
  children: string[];

  /** Leaf column fields that belong to this group */
  columnFields: string[];

  /** Whether the group is expanded (for collapsible groups) */
  expanded?: boolean;

  /** Custom data for the group */
  customData?: any;

  /** CSS classes for styling */
  cssClasses?: string[];

  /** Group level in hierarchy (0 for root) */
  level?: number;
}

/**
 * Configuration for column group model
 */
export interface ColumnGroupModelConfig {
  /** Maximum nesting depth allowed (default: 10) */
  maxDepth?: number;

  /** Whether to automatically calculate group levels */
  autoCalculateLevels?: boolean;

  /** Whether to validate group hierarchy on changes */
  validateHierarchy?: boolean;
}

/**
 * Result of group validation
 */
export interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean;

  /** Error messages if validation failed */
  errors: string[];

  /** Warning messages (non-critical) */
  warnings: string[];
}

/**
 * Group hierarchy node for traversal
 */
export interface GroupNode {
  /** The group */
  group: ColumnGroup;

  /** Parent node */
  parent: GroupNode | null;

  /** Child nodes */
  children: GroupNode[];

  /** Depth in hierarchy (0 for root) */
  depth: number;
}
