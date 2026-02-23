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
import { ColumnGroupRenderer } from './column-group-renderer';
import { ColumnGroup, ColumnGroupManagerEvents, ValidationResult } from './types';
import { IRendererRegistry } from './renderer-registry';
import {
  ColumnGroupManagerOptions,
  InternalColumnGroupManagerOptions,
  createInternalOptions,
  initializeRenderer,
} from './manager-options';
import { GroupOperations, GroupOperationsConfig } from './group-operations';
import { GroupRendererController, RendererControllerConfig } from './group-renderer-controller';
import { ModelQueryAdapter, ModelQueryAdapterConfig } from './model-query-adapter';
import {
  EventSubscriptionManager,
  EventSubscriptionManagerConfig,
} from './event-subscription-manager';

export type { ColumnGroupManagerOptions };

/**
 * Manages column groups with reactive state and event notifications
 *
 * Coordinates between ColumnGroupModel (data/hierarchy) and
 * ColumnGroupRenderer (visual representation) with event-driven updates.
 */
export class ColumnGroupManager {
  private eventEmitter: EventEmitter<ColumnGroupManagerEvents>;
  private model: ColumnGroupModel;
  private renderer: ColumnGroupRenderer | null = null;
  private options: InternalColumnGroupManagerOptions;
  private rendererRegistry: IRendererRegistry;

  private operations: GroupOperations;
  private rendererController: GroupRendererController;
  private queryAdapter: ModelQueryAdapter;
  private subscriptionManager: EventSubscriptionManager;

  /**
   * Create a new column group manager
   *
   * @param options - Configuration options
   */
  constructor(options: ColumnGroupManagerOptions = {}) {
    this.eventEmitter = new EventEmitter<ColumnGroupManagerEvents>();
    this.model = new ColumnGroupModel(options.modelConfig);

    this.options = createInternalOptions(options);
    this.rendererRegistry = this.options.rendererRegistry;

    this.renderer = initializeRenderer({
      rendererName: this.options.rendererName,
      rendererConfig: this.options.rendererConfig,
      rendererRegistry: this.rendererRegistry,
    });

    // Initialize adapters
    const operationsConfig: GroupOperationsConfig = {
      model: this.model,
      eventEmitter: this.eventEmitter,
    };
    this.operations = new GroupOperations(operationsConfig);

    this.rendererController = new GroupRendererController(this.createRendererControllerConfig());

    const queryConfig: ModelQueryAdapterConfig = {
      model: this.model,
    };
    this.queryAdapter = new ModelQueryAdapter(queryConfig);

    const subscriptionConfig: EventSubscriptionManagerConfig = {
      eventEmitter: this.eventEmitter,
    };
    this.subscriptionManager = new EventSubscriptionManager(subscriptionConfig);
  }

  /**
   * Get the column group model
   */
  getModel(): ColumnGroupModel {
    return this.model;
  }

  /**
   * Get the column group renderer
   */
  getRenderer(): ColumnGroupRenderer | null {
    return this.renderer;
  }

  /**
   * Get the renderer registry being used
   */
  getRendererRegistry(): IRendererRegistry {
    return this.rendererRegistry;
  }

  /**
   * Set a custom renderer
   */
  setRenderer(renderer: ColumnGroupRenderer | null): void {
    if (this.renderer) {
      this.renderer.destroy();
    }

    this.renderer = renderer;

    // Update renderer controller
    this.rendererController = new GroupRendererController(this.createRendererControllerConfig());
  }

  /**
   * Add a column group
   */
  addGroup(group: ColumnGroup): void {
    this.operations.addGroup(group);
  }

  /**
   * Remove a column group
   */
  removeGroup(groupId: string, removeChildren: boolean = false): void {
    this.operations.removeGroup(groupId, removeChildren);
  }

  /**
   * Update a column group
   */
  updateGroup(groupId: string, updates: Partial<ColumnGroup>): void {
    this.operations.updateGroup(groupId, updates);
  }

