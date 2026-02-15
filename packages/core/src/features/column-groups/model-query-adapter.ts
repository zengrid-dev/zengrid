import type { ColumnGroupModel } from './column-group-model';
import type { ColumnGroup } from './types';

/**
 * Configuration for model query adapter
 */
export interface ModelQueryAdapterConfig {
  model: ColumnGroupModel;
}

/**
 * Adapter for querying column group model
 * Provides read-only access to model data
 */
export class ModelQueryAdapter {
  constructor(private config: ModelQueryAdapterConfig) {}

  /**
   * Get a column group by ID
   */
  getGroup(groupId: string): ColumnGroup | undefined {
    return this.config.model.getGroup(groupId);
  }

  /**
   * Get all root groups (top-level)
   */
  getRootGroups(): ColumnGroup[] {
    return this.config.model.getRootGroups();
  }

  /**
   * Get all groups
   */
  getAllGroups(): ColumnGroup[] {
    return this.config.model.getAllGroups();
  }

  /**
   * Check if a group is expanded
   */
  isExpanded(groupId: string): boolean {
    return this.config.model.isExpanded(groupId);
  }

  /**
   * Get child groups of a group
   */
  getChildGroups(groupId: string): ColumnGroup[] {
    return this.config.model.getChildGroups(groupId);
  }

  /**
   * Get all descendant groups (recursive)
   */
  getDescendantGroups(groupId: string): ColumnGroup[] {
    return this.config.model.getDescendantGroups(groupId);
  }

  /**
   * Get ancestor groups (path to root)
   */
  getAncestorGroups(groupId: string): ColumnGroup[] {
    return this.config.model.getAncestorGroups(groupId);
  }

  /**
   * Build hierarchy tree
   */
  buildHierarchyTree(): any[] {
    return this.config.model.buildHierarchyTree();
  }
}
