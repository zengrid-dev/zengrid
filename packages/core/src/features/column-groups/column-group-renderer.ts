/**
 * Column Group Renderer - Renders column group headers with expand/collapse
 *
 * Features:
 * - Hierarchical column group headers
 * - Expand/collapse functionality
 * - Visual indicators for group state
 * - Keyboard navigation support
 * - Full ARIA accessibility
 * - Efficient event handling
 * - Multi-level nesting support
 */

import { ColumnGroup } from './types';
import { ColumnGroupModel } from './column-group-model';

/**
 * Parameters for rendering a column group header
 */
export interface ColumnGroupRenderParams {
  /** The column group to render */
  group: ColumnGroup;
  /** Reference to the column group model */
  model: ColumnGroupModel;
  /** Whether this is the root level */
  isRoot?: boolean;
  /** Callback when group is toggled */
  onToggle?: (groupId: string, expanded: boolean) => void;
  /** Custom CSS classes */
  className?: string;
  /** Context object for custom data */
  context?: any;
}

/**
 * Configuration options for ColumnGroupRenderer
 */
export interface ColumnGroupRendererOptions {
  /** Icon to show when group is expanded (default: '▼') */
  expandedIcon?: string;
  /** Icon to show when group is collapsed (default: '▶') */
  collapsedIcon?: string;
  /** Whether to show child count (default: true) */
  showChildCount?: boolean;
  /** Whether groups are collapsible (default: true) */
  collapsible?: boolean;
  /** Custom CSS class prefix */
  classPrefix?: string;
  /** Animation duration in ms (default: 200) */
  animationDuration?: number;
}

/**
 * ColumnGroupRenderer - Renders hierarchical column group headers
 *
 * This renderer is responsible for displaying column group headers with
 * expand/collapse functionality. It integrates with ColumnGroupModel to
 * manage group state and provides visual feedback for user interactions.
 *
 * @example
 * ```typescript
 * const model = new ColumnGroupModel();
 * model.addGroup({
 *   groupId: 'sales',
 *   headerName: 'Sales Department',
 *   parentGroupId: null,
 *   children: ['q1', 'q2'],
 *   columnFields: [],
 *   expanded: true
 * });
 *
 * const renderer = new ColumnGroupRenderer({
 *   expandedIcon: '▼',
 *   collapsedIcon: '▶',
 *   showChildCount: true
 * });
 *
 * const element = document.createElement('div');
 * renderer.render(element, {
 *   group: model.getGroup('sales')!,
 *   model: model,
 *   onToggle: (groupId, expanded) => {
 *     console.log(`Group ${groupId} is now ${expanded ? 'expanded' : 'collapsed'}`);
 *   }
 * });
 * ```
 */
export class ColumnGroupRenderer {
  private options: Required<ColumnGroupRendererOptions>;
  private eventHandlers: Map<HTMLElement, Map<string, EventListener>>;

  /**
   * Creates a new ColumnGroupRenderer instance
   *
   * @param options - Configuration options for the renderer
   */
  constructor(options: ColumnGroupRendererOptions = {}) {
    this.options = {
      expandedIcon: '▼',
      collapsedIcon: '▶',
      showChildCount: true,
      collapsible: true,
      classPrefix: 'zengrid',
      animationDuration: 200,
      ...options,
    };
    this.eventHandlers = new Map();
  }

  /**
   * Render a column group header
   *
   * @param element - The DOM element to render into
   * @param params - Render parameters including group and model
   */
  render(element: HTMLElement, params: ColumnGroupRenderParams): void {
    // Clear existing content
    element.innerHTML = '';

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = this.getWrapperClasses(params);

    // Set data attributes for debugging and testing
    wrapper.setAttribute('data-group-id', params.group.groupId);
    wrapper.setAttribute('data-level', String(params.group.level ?? 0));
    wrapper.setAttribute('data-expanded', String(params.model.isExpanded(params.group.groupId)));

    // Create expand/collapse icon (if collapsible and has children)
    const hasChildren = params.group.children.length > 0;
    const hasColumns = params.group.columnFields.length > 0;

    if (this.options.collapsible && hasChildren) {
      const icon = this.createExpandIcon(params);
      wrapper.appendChild(icon);
    } else {
      // Add spacing for alignment
      const spacer = document.createElement('span');
      spacer.className = `${this.options.classPrefix}-column-group-spacer`;
      spacer.style.width = '20px';
      spacer.style.display = 'inline-block';
      wrapper.appendChild(spacer);
    }

    // Create header text
    const header = this.createHeaderText(params);
    wrapper.appendChild(header);

    // Add child count badge (if enabled and has children or columns)
    if (this.options.showChildCount && (hasChildren || hasColumns)) {
      const badge = this.createChildCountBadge(params);
      wrapper.appendChild(badge);
    }

    // Apply ARIA attributes
    this.applyAriaAttributes(wrapper, params);

    // Add click handler for toggle (if collapsible)
    if (this.options.collapsible && hasChildren) {
      const handlers = this.setupEventHandlers(wrapper, params);
      this.eventHandlers.set(element, handlers);
    }

    // Apply basic styles
    this.applyStyles(wrapper, params);

    element.appendChild(wrapper);
  }

