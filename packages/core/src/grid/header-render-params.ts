/**
 * HeaderManager - Render params builder
 */

import type { ColumnDef, SortState, FilterModel } from '../types';
import type { GridEvents } from '../events/grid-events';
import type { EventEmitter } from '../events/event-emitter';
import { resolveHeaderConfig } from '../rendering/headers/header-config-resolver';
import type { HeaderRenderParams } from '../rendering/headers/header-renderer.interface';

/**
 * Build HeaderRenderParams
 */
export function buildRenderParams(
  column: ColumnDef,
  columnIndex: number,
  width: number,
  headerHeight: number,
  sortState: SortState[],
  filterState: FilterModel[],
  eventEmitter: EventEmitter<GridEvents>
): HeaderRenderParams {
  const config = resolveHeaderConfig(column.header, column);

  // Find sort state for this column
  const columnSort = sortState.find((s) => s.column === columnIndex);
  const sortDirection = columnSort?.direction;
  const sortPriority =
    sortState.length > 1
      ? sortState.findIndex((s) => s.column === columnIndex) + 1
      : undefined;

  // Check if column has active filter
  const hasFilter = filterState.some((f) => f.column === columnIndex);

  return {
    columnIndex,
    column,
    config,
    width,
    height: headerHeight,
    sortDirection,
    sortPriority,
    hasFilter,
    emit: (event: string, payload: any) => {
      // Emit header events through grid event emitter
      eventEmitter.emit(event as keyof GridEvents, payload);
    },
  };
}
