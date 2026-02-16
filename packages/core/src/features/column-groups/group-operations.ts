import type { EventEmitter } from '../../utils/event-emitter';
import type { ColumnGroupModel } from './column-group-model';
import type {
  ColumnGroup,
  ValidationResult,
  ColumnGroupManagerEvents,
} from './types';

/**
 * Configuration for group operations
 */
export interface GroupOperationsConfig {
  model: ColumnGroupModel;
  eventEmitter: EventEmitter<ColumnGroupManagerEvents>;
}

/**
 * Handles core group CRUD operations
 */
export class GroupOperations {
  constructor(private config: GroupOperationsConfig) {}

  /**
   * Add a column group
   */
  addGroup(group: ColumnGroup): void {
    const { model, eventEmitter } = this.config;

    model.addGroup(group);

    eventEmitter.emit('groupAdded', {
      group: model.getGroup(group.groupId)!,
      timestamp: Date.now(),
    });

    this.emitHierarchyChanged([group.groupId]);
  }

  /**
   * Remove a column group
   */
  removeGroup(groupId: string, removeChildren: boolean = false): void {
    const { model, eventEmitter } = this.config;
    const group = model.getGroup(groupId);
    if (!group) {
      return;
    }

    const affectedIds = [groupId];
    if (removeChildren) {
      const descendants = model.getDescendantGroups(groupId);
      affectedIds.push(...descendants.map((g) => g.groupId));
    }

    model.removeGroup(groupId, removeChildren);

    eventEmitter.emit('groupRemoved', {
      groupId,
      group,
      timestamp: Date.now(),
    });

    this.emitHierarchyChanged(affectedIds);
  }

  /**
   * Update a column group
   */
  updateGroup(groupId: string, updates: Partial<ColumnGroup>): void {
    const { model, eventEmitter } = this.config;
    const oldGroup = model.getGroup(groupId);
    if (!oldGroup) {
      throw new Error(`Group not found: ${groupId}`);
    }

    model.updateGroup(groupId, updates);

    const newGroup = model.getGroup(groupId)!;

    eventEmitter.emit('groupUpdated', {
      groupId,
      oldGroup,
      newGroup,
      timestamp: Date.now(),
    });

    if (updates.parentGroupId !== undefined) {
      const affectedIds = [groupId];
      const descendants = model.getDescendantGroups(groupId);
      affectedIds.push(...descendants.map((g) => g.groupId));
      this.emitHierarchyChanged(affectedIds);
    }
  }

  /**
   * Expand a column group
   */
  expandGroup(groupId: string): void {
    const { model, eventEmitter } = this.config;
    model.expandGroup(groupId);

    eventEmitter.emit('groupToggled', {
      groupId,
      expanded: true,
      timestamp: Date.now(),
    });
  }

  /**
   * Collapse a column group
   */
  collapseGroup(groupId: string): void {
    const { model, eventEmitter } = this.config;
    model.collapseGroup(groupId);

    eventEmitter.emit('groupToggled', {
      groupId,
      expanded: false,
      timestamp: Date.now(),
    });
  }

  /**
   * Toggle group expansion
   */
  toggleGroup(groupId: string): void {
    const { model, eventEmitter } = this.config;
    const group = model.getGroup(groupId);
    if (!group) {
      return;
    }

    model.toggleGroup(groupId);

    const newExpanded = model.isExpanded(groupId);

    eventEmitter.emit('groupToggled', {
      groupId,
      expanded: newExpanded,
      timestamp: Date.now(),
    });
  }

  /**
   * Validate a group before adding
   */
  validateGroup(group: ColumnGroup): ValidationResult {
    return this.config.model.validateGroup(group);
  }

  /**
   * Validate the entire hierarchy
   */
  validateHierarchy(): ValidationResult {
    return this.config.model.validateHierarchy();
  }

  /**
   * Emit hierarchy changed event
   */
  private emitHierarchyChanged(affectedGroupIds: string[]): void {
    this.config.eventEmitter.emit('hierarchyChanged', {
      affectedGroupIds,
      timestamp: Date.now(),
    });
  }
}