  /**
   * Create the expand/collapse icon element
   */
  private createExpandIcon(params: ColumnGroupRenderParams): HTMLElement {
    const icon = document.createElement('span');
    icon.className = `${this.options.classPrefix}-column-group-icon`;

    const expanded = params.model.isExpanded(params.group.groupId);
    icon.textContent = expanded ? this.options.expandedIcon : this.options.collapsedIcon;

    icon.style.cursor = 'pointer';
    icon.style.userSelect = 'none';
    icon.style.display = 'inline-block';
    icon.style.width = '20px';
    icon.style.textAlign = 'center';
    icon.style.transition = `transform ${this.options.animationDuration}ms ease`;

    return icon;
  }

  /**
   * Create the header text element
   */
  private createHeaderText(params: ColumnGroupRenderParams): HTMLElement {
    const header = document.createElement('span');
    header.className = `${this.options.classPrefix}-column-group-header`;
    header.textContent = params.group.headerName;

    header.style.fontWeight = '600';
    header.style.fontSize = '14px';
    header.style.marginLeft = '4px';
    header.style.userSelect = 'none';

    return header;
  }

  /**
   * Create child count badge
   */
  private createChildCountBadge(params: ColumnGroupRenderParams): HTMLElement {
    const badge = document.createElement('span');
    badge.className = `${this.options.classPrefix}-column-group-badge`;

    const childCount = params.group.children.length;
    const columnCount = params.group.columnFields.length;

    // If no children, show column count directly
    if (childCount === 0 && columnCount > 0) {
      badge.textContent = String(columnCount);
    } else {
      const totalCount = this.getTotalDescendantCount(params);
      badge.textContent = totalCount > 0 ? String(totalCount) : String(childCount);
    }

    badge.style.marginLeft = '8px';
    badge.style.padding = '2px 6px';
    badge.style.borderRadius = '10px';
    badge.style.backgroundColor = '#e3f2fd';
    badge.style.color = '#1976d2';
    badge.style.fontSize = '11px';
    badge.style.fontWeight = '600';
    badge.style.userSelect = 'none';

    return badge;
  }

  /**
   * Get total count of all descendants (children + columns)
   */
  private getTotalDescendantCount(params: ColumnGroupRenderParams): number {
    const descendants = params.model.getDescendantGroups(params.group.groupId);
    const childCount = descendants.length;
    const columnCount = params.group.columnFields.length;

    // Count all columns in descendants
    let totalColumns = columnCount;
    descendants.forEach((desc) => {
      totalColumns += desc.columnFields.length;
    });

    return totalColumns > 0 ? totalColumns : childCount;
  }

  /**
   * Get wrapper CSS classes
   */
  private getWrapperClasses(params: ColumnGroupRenderParams): string {
    const classes = [`${this.options.classPrefix}-column-group`];

    const level = params.group.level ?? 0;
    classes.push(`${this.options.classPrefix}-column-group-level-${level}`);

    if (params.isRoot) {
      classes.push(`${this.options.classPrefix}-column-group-root`);
    }

    const expanded = params.model.isExpanded(params.group.groupId);
    classes.push(
      expanded
        ? `${this.options.classPrefix}-column-group-expanded`
        : `${this.options.classPrefix}-column-group-collapsed`
    );

    if (params.group.children.length === 0) {
      classes.push(`${this.options.classPrefix}-column-group-leaf`);
    }

    if (params.className) {
      classes.push(params.className);
    }

    if (params.group.cssClasses) {
      classes.push(...params.group.cssClasses);
    }

    return classes.join(' ');
  }

  /**
   * Apply ARIA attributes for accessibility
   */
  private applyAriaAttributes(element: HTMLElement, params: ColumnGroupRenderParams): void {
    // Set role
    element.setAttribute('role', 'columnheader');

    // Set aria-label
    const label = `${params.group.headerName} column group`;
    element.setAttribute('aria-label', label);

    // Set aria-level for nesting
    const level = (params.group.level ?? 0) + 1;
    element.setAttribute('aria-level', String(level));

    // Set aria-expanded if collapsible
    if (this.options.collapsible && params.group.children.length > 0) {
      const expanded = params.model.isExpanded(params.group.groupId);
      element.setAttribute('aria-expanded', String(expanded));
    }

    // Set tabindex for keyboard navigation
    if (this.options.collapsible && params.group.children.length > 0) {
      element.setAttribute('tabindex', '0');
    }
  }

