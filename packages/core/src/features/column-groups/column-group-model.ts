/**
 * Column Group Model - Manages hierarchical column group structure
 * Uses DependencyGraph for hierarchy validation and traversal
 */

import { DependencyGraph } from '../../utils/dependency-graph';
import { ColumnGroup, ColumnGroupModelConfig, ValidationResult, GroupNode } from './types';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<ColumnGroupModelConfig> = {
  maxDepth: 10,
  autoCalculateLevels: true,
  validateHierarchy: true,
};

/**
 * ColumnGroupModel - Manages column groups with hierarchical structure
 *
 * Features:
 * - Nested groups (2+ levels)
 * - Cycle detection using DependencyGraph
 * - Automatic level calculation
 * - Group expansion/collapse state
 * - Validation of group hierarchy
 * - Efficient traversal and queries
 */
export class ColumnGroupModel {
  private groups: Map<string, ColumnGroup> = new Map();
  private dependencyGraph: DependencyGraph<string>;
  private config: Required<ColumnGroupModelConfig>;

  constructor(config: ColumnGroupModelConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.dependencyGraph = new DependencyGraph<string>();
  }

  /**
   * Add a new column group
   * @throws Error if validation fails and validateHierarchy is enabled
   */
  addGroup(group: ColumnGroup): void {
    // Validate before adding
    if (this.config.validateHierarchy) {
      const validation = this.validateGroup(group);
      if (!validation.valid) {
        throw new Error(`Invalid group: ${validation.errors.join(', ')}`);
      }
    }

    // Store the group
    const groupCopy = { ...group, children: [...(group.children || [])] };
    this.groups.set(group.groupId, groupCopy);

    // Update dependency graph
    this.dependencyGraph.addNode(group.groupId);
    if (group.parentGroupId) {
      this.dependencyGraph.addDependency(group.groupId, group.parentGroupId);
    }

    // Calculate level if auto-calculate is enabled
    if (this.config.autoCalculateLevels) {
      this.calculateGroupLevel(group.groupId);
    }

    // Update parent's children list
    if (group.parentGroupId) {
      const parent = this.groups.get(group.parentGroupId);
      if (parent && !parent.children.includes(group.groupId)) {
        parent.children.push(group.groupId);
      }
    }
  }

  /**
   * Remove a column group and optionally its children
   */
  removeGroup(groupId: string, removeChildren: boolean = false): void {
    const group = this.groups.get(groupId);
    if (!group) {
      return;
    }

    // Remove children first if requested
    if (removeChildren) {
      const children = [...group.children];
      children.forEach((childId) => this.removeGroup(childId, true));
    } else {
      // Re-parent children to this group's parent
      group.children.forEach((childId) => {
        const child = this.groups.get(childId);
        if (child) {
          child.parentGroupId = group.parentGroupId;
          this.dependencyGraph.removeDependency(childId, groupId);
          if (group.parentGroupId) {
            this.dependencyGraph.addDependency(childId, group.parentGroupId);
          }
        }
      });

      // Update parent's children list
      if (group.parentGroupId) {
        const parent = this.groups.get(group.parentGroupId);
        if (parent) {
          parent.children = parent.children.filter((id) => id !== groupId);
          parent.children.push(...group.children);
        }
      }
    }

    // Remove from parent's children list
    if (group.parentGroupId) {
      const parent = this.groups.get(group.parentGroupId);
      if (parent) {
        parent.children = parent.children.filter((id) => id !== groupId);
      }
    }

    // Remove from graph and map
    this.dependencyGraph.removeNode(groupId);
    this.groups.delete(groupId);
  }

  /**
   * Update an existing group
   */
  updateGroup(groupId: string, updates: Partial<ColumnGroup>): void {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }

