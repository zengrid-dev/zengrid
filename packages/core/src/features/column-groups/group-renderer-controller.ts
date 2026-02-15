import type { ColumnGroupModel } from './column-group-model';
import type { ColumnGroupRenderer } from './column-group-renderer';
import type { ColumnGroup } from './types';

/**
 * Configuration for renderer controller
 */
export interface RendererControllerConfig {
  model: ColumnGroupModel;
  renderer: ColumnGroupRenderer | null;
  onExpand: (groupId: string) => void;
  onCollapse: (groupId: string) => void;
}

/**
 * Controls rendering operations for column groups
 */
export class GroupRendererController {
  constructor(private config: RendererControllerConfig) {}

  /**
   * Render a single group
   */
  renderGroup(
    element: HTMLElement,
    groupId: string,
    onToggle?: (groupId: string, expanded: boolean) => void
  ): void {
    const { model, renderer, onExpand, onCollapse } = this.config;

    if (!renderer) {
      throw new Error('No renderer configured');
    }

    const group = model.getGroup(groupId);
    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }

    const toggleHandler =
      onToggle ||
      ((gId: string, expanded: boolean) => {
        if (expanded) {
          onExpand(gId);
        } else {
          onCollapse(gId);
        }
      });

    renderer.render(element, {
      group,
      model,
      onToggle: toggleHandler,
    });
  }

  /**
   * Render multiple groups
   */
  renderGroups(
    element: HTMLElement,
    groupIds: string[],
    onToggle?: (groupId: string, expanded: boolean) => void
  ): void {
    const { model, renderer, onExpand, onCollapse } = this.config;

    if (!renderer) {
      throw new Error('No renderer configured');
    }

    const groups = groupIds
      .map((id) => model.getGroup(id))
      .filter((g): g is ColumnGroup => g !== undefined);

    const toggleHandler =
      onToggle ||
      ((gId: string, expanded: boolean) => {
        if (expanded) {
          onExpand(gId);
        } else {
          onCollapse(gId);
        }
      });

    renderer.renderGroups(element, groups, model, toggleHandler);
  }
}