  /**
   * Setup event handlers for toggle functionality
   */
  private setupEventHandlers(
    element: HTMLElement,
    params: ColumnGroupRenderParams
  ): Map<string, EventListener> {
    const handlers = new Map<string, EventListener>();

    // Click handler
    const clickHandler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleGroup(element, params);
    };
    element.addEventListener('click', clickHandler);
    handlers.set('click', clickHandler);

    // Keyboard handler (Enter or Space to toggle)
    const keyHandler = (e: Event) => {
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        this.toggleGroup(element, params);
      }
    };
    element.addEventListener('keydown', keyHandler);
    handlers.set('keydown', keyHandler);

    return handlers;
  }

  /**
   * Toggle group expansion state
   */
  private toggleGroup(element: HTMLElement, params: ColumnGroupRenderParams): void {
    const groupId = params.group.groupId;
    const wasExpanded = params.model.isExpanded(groupId);

    // Toggle in model
    params.model.toggleGroup(groupId);
    const isExpanded = params.model.isExpanded(groupId);

    // Update icon
    const icon = element.querySelector(`.${this.options.classPrefix}-column-group-icon`);
    if (icon) {
      icon.textContent = isExpanded ? this.options.expandedIcon : this.options.collapsedIcon;
    }

    // Update aria-expanded
    element.setAttribute('aria-expanded', String(isExpanded));

    // Update data attribute
    element.setAttribute('data-expanded', String(isExpanded));

    // Update CSS classes
    element.classList.remove(
      `${this.options.classPrefix}-column-group-${wasExpanded ? 'expanded' : 'collapsed'}`
    );
    element.classList.add(
      `${this.options.classPrefix}-column-group-${isExpanded ? 'expanded' : 'collapsed'}`
    );

    // Call onToggle callback if provided
    if (params.onToggle) {
      params.onToggle(groupId, isExpanded);
    }
  }

  /**
   * Apply basic styles to the wrapper
   */
  private applyStyles(element: HTMLElement, params: ColumnGroupRenderParams): void {
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.padding = '8px 12px';
    element.style.backgroundColor = '#f5f5f5';
    element.style.borderBottom = '1px solid #ddd';
    element.style.cursor =
      this.options.collapsible && params.group.children.length > 0 ? 'pointer' : 'default';
    element.style.userSelect = 'none';

    // Add level-based indentation
    const level = params.group.level ?? 0;
    if (level > 0) {
      element.style.paddingLeft = `${12 + level * 16}px`;
    }

    // Add hover effect if collapsible
    if (this.options.collapsible && params.group.children.length > 0) {
      element.addEventListener('mouseenter', () => {
        element.style.backgroundColor = '#e8e8e8';
      });
      element.addEventListener('mouseleave', () => {
        element.style.backgroundColor = '#f5f5f5';
      });
    }
  }

  /**
   * Render multiple column groups
   *
   * Useful for rendering all groups in a hierarchy
   */
  renderGroups(
    container: HTMLElement,
    groups: ColumnGroup[],
    model: ColumnGroupModel,
    onToggle?: (groupId: string, expanded: boolean) => void
  ): void {
    // Helper function to recursively render group and children
    const renderGroupRecursive = (group: ColumnGroup) => {
      const groupElement = document.createElement('div');
      this.render(groupElement, {
        group,
        model,
        onToggle,
      });
      container.appendChild(groupElement);

      // Render children if expanded
      if (model.isExpanded(group.groupId)) {
        const children = model.getChildGroups(group.groupId);
        children.forEach((child) => renderGroupRecursive(child));
      }
    };

    // Clear container and render all groups
    container.innerHTML = '';
    groups.forEach((group) => renderGroupRecursive(group));
  }

  /**
   * Clean up resources when the renderer is destroyed
   */
  destroy(): void {
    // Remove all event listeners
    this.eventHandlers.forEach((handlers, element) => {
      const wrapper = element.firstChild as HTMLElement;
      if (wrapper) {
        handlers.forEach((handler, eventType) => {
          wrapper.removeEventListener(eventType, handler);
        });
      }
    });
    this.eventHandlers.clear();
  }
}

/**
 * Factory function to create a ColumnGroupRenderer instance
 *
 * @param options - Configuration options
 * @returns A new ColumnGroupRenderer instance
 *
 * @example
 * ```typescript
 * const renderer = createColumnGroupRenderer({
 *   expandedIcon: '−',
 *   collapsedIcon: '+',
 *   showChildCount: true
 * });
 * ```
 */
export function createColumnGroupRenderer(
  options?: ColumnGroupRendererOptions
): ColumnGroupRenderer {
  return new ColumnGroupRenderer(options);
}
