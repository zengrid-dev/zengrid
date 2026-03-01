/**
 * HeaderManager types and interfaces
 */

import type { SortState, FilterModel } from '../../types';
import type { EventEmitter } from '../../events/event-emitter';
import type { GridEvents } from '../../events/grid-events';
import type { ColumnModel } from '../../features/columns/column-model';
import type {
  HeaderRenderer,
  HeaderRenderParams,
} from '../../rendering/headers/header-renderer.interface';

/**
 * Configuration for HeaderManager
 */
export interface HeaderManagerConfig {
  /** Reactive column model */
  columnModel: ColumnModel;

  /** Header container element */
  container: HTMLElement;

  /** Event emitter for grid events */
  eventEmitter: EventEmitter<GridEvents>;

  /** Get current sort state */
  getSortState?: () => SortState[];

  /** Get current filter state */
  getFilterState?: () => FilterModel[];

  /** Header height in pixels (default: 40) */
  headerHeight?: number;

  /** Enable horizontal scroll sync (default: true) */
  enableScrollSync?: boolean;
}

/**
 * Header cell metadata
 */
export interface HeaderCellMetadata {
  element: HTMLElement;
  renderer: HeaderRenderer;
  columnId: string;
  columnIndex: number;
  lastParams?: HeaderRenderParams;
}