    // Handle parent change
    if (updates.parentGroupId !== undefined && updates.parentGroupId !== group.parentGroupId) {
      // Remove old parent dependency
      if (group.parentGroupId) {
        this.dependencyGraph.removeDependency(groupId, group.parentGroupId);
        const oldParent = this.groups.get(group.parentGroupId);
        if (oldParent) {
          oldParent.children = oldParent.children.filter((id) => id !== groupId);
        }
      }

      // Add new parent dependency
      if (updates.parentGroupId) {
        this.dependencyGraph.addDependency(groupId, updates.parentGroupId);
        const newParent = this.groups.get(updates.parentGroupId);
        if (newParent && !newParent.children.includes(groupId)) {
          newParent.children.push(groupId);
        }
      }
    }

    // Validate before update
    if (this.config.validateHierarchy && updates.parentGroupId !== undefined) {
      // Check if update would create a cycle
      const tempGraph = new DependencyGraph<string>();
      this.dependencyGraph.getNodes().forEach((node) => {
        tempGraph.addNode(node);
        this.dependencyGraph.getDependencies(node).forEach((dep) => {
          if (node === groupId && dep === group.parentGroupId) {
            // Skip old parent dependency
            return;
          }
          tempGraph.addDependency(node, dep);
        });
      });

      // Add new parent dependency if specified
      if (updates.parentGroupId) {
        tempGraph.addDependency(groupId, updates.parentGroupId);
      }

      if (tempGraph.hasCycle()) {
        throw new Error(`Update would create a cycle in group hierarchy`);
      }
    }

    // Apply updates
    Object.assign(group, updates);

