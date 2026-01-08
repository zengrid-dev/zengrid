/**
 * ColumnGroupManager - Coordinates column groups with reactive updates
 *
 * Manages column group state with event-driven notifications.
 * Integrates ColumnGroupModel and ColumnGroupRenderer for complete group management.
 *
 * Features:
 * - Reactive state updates with event notifications
 * - Integration with ColumnGroupModel for hierarchy management
 * - Group operations (add, remove, update, toggle)
 * - Event-driven architecture for UI updates
 * - Memory-efficient with proper cleanup
 *
 * Events:
 * - 'groupAdded': Emitted when a group is added
 * - 'groupRemoved': Emitted when a group is removed
 * - 'groupUpdated': Emitted when a group is updated
 * - 'groupToggled': Emitted when a group is expanded/collapsed
 * - 'hierarchyChanged': Emitted when the hierarchy structure changes
 */

import { EventEmitter } from '../../utils/event-emitter';
import { ColumnGroupModel } from './column-group-model';
import { ColumnGroupRenderer, ColumnGroupRendererOptions } from './column-group-renderer';
import { ColumnGroup, ColumnGroupModelConfig, ValidationResult } from './types';
import { globalRendererRegistry, IRendererRegistry } from './renderer-registry';

/**
 * Event payloads for ColumnGroupManager events
 */
export interface GroupAddedEvent {
  group: ColumnGroup;
  timestamp: number;
}

export interface GroupRemovedEvent {
  groupId: string;
  group: ColumnGroup;
  timestamp: number;
}

export interface GroupUpdatedEvent {
  groupId: string;
  oldGroup: ColumnGroup;
  newGroup: ColumnGroup;
  timestamp: number;
}

export interface GroupToggledEvent {
  groupId: string;
  expanded: boolean;
  timestamp: number;
}

export interface HierarchyChangedEvent {
  affectedGroupIds: string[];
  timestamp: number;
}

/**
 * Event map for ColumnGroupManager
 */
export interface ColumnGroupManagerEvents {
  groupAdded: GroupAddedEvent;
  groupRemoved: GroupRemovedEvent;
  groupUpdated: GroupUpdatedEvent;
  groupToggled: GroupToggledEvent;
  hierarchyChanged: HierarchyChangedEvent;
}

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
 * Manages column groups with reactive state and event notifications
 *
 * Coordinates between ColumnGroupModel (data/hierarchy) and
 * ColumnGroupRenderer (visual representation) with event-driven updates.
 */
/**
 * Internal options type with required fields
 */
interface InternalColumnGroupManagerOptions {
  modelConfig: ColumnGroupModelConfig;
  rendererConfig: ColumnGroupRendererOptions;
  rendererName?: string;
  rendererRegistry: IRendererRegistry;
  autoRender: boolean;
}

export class ColumnGroupManager {
  private eventEmitter: EventEmitter<ColumnGroupManagerEvents>;
  private model: ColumnGroupModel;
  private renderer: ColumnGroupRenderer | null = null;
  private options: InternalColumnGroupManagerOptions;
  private rendererRegistry: IRendererRegistry;

  /**
   * Create a new column group manager
   *
   * @param options - Configuration options
   */
  constructor(options: ColumnGroupManagerOptions = {}) {
    this.eventEmitter = new EventEmitter<ColumnGroupManagerEvents>();
    this.model = new ColumnGroupModel(options.modelConfig);

    // Use custom registry or default to global
    this.rendererRegistry = options.rendererRegistry || globalRendererRegistry;

    this.options = {
      modelConfig: options.modelConfig || {},
      rendererConfig: options.rendererConfig || {},
      rendererName: options.rendererName,
      rendererRegistry: this.rendererRegistry,
      autoRender: options.autoRender ?? true,
    };

    // Create renderer based on options priority:
    // 1. Use rendererName to lookup from registry
    // 2. Use rendererConfig to create directly
    // 3. Use default renderer from registry
    if (this.options.rendererName) {
      const renderer = this.rendererRegistry.get(
        this.options.rendererName,
        this.options.rendererConfig
      );
      if (!renderer) {
        throw new Error(`Renderer "${this.options.rendererName}" not found in registry`);
      }
      this.renderer = renderer;
    } else if (this.options.rendererConfig && Object.keys(this.options.rendererConfig).length > 0) {
      this.renderer = new ColumnGroupRenderer(this.options.rendererConfig);
    } else {
      // Use default renderer from registry
      this.renderer = this.rendererRegistry.getDefaultRenderer();
    }
  }

  /**
   * Get the column group model
   *
   * @returns Column group model instance
   */
  getModel(): ColumnGroupModel {
    return this.model;
  }

