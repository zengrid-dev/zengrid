/**
 * Column Model Plugins
 *
 * @description
 * Modular plugins for extending ColumnModel functionality.
 *
 * Available plugins:
 * - ColumnReorderPlugin: Drag & drop reordering
 * - ColumnPinPlugin: Pin columns left/right
 * - ColumnVisibilityPlugin: Show/hide columns
 *
 * @example
 * ```typescript
 * import { ColumnModel, ColumnReorderPlugin, ColumnPinPlugin } from '@zengrid/core';
 *
 * const columnModel = new ColumnModel(columns);
 *
 * // Add reordering capability
 * const reorder = new ColumnReorderPlugin(columnModel);
 *
 * // Add pinning capability
 * const pinning = new ColumnPinPlugin(columnModel);
 *
 * // Use features
 * reorder.move('col-0', 2);
 * pinning.pin('col-0', 'left');
 * ```
 *
 * @packageDocumentation
 */

export { ColumnReorderPlugin } from './column-reorder';
export { ColumnPinPlugin } from './column-pin';
export { ColumnVisibilityPlugin } from './column-visibility';
