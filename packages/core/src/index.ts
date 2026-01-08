/**
 * ZenGrid Core - Community Edition
 * High-performance data grid library
 *
 * @packageDocumentation
 */

// Core types
export * from './types';

// Data structures (re-exported from shared)
export { SparseMatrix } from '@zengrid/shared';
export type { SparseMatrixOptions, ReadonlySparseMatrix } from '@zengrid/shared';

export { ColumnStore } from '@zengrid/shared';
export type { ColumnStoreOptions, ColumnDefinition, ColumnType, AggregateOperation, AggregationResult } from '@zengrid/shared';

// Rendering - Height and Width Providers
export type { HeightProvider, HeightProviderOptions } from './rendering/height-provider';
export { UniformHeightProvider, VariableHeightProvider } from './rendering/height-provider';

export type { WidthProvider, WidthProviderOptions } from './rendering/width-provider';
export { UniformWidthProvider, VariableWidthProvider } from './rendering/width-provider';

// Rendering - Virtual Scroller
export type { VirtualScrollerOptions, CellPosition } from './rendering/virtual-scroller';
export { VirtualScroller } from './rendering/virtual-scroller';

// Rendering - CellPool
export type { CellPoolOptions, CellPoolStats } from './rendering/cell-pool';
export { CellPool } from './rendering/cell-pool';

// Rendering - CellPositioner
export type { CellPositionerOptions } from './rendering/cell-positioner';
export { CellPositioner } from './rendering/cell-positioner';

// Rendering - Renderers
export type { CellRenderer, RenderParams } from './rendering/renderers';
export { RendererRegistry, TextRenderer, NumberRenderer, ImageRenderer, AdvancedCellRenderer } from './rendering/renderers';
export type {
  NumberRendererOptions,
  ImageRendererOptions,
  AdvancedCellRendererOptions,
  CompositeElement,
  ConditionalStyle,
} from './rendering/renderers';

// Rendering - Headers
export type { HeaderRenderer, HeaderRenderParams } from './rendering/headers/header-renderer.interface';
export type { ResolvedHeaderConfig } from './types/header';
export {
  TextHeaderRenderer,
  SortableHeaderRenderer,
  FilterableHeaderRenderer,
  CheckboxHeaderRenderer,
  IconHeaderRenderer,
} from './rendering/headers/renderers';

// Rendering - Cache
export type { IRendererCache, RendererCacheConfig, CachedRenderContent } from './rendering/cache';
export { RendererCache } from './rendering/cache';

// Data layer
export type { DataAccessor } from './data/data-accessor';
export type { IndexMap, IndexMapOptions } from './data/index-map';
export { createIndexMap, createIdentityIndexMap } from './data/index-map';

// Features - Sorting
export type { RowSorter, SortOptions, NullPosition } from './features/sorting';
export { SingleColumnSorter } from './features/sorting';

// Features - Column Resize
export type {
  ColumnConstraints,
  ColumnResizeOptions,
  ResizeState,
  ResizeZoneResult,
  AutoFitCalculatorOptions,
} from './features/column-resize';
export {
  ColumnResizeManager,
  AutoFitCalculator,
  ResizeHandleRenderer,
  ResizePreview,
} from './features/column-resize';

// Features - Column Drag (Drag-and-drop reordering)
export type {
  DragState,
  DragEvent,
  DropPosition,
  ColumnDragOptions,
  AutoScrollOptions,
  DragStateSnapshot,
  DropZoneResult,
  BeforeDragEvent,
  DuringDragEvent,
  AfterDragEvent,
  ColumnDragEvents,
} from './features/column-drag';
export {
  ColumnDragManager,
  DragVisualFeedback,
  DragKeyboardHandler,
  DragTouchHandler,
  ColumnDragCommand,
} from './features/column-drag';

// Features - Column Model (Reactive column state management)
export { ColumnModel } from './features/columns';
export {
  ColumnReorderPlugin,
  ColumnPinPlugin,
  ColumnVisibilityPlugin,
} from './features/columns';
export type {
  ColumnState,
  ColumnEvent,
  ColumnEventType,
  ColumnPinPosition,
  ColumnBatchUpdate,
} from './features/columns';

// Features - Viewport (Reactive scroll and viewport state)
export { ScrollModel, ViewportModel } from './features/viewport';
export type {
  ScrollState,
  ViewportState,
  ScrollEvent,
  ScrollEventType,
  ViewportEvent,
  ViewportEventType,
} from './features/viewport';

