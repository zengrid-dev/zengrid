/**
 * Column Groups module
 * Hierarchical column group management for ZenGrid
 */

export { ColumnGroupModel } from './column-group-model';
export {
  ColumnGroupRenderer,
  createColumnGroupRenderer,
} from './column-group-renderer';
export type {
  ColumnGroupRenderParams,
  ColumnGroupRendererOptions,
} from './column-group-renderer';
export {
  ColumnGroupManager,
} from './column-group-manager';
export type {
  ColumnGroupManagerOptions,
} from './manager-options';
export type {
  ColumnGroupManagerEvents,
  GroupAddedEvent,
  GroupRemovedEvent,
  GroupUpdatedEvent,
  GroupToggledEvent,
  HierarchyChangedEvent,
} from './types';
export type {
  ColumnGroup,
  ColumnGroupModelConfig,
  ValidationResult,
  GroupNode,
} from './types';
export {
  RendererRegistry,
  globalRendererRegistry,
  registerRenderer,
  getRenderer,
  hasRenderer,
  createRendererRegistry,
} from './renderer-registry';
export type {
  IRendererRegistry,
  RendererFactory,
} from './renderer-registry';
