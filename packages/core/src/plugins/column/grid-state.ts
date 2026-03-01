import type { ColumnStateSnapshot, GridStateSnapshot, SortState, FilterModel } from '../../types';
import type { ColumnModel } from '../../features/columns/column-model';
import { ColumnVisibilityPlugin } from '../../features/columns/plugins/column-visibility';

export function getColumnState(columnModel: ColumnModel | null): ColumnStateSnapshot[] {
  if (!columnModel) return [];

  return columnModel.getColumns().map((col) => ({
    id: col.id,
    field: col.field,
    width: col.width,
    visible: col.visible,
    order: col.order,
  }));
}

export function applyColumnState(
  columnModel: ColumnModel | null,
  state: ColumnStateSnapshot[],
  options?: {
    applyWidth?: boolean;
    applyVisibility?: boolean;
    applyOrder?: boolean;
  }
): void {
  if (!columnModel || !state || state.length === 0) return;

  const applyWidth = options?.applyWidth !== false;
  const applyVisibility = options?.applyVisibility !== false;
  const applyOrder = options?.applyOrder !== false;

  const byId = new Map<string, ColumnStateSnapshot>();
  const byField = new Map<string, ColumnStateSnapshot>();

  state.forEach((snapshot) => {
    if (snapshot.id) {
      byId.set(snapshot.id, snapshot);
    }
    if (snapshot.field) {
      byField.set(snapshot.field, snapshot);
    }
  });

  const visibility = new ColumnVisibilityPlugin(columnModel);

  columnModel.batchUpdate(() => {
    for (const col of columnModel.getColumns()) {
      const snapshot = byId.get(col.id) ?? (col.field ? byField.get(col.field) : undefined);
      if (!snapshot) continue;

      if (applyWidth && snapshot.width !== undefined) {
        columnModel.setWidth(col.id, snapshot.width);
      }

      if (applyVisibility && snapshot.visible !== undefined) {
        if (snapshot.visible) {
          visibility.show(col.id);
        } else {
          visibility.hide(col.id);
        }
      }

      if (applyOrder && snapshot.order !== undefined) {
        const current = columnModel.getColumn(col.id);
        if (current && current.order !== snapshot.order) {
          columnModel.updateState(
            col.id,
            { order: snapshot.order },
            {
              type: 'reorder',
              columnId: col.id,
              oldValue: current.order,
              newValue: snapshot.order,
              state: { ...current, order: snapshot.order },
            }
          );
        }
      }
    }
  });
}

export interface GridStateCallbacks {
  getSortState: () => SortState[];
  getFilterState: () => FilterModel[];
  setSortState: (state: SortState[]) => void;
  setFilterState: (models: FilterModel[]) => void;
}

export function getStateSnapshot(
  columnModel: ColumnModel | null,
  callbacks: GridStateCallbacks
): GridStateSnapshot {
  return {
    columns: getColumnState(columnModel),
    sortState: callbacks.getSortState(),
    filterState: callbacks.getFilterState(),
  };
}

export function applyStateSnapshot(
  columnModel: ColumnModel | null,
  snapshot: GridStateSnapshot,
  callbacks: GridStateCallbacks
): void {
  if (!snapshot) return;

  if (snapshot.columns && snapshot.columns.length > 0) {
    applyColumnState(columnModel, snapshot.columns);
  }

  if (snapshot.sortState) {
    callbacks.setSortState(snapshot.sortState);
  }

  if (snapshot.filterState) {
    callbacks.setFilterState(snapshot.filterState);
  }
}