// Selection utilities
export { normalizeRange, mergeRanges, containsCell, rangesIntersect } from './selection/range-utils';
export { createHitTester } from './selection/hit-tester';

// Main Grid class
export { Grid } from './grid/index';

// Interactive Renderers
export type { CheckboxRendererOptions, createCheckboxRenderer } from './rendering/renderers/checkbox-renderer';
export { CheckboxRenderer } from './rendering/renderers/checkbox-renderer';

export type { ProgressBarRendererOptions, createProgressBarRenderer } from './rendering/renderers/progress-bar-renderer';
export { ProgressBarRenderer } from './rendering/renderers/progress-bar-renderer';

export type { LinkRendererOptions, createLinkRenderer } from './rendering/renderers/link-renderer';
export { LinkRenderer } from './rendering/renderers/link-renderer';

export type { ButtonRendererOptions, createButtonRenderer } from './rendering/renderers/button-renderer';
export { ButtonRenderer } from './rendering/renderers/button-renderer';

export type { DateRendererOptions, DateFormat as DateRendererFormat, createDateRenderer } from './rendering/renderers/date-renderer';
export { DateRenderer } from './rendering/renderers/date-renderer';

export type { SelectRendererOptions, SelectOption, createSelectRenderer } from './rendering/renderers/select-renderer';
export { SelectRenderer } from './rendering/renderers/select-renderer';

export type { ChipRendererOptions, Chip, createChipRenderer } from './rendering/renderers/chip-renderer';
export { ChipRenderer } from './rendering/renderers/chip-renderer';

export type { DropdownRendererOptions, DropdownOption as DropdownRendererOption, createDropdownRenderer } from './rendering/renderers/dropdown-renderer';
export { DropdownRenderer } from './rendering/renderers/dropdown-renderer';

// Cell Editors
export type { CellEditor, EditorParams, ValidationResult as EditorValidationResult } from './editing/cell-editor.interface';

export type { TextEditorOptions, createTextEditor } from './editing/text-editor';
export { TextEditor } from './editing/text-editor';

export type { CheckboxEditorOptions, createCheckboxEditor } from './editing/checkbox-editor';
export { CheckboxEditor } from './editing/checkbox-editor';

export type { DateEditorOptions, DateFormat as DateEditorFormat, createDateEditor } from './editing/date-editor';
export { DateEditor } from './editing/date-editor';

export type { DropdownEditorOptions, DropdownOption, createDropdownEditor } from './editing/dropdown-editor';
export { DropdownEditor } from './editing/dropdown-editor';

export { EditorManager } from './editing/editor-manager';
export type { EditorManagerOptions } from './editing/editor-manager';

// Features - Column Groups
export type {
  ColumnGroup,
  ColumnGroupModelConfig,
  ValidationResult,
  GroupNode,
} from './features/column-groups/types';
export {
  ColumnGroupManager,
  ColumnGroupModel,
  ColumnGroupRenderer,
  createColumnGroupRenderer,
  RendererRegistry as ColumnGroupRendererRegistry,
  globalRendererRegistry as globalColumnGroupRendererRegistry,
  registerRenderer as registerColumnGroupRenderer,
  getRenderer as getColumnGroupRenderer,
  hasRenderer as hasColumnGroupRenderer,
  createRendererRegistry as createColumnGroupRendererRegistry,
} from './features/column-groups';
export type {
  ColumnGroupRenderParams,
  ColumnGroupRendererOptions,
  IRendererRegistry as IColumnGroupRendererRegistry,
  RendererFactory as ColumnGroupRendererFactory,
} from './features/column-groups';

// Features - Multi-Column Sorting
export {
  MultiColumnSorter,
  SortStateManager,
} from './features/sorting';

// Utilities
export { DependencyGraph } from './utils/dependency-graph';
export { EventEmitter } from './utils/event-emitter';

// TODO: Implement remaining modules
//
// // Keyboard
// export { KeyboardNavigator } from './keyboard/keyboard-navigator';
//
// // Accessibility
// export { ARIAManager } from './a11y/aria-manager';
// export { FocusManager } from './a11y/focus-manager';
//
// // Features
// export { BasicFilter } from './features/filtering/basic-filter';
// export { ClipboardManager } from './features/copy-paste/clipboard-manager';
// export { CSVExporter } from './features/export/csv-exporter';

// Version
export const VERSION = '0.1.0';