  /**
   * Get the column group renderer
   *
   * @returns Column group renderer instance or null
   */
  getRenderer(): ColumnGroupRenderer | null {
    return this.renderer;
  }

  /**
   * Get the renderer registry being used
   *
   * @returns Renderer registry instance
   */
  getRendererRegistry(): IRendererRegistry {
    return this.rendererRegistry;
  }

  /**
   * Set a custom renderer
   *
   * @param renderer - Custom renderer instance
   */
  setRenderer(renderer: ColumnGroupRenderer | null): void {
    // Cleanup old renderer
    if (this.renderer) {
      this.renderer.destroy();
    }

    this.renderer = renderer;
  }

  /**
   * Add a column group
   *
   * @param group - Column group to add
   * @throws Error if validation fails
   */
  addGroup(group: ColumnGroup): void {
    // Add to model (will throw if invalid)
    this.model.addGroup(group);

    // Emit event
    this.eventEmitter.emit('groupAdded', {
      group: this.model.getGroup(group.groupId)!,
      timestamp: Date.now(),
    });

    // Emit hierarchy changed event
    this.emitHierarchyChanged([group.groupId]);
  }

  /**
   * Remove a column group
   *
   * @param groupId - Group ID to remove
   * @param removeChildren - Whether to remove child groups (default: false)
   */
  removeGroup(groupId: string, removeChildren: boolean = false): void {
    const group = this.model.getGroup(groupId);
    if (!group) {
      return;
    }

    // Collect affected group IDs before removal
    const affectedIds = [groupId];
    if (removeChildren) {
      const descendants = this.model.getDescendantGroups(groupId);
      affectedIds.push(...descendants.map((g) => g.groupId));
    }

    // Remove from model
    this.model.removeGroup(groupId, removeChildren);

    // Emit event
    this.eventEmitter.emit('groupRemoved', {
      groupId,
      group,
      timestamp: Date.now(),
    });

    // Emit hierarchy changed event
    this.emitHierarchyChanged(affectedIds);
  }

  /**
   * Update a column group
   *
   * @param groupId - Group ID to update
   * @param updates - Partial group updates
   * @throws Error if validation fails
   */
  updateGroup(groupId: string, updates: Partial<ColumnGroup>): void {
    const oldGroup = this.model.getGroup(groupId);
    if (!oldGroup) {
      throw new Error(`Group not found: ${groupId}`);
    }

    // Update in model
    this.model.updateGroup(groupId, updates);

    const newGroup = this.model.getGroup(groupId)!;

    // Emit event
    this.eventEmitter.emit('groupUpdated', {
      groupId,
      oldGroup,
      newGroup,
      timestamp: Date.now(),
    });

    // If parent changed, emit hierarchy changed
    if (updates.parentGroupId !== undefined) {
      const affectedIds = [groupId];
      const descendants = this.model.getDescendantGroups(groupId);
      affectedIds.push(...descendants.map((g) => g.groupId));
      this.emitHierarchyChanged(affectedIds);
    }
  }

  /**
   * Get a column group by ID
   *
   * @param groupId - Group ID
   * @returns Column group or undefined
   */
  getGroup(groupId: string): ColumnGroup | undefined {
    return this.model.getGroup(groupId);
  }

  /**
   * Get all root groups (top-level)
   *
   * @returns Array of root groups
   */
  getRootGroups(): ColumnGroup[] {
    return this.model.getRootGroups();
  }

  /**
   * Get all groups
   *
   * @returns Array of all groups
   */
  getAllGroups(): ColumnGroup[] {
    return this.model.getAllGroups();
  }

  /**
   * Expand a column group
   *
   * @param groupId - Group ID to expand
   */
  expandGroup(groupId: string): void {
    this.model.expandGroup(groupId);

    this.eventEmitter.emit('groupToggled', {
      groupId,
      expanded: true,
      timestamp: Date.now(),
    });
  }

  /**
   * Collapse a column group
   *
   * @param groupId - Group ID to collapse
   */
  collapseGroup(groupId: string): void {
    this.model.collapseGroup(groupId);

    this.eventEmitter.emit('groupToggled', {
      groupId,
      expanded: false,
      timestamp: Date.now(),
    });
  }