    // Recalculate levels if needed
    if (this.config.autoCalculateLevels && updates.parentGroupId !== undefined) {
      this.recalculateAllLevels();
    }
  }

  /**
   * Get a group by ID
   */
  getGroup(groupId: string): ColumnGroup | undefined {
    const group = this.groups.get(groupId);
    return group ? { ...group } : undefined;
  }

  /**
   * Get all groups
   */
  getAllGroups(): ColumnGroup[] {
    return Array.from(this.groups.values()).map((g) => ({ ...g }));
  }

  /**
   * Get root groups (groups without parents)
   */
  getRootGroups(): ColumnGroup[] {
    return this.getAllGroups().filter((g) => !g.parentGroupId);
  }

  /**
   * Get child groups of a parent
   */
  getChildGroups(parentGroupId: string): ColumnGroup[] {
    const parent = this.groups.get(parentGroupId);
    if (!parent) {
      return [];
    }
    return parent.children
      .map((childId) => this.groups.get(childId))
      .filter((g): g is ColumnGroup => g !== undefined)
      .map((g) => ({ ...g }));
  }

  /**
   * Get all descendant groups (recursive)
   */
  getDescendantGroups(groupId: string): ColumnGroup[] {
    const descendants: ColumnGroup[] = [];
    const queue = [groupId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = this.getChildGroups(currentId);
      descendants.push(...children);
      queue.push(...children.map((c) => c.groupId));
    }

    return descendants;
  }

  /**
   * Get ancestor groups (path to root)
   */
  getAncestorGroups(groupId: string): ColumnGroup[] {
    const ancestors: ColumnGroup[] = [];
    let currentId: string | null = groupId;

    while (currentId) {
      const group = this.groups.get(currentId);
      if (!group || !group.parentGroupId) {
        break;
      }
      const parent = this.groups.get(group.parentGroupId);
      if (parent) {
        ancestors.push({ ...parent });
      }
      currentId = group.parentGroupId;
    }

    return ancestors;
  }

  /**
   * Build hierarchy tree starting from root groups
   */
  buildHierarchyTree(): GroupNode[] {
    const rootGroups = this.getRootGroups();
    return rootGroups.map((group) => this.buildGroupNode(group, null, 0));
  }

  /**
   * Expand a group
   */
  expandGroup(groupId: string): void {
    const group = this.groups.get(groupId);
    if (group) {
      group.expanded = true;
    }
  }

  /**
   * Collapse a group
   */
  collapseGroup(groupId: string): void {
    const group = this.groups.get(groupId);
    if (group) {
      group.expanded = false;
    }
  }

  /**
   * Toggle group expansion state
   */
  toggleGroup(groupId: string): void {
    const group = this.groups.get(groupId);
    if (group) {
      group.expanded = !group.expanded;
    }
  }

  /**
   * Check if a group is expanded
   */
  isExpanded(groupId: string): boolean {
    return this.groups.get(groupId)?.expanded ?? true;
  }

  /**
   * Validate a group
   */
  validateGroup(group: ColumnGroup): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!group.groupId) {
      errors.push('groupId is required');
    }
    if (!group.headerName) {
      errors.push('headerName is required');
    }

    // Check for duplicate ID
    if (group.groupId && this.groups.has(group.groupId)) {
      errors.push(`Duplicate groupId: ${group.groupId}`);
    }

    // Check parent exists
    if (group.parentGroupId && !this.groups.has(group.parentGroupId)) {
      errors.push(`Parent group not found: ${group.parentGroupId}`);
    }

    // Check for self-reference
    if (group.groupId === group.parentGroupId) {
      errors.push('Group cannot be its own parent');
    }

    // Check max depth
    if (group.parentGroupId) {
      // Calculate depth based on parent's ancestors
      const parentAncestors = this.getAncestorGroups(group.parentGroupId);
      const depth = parentAncestors.length + 1; // +1 for the parent itself
      if (depth >= this.config.maxDepth) {
        errors.push(`Max depth exceeded: ${this.config.maxDepth}`);
      }
    }

    // Check if adding this group would create a cycle
    if (group.parentGroupId) {
      const tempGraph = new DependencyGraph<string>();
      this.dependencyGraph.getNodes().forEach((node) => {
        tempGraph.addNode(node);
        this.dependencyGraph.getDependencies(node).forEach((dep) => {
          tempGraph.addDependency(node, dep);
        });
      });
      tempGraph.addNode(group.groupId);
      if (group.parentGroupId) {
        tempGraph.addDependency(group.groupId, group.parentGroupId);
      }
      if (tempGraph.hasCycle()) {
        errors.push('Adding this group would create a cycle');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate entire hierarchy
   */
  validateHierarchy(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for cycles
    if (this.dependencyGraph.hasCycle()) {
      errors.push('Hierarchy contains cycles');
    }

    // Check for orphaned groups
    this.groups.forEach((group) => {
      if (group.parentGroupId && !this.groups.has(group.parentGroupId)) {
        errors.push(`Orphaned group: ${group.groupId} (parent ${group.parentGroupId} not found)`);
      }
    });

    // Check children consistency
    this.groups.forEach((group) => {
      group.children.forEach((childId) => {
        const child = this.groups.get(childId);
        if (!child) {
          warnings.push(`Group ${group.groupId} references non-existent child ${childId}`);
        } else if (child.parentGroupId !== group.groupId) {
          warnings.push(
            `Child ${childId} parent mismatch (expected ${group.groupId}, got ${child.parentGroupId})`
          );
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Clear all groups
   */
  clear(): void {
    this.groups.clear();
    this.dependencyGraph.clear();
  }

  /**
   * Get number of groups
   */
  size(): number {
    return this.groups.size;
  }

  // Private helper methods

  /**
   * Build a group node for hierarchy tree
   */
  private buildGroupNode(group: ColumnGroup, parent: GroupNode | null, depth: number): GroupNode {
    const node: GroupNode = {
      group: { ...group },
      parent,
      children: [],
      depth,
    };

    const children = this.getChildGroups(group.groupId);
    node.children = children.map((child) => this.buildGroupNode(child, node, depth + 1));

    return node;
  }

  /**
   * Calculate level for a single group
   */
  private calculateGroupLevel(groupId: string): void {
    const group = this.groups.get(groupId);
    if (!group) {
      return;
    }

    if (!group.parentGroupId) {
      group.level = 0;
    } else {
      const ancestors = this.getAncestorGroups(groupId);
      group.level = ancestors.length;
    }

    // Recursively calculate for children
    group.children.forEach((childId) => this.calculateGroupLevel(childId));
  }

  /**
   * Recalculate levels for all groups
   */
  private recalculateAllLevels(): void {
    const rootGroups = this.getRootGroups();
    rootGroups.forEach((group) => this.calculateGroupLevel(group.groupId));
  }
}
