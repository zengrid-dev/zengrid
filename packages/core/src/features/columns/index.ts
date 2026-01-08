/**
 * Column Model Feature
 *
 * @description
 * Reactive column state management for ZenGrid.
 * Single source of truth for column state that synchronizes headers and body.
 *
 * Core + Plugins architecture:
 * - ColumnModel: Core state management (width, subscriptions, lookup)
 * - Plugins: Optional features (reordering, pinning, visibility)
 *
 * @example
 * ```typescript
 * import {
 *   ColumnModel,
 *   ColumnReorderPlugin,
 *   ColumnPinPlugin
 * } from '@zengrid/core';
 *
 * // Core
 * const columnModel = new ColumnModel(columns);
 * columnModel.subscribe('col-0', (event) => {
 *   // React to changes
 * });
 *
 * // Add features via plugins
 * const reorder = new ColumnReorderPlugin(columnModel);
 * const pinning = new ColumnPinPlugin(columnModel);
 *
 * reorder.move('col-0', 2);
 * pinning.pin('col-0', 'left');
 * ```
 *
 * @packageDocumentation
 */

// Core
export { ColumnModel } from './column-model';

// Plugins
export {
  ColumnReorderPlugin,
  ColumnPinPlugin,
  ColumnVisibilityPlugin
} from './plugins';

// Types
export type {
  ColumnState,
  ColumnEvent,
  ColumnEventType,
  ColumnPinPosition,
  ColumnConstraints,
  ColumnBatchUpdate,
} from './types';