  /**
   * Toggle group expansion
   *
   * @param groupId - Group ID to toggle
   */
  toggleGroup(groupId: string): void {
    const group = this.model.getGroup(groupId);
    if (!group) {
      return;
    }

    this.model.toggleGroup(groupId);

    const newExpanded = this.model.isExpanded(groupId);

    this.eventEmitter.emit('groupToggled', {
      groupId,
      expanded: newExpanded,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if a group is expanded
   *
   * @param groupId - Group ID to check
   * @returns Whether the group is expanded
   */
  isExpanded(groupId: string): boolean {
    return this.model.isExpanded(groupId);
  }

  /**
   * Get child groups of a group
   *
   * @param groupId - Parent group ID
   * @returns Array of child groups
   */
  getChildGroups(groupId: string): ColumnGroup[] {
    return this.model.getChildGroups(groupId);
  }

  /**
   * Get all descendant groups (recursive)
   *
   * @param groupId - Parent group ID
   * @returns Array of descendant groups
   */
  getDescendantGroups(groupId: string): ColumnGroup[] {
    return this.model.getDescendantGroups(groupId);
  }

  /**
   * Get ancestor groups (path to root)
   *
   * @param groupId - Group ID
   * @returns Array of ancestor groups (bottom-up)
   */
  getAncestorGroups(groupId: string): ColumnGroup[] {
    return this.model.getAncestorGroups(groupId);
  }

  /**
   * Build hierarchy tree
   *
   * @returns Root nodes of the hierarchy tree
   */
  buildHierarchyTree(): any[] {
    return this.model.buildHierarchyTree();
  }

  /**
   * Validate a group before adding
   *
   * @param group - Group to validate
   * @returns Validation result
   */
  validateGroup(group: ColumnGroup): ValidationResult {
    return this.model.validateGroup(group);
  }

  /**
   * Validate the entire hierarchy
   *
   * @returns Validation result
   */
  validateHierarchy(): ValidationResult {
    return this.model.validateHierarchy();
  }

  /**
   * Render a group using the configured renderer
   *
   * @param element - HTML element to render into
   * @param groupId - Group ID to render
   * @param onToggle - Optional callback for toggle events
   */
  renderGroup(element: HTMLElement, groupId: string, onToggle?: (groupId: string, expanded: boolean) => void): void {
    if (!this.renderer) {
      throw new Error('No renderer configured');
    }

    const group = this.model.getGroup(groupId);
    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }

    // Default onToggle handler that uses the manager
    const toggleHandler = onToggle || ((gId: string, expanded: boolean) => {
      if (expanded) {
        this.expandGroup(gId);
      } else {
        this.collapseGroup(gId);
      }
    });

    this.renderer.render(element, {
      group,
      model: this.model,
      onToggle: toggleHandler,
    });
  }

  /**
   * Render multiple groups
   *
   * @param element - HTML element to render into
   * @param groupIds - Array of group IDs to render
   * @param onToggle - Optional callback for toggle events
   */
  renderGroups(element: HTMLElement, groupIds: string[], onToggle?: (groupId: string, expanded: boolean) => void): void {
    if (!this.renderer) {
      throw new Error('No renderer configured');
    }

    const groups = groupIds.map((id) => this.model.getGroup(id)).filter((g): g is ColumnGroup => g !== undefined);

    // Default onToggle handler
    const toggleHandler = onToggle || ((gId: string, expanded: boolean) => {
      if (expanded) {
        this.expandGroup(gId);
      } else {
        this.collapseGroup(gId);
      }
    });

    this.renderer.renderGroups(element, groups, this.model, toggleHandler);
  }

  /**
   * Subscribe to an event
   *
   * @param event - Event name
   * @param listener - Event listener
   * @returns Unsubscribe function
   */
  on<K extends keyof ColumnGroupManagerEvents>(
    event: K,
    listener: (data: ColumnGroupManagerEvents[K]) => void
  ): () => void {
    return this.eventEmitter.on(event, listener);
  }

  /**
   * Subscribe to an event (one-time)
   *
   * @param event - Event name
   * @param listener - Event listener
   * @returns Unsubscribe function
   */
  once<K extends keyof ColumnGroupManagerEvents>(
    event: K,
    listener: (data: ColumnGroupManagerEvents[K]) => void
  ): () => void {
    return this.eventEmitter.once(event, listener);
  }

  /**
   * Unsubscribe from an event
   *
   * @param event - Event name
   * @param listener - Event listener to remove
   */
  off<K extends keyof ColumnGroupManagerEvents>(
    event: K,
    listener: (data: ColumnGroupManagerEvents[K]) => void
  ): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Remove all listeners for an event or all events
   *
   * @param event - Optional event name
   */
  removeAllListeners(event?: keyof ColumnGroupManagerEvents): void {
    this.eventEmitter.removeAllListeners(event);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.renderer) {
      this.renderer.destroy();
    }
    this.eventEmitter.removeAllListeners();
  }

  /**
   * Emit hierarchy changed event
   *
   * @param affectedGroupIds - IDs of affected groups
   */
  private emitHierarchyChanged(affectedGroupIds: string[]): void {
    this.eventEmitter.emit('hierarchyChanged', {
      affectedGroupIds,
      timestamp: Date.now(),
    });
  }
}