  /**
   * Get a column group by ID
   */
  getGroup(groupId: string): ColumnGroup | undefined {
    return this.queryAdapter.getGroup(groupId);
  }

  /**
   * Get all root groups (top-level)
   */
  getRootGroups(): ColumnGroup[] {
    return this.queryAdapter.getRootGroups();
  }

  /**
   * Get all groups
   */
  getAllGroups(): ColumnGroup[] {
    return this.queryAdapter.getAllGroups();
  }

  /**
   * Expand a column group
   */
  expandGroup(groupId: string): void {
    this.operations.expandGroup(groupId);
  }

  /**
   * Collapse a column group
   */
  collapseGroup(groupId: string): void {
    this.operations.collapseGroup(groupId);
  }

  /**
   * Toggle group expansion
   */
  toggleGroup(groupId: string): void {
    this.operations.toggleGroup(groupId);
  }

  /**
   * Check if a group is expanded
   */
  isExpanded(groupId: string): boolean {
    return this.queryAdapter.isExpanded(groupId);
  }

  /**
   * Get child groups of a group
   */
  getChildGroups(groupId: string): ColumnGroup[] {
    return this.queryAdapter.getChildGroups(groupId);
  }

  /**
   * Get all descendant groups (recursive)
   */
  getDescendantGroups(groupId: string): ColumnGroup[] {
    return this.queryAdapter.getDescendantGroups(groupId);
  }

  /**
   * Get ancestor groups (path to root)
   */
  getAncestorGroups(groupId: string): ColumnGroup[] {
    return this.queryAdapter.getAncestorGroups(groupId);
  }

  /**
   * Build hierarchy tree
   */
  buildHierarchyTree(): any[] {
    return this.queryAdapter.buildHierarchyTree();
  }

  /**
   * Validate a group before adding
   */
  validateGroup(group: ColumnGroup): ValidationResult {
    return this.operations.validateGroup(group);
  }

  /**
   * Validate the entire hierarchy
   */
  validateHierarchy(): ValidationResult {
    return this.operations.validateHierarchy();
  }

  /**
   * Render a group using the configured renderer
   */
  renderGroup(
    element: HTMLElement,
    groupId: string,
    onToggle?: (groupId: string, expanded: boolean) => void
  ): void {
    this.rendererController.renderGroup(element, groupId, onToggle);
  }

  /**
   * Render multiple groups
   */
  renderGroups(
    element: HTMLElement,
    groupIds: string[],
    onToggle?: (groupId: string, expanded: boolean) => void
  ): void {
    this.rendererController.renderGroups(element, groupIds, onToggle);
  }

  /**
   * Subscribe to an event
   */
  on<K extends keyof ColumnGroupManagerEvents>(
    event: K,
    listener: (data: ColumnGroupManagerEvents[K]) => void
  ): () => void {
    return this.subscriptionManager.on(event, listener);
  }

  /**
   * Subscribe to an event (one-time)
   */
  once<K extends keyof ColumnGroupManagerEvents>(
    event: K,
    listener: (data: ColumnGroupManagerEvents[K]) => void
  ): () => void {
    return this.subscriptionManager.once(event, listener);
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof ColumnGroupManagerEvents>(
    event: K,
    listener: (data: ColumnGroupManagerEvents[K]) => void
  ): void {
    this.subscriptionManager.off(event, listener);
  }

  /**
   * Remove all listeners for an event or all events
   */
  removeAllListeners(event?: keyof ColumnGroupManagerEvents): void {
    this.subscriptionManager.removeAllListeners(event);
  }

  private createRendererControllerConfig(): RendererControllerConfig {
    return {
      model: this.model,
      renderer: this.renderer,
      onExpand: (groupId: string) => this.expandGroup(groupId),
      onCollapse: (groupId: string) => this.collapseGroup(groupId),
    };
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
}
