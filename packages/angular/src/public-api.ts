// Components
export { ZenGridComponent } from './lib/components/zen-grid.component';
export { ZenColumnComponent } from './lib/components/zen-column.component';

// Directives
export { ZenCellTemplateDirective } from './lib/directives/zen-cell-template.directive';
export { ZenEditorTemplateDirective } from './lib/directives/zen-editor-template.directive';
export { ZenHeaderTemplateDirective } from './lib/directives/zen-header-template.directive';
export { ZenGridValueAccessorDirective } from './lib/directives/zen-grid-value-accessor.directive';

// Services
export { TemplateBridgeService } from './lib/services/template-bridge.service';
export { ZEN_GRID_CONFIG, provideZenGrid } from './lib/services/zen-grid-config.token';

// Plugins
export { AngularPluginWrapper, createAngularPlugin } from './lib/plugins/angular-plugin-wrapper';

// Utils
export { EVENT_MAP } from './lib/utils/event-map';
export { bridgeStoreSignal } from './lib/utils/signal-bridge';

// Types
export type {
  ZenCellTemplateContext,
  ZenEditorTemplateContext,
  ZenHeaderTemplateContext,
  ZenGridConfig,
  RendererInput,
  EditorInput,
  HeaderRendererInput,
} from './lib/types';

// Re-export commonly used core types
export type {
  CellRef,
  CellRange,
  CellPosition,
  ColumnDef,
  GridOptions,
  GridState,
  GridStateSnapshot,
  ColumnStateSnapshot,
  GridExportOptions,
  GridEvents,
  SortState,
  FilterModel,
  RenderParams,
  EditorParams,
  HeaderRenderParams,
  GridPlugin,
  GridStore,
  GridApiInterface,
  CellRenderer,
  CellEditor,
  HeaderRenderer,
} from './lib/types';
