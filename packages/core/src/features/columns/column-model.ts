/**
 * ColumnModel - Reactive column state management (Core)
 *
 * @description
 * Single source of truth for column state. Minimal core with plugin support.
 *
 * Core responsibilities:
 * - State initialization and storage
 * - Reactive subscriptions (targeted & global)
 * - Width management with constraints
 * - Column lookup
 * - Plugin registration
 *
 * Features via plugins:
 * - Reordering: ColumnReorderPlugin
 * - Pinning: ColumnPinPlugin
 * - Visibility: ColumnVisibilityPlugin
 * - Grouping: ColumnGroupPlugin (future)
 *
 * @example
 * ```typescript
 * const columnModel = new ColumnModel(columns);
 *
 * // Add reordering capability
 * const reorder = new ColumnReorderPlugin(columnModel);
 * reorder.move('col-0', 2);
 *
 * // Add pinning capability
 * const pinning = new ColumnPinPlugin(columnModel);
 * pinning.pin('col-0', 'left');
 * ```
 */

import { ReactiveState } from '@zengrid/shared';
import type { StateSubscriber } from '@zengrid/shared';
import type { ColumnDef } from '../../types/column';
import type { ColumnState, ColumnEvent, ColumnConstraints } from './types';

const DEFAULT_WIDTH = 100;
const DEFAULT_MIN_WIDTH = 50;
const DEFAULT_MAX_WIDTH = 1000;

/**
 * ColumnModel - Core state management
 */
export class ColumnModel extends ReactiveState<ColumnState, ColumnEvent> {
  private fieldToId = new Map<string, string>();
  private constraints = new Map<string, ColumnConstraints>();

  constructor(definitions: ColumnDef[]) {
    super();
    this.initialize(definitions);
  }

  // ============================================
  // Initialization
  // ============================================

  private initialize(definitions: ColumnDef[]): void {
    definitions.forEach((def, index) => {
      const id = `col-${index}`;
      const width = def.width ?? DEFAULT_WIDTH;
      const constraints = this.extractConstraints(def);
      const actualWidth = this.applyConstraints(width, constraints);

      const state: ColumnState = {
        id,
        field: def.field,
        width,
        actualWidth,
        visible: true,
        pinned: null,
        order: index,
        groupId: null,
        definition: def,
      };

      this.setState(id, state, {
        type: 'width',
        columnId: id,
        newValue: width,
        actualValue: actualWidth,
        state,
      });

      this.fieldToId.set(def.field, id);
      this.constraints.set(id, constraints);
    });
  }

  private extractConstraints(def: ColumnDef): ColumnConstraints {
    return {
      minWidth: def.minWidth ?? DEFAULT_MIN_WIDTH,
      maxWidth: def.maxWidth ?? DEFAULT_MAX_WIDTH,
    };
  }

  private applyConstraints(width: number, constraints: ColumnConstraints): number {
    return Math.max(constraints.minWidth, Math.min(width, constraints.maxWidth));
  }

  // ============================================
  // Subscriptions
  // ============================================

  subscribe(columnId: string, subscriber: StateSubscriber<ColumnEvent>): () => void {
    return this.subscribeToKey(columnId, subscriber);
  }

  subscribeAll(subscriber: StateSubscriber<ColumnEvent>): () => void {
    return this.subscribeGlobal(subscriber);
  }

  // ============================================
  // Width Management
  // ============================================

  setWidth(columnId: string, width: number): void {
    const state = this.getState(columnId);
    if (!state) return;

    const constraints = this.constraints.get(columnId) ?? {
      minWidth: DEFAULT_MIN_WIDTH,
      maxWidth: DEFAULT_MAX_WIDTH,
    };

    const actualWidth = this.applyConstraints(width, constraints);

    this.setState(columnId, { ...state, width, actualWidth }, {
      type: 'width',
      columnId,
      oldValue: state.width,
      newValue: width,
      actualValue: actualWidth,
      state: { ...state, width, actualWidth },
    });
  }

  getWidth(columnId: string): number | undefined {
    return this.getState(columnId)?.actualWidth;
  }

  getWidths(): Array<{ id: string; width: number }> {
    return this.getColumns()
      .sort((a, b) => a.order - b.order)
      .map(col => ({ id: col.id, width: col.actualWidth }));
  }

  // ============================================
  // Plugin Support (Extensibility)
  // ============================================

  /**
   * Update state (for plugins)
   * @internal - Used by plugin implementations
   */
  updateState(columnId: string, updates: Partial<ColumnState>, event: ColumnEvent): void {
    const state = this.getState(columnId);
    if (!state) return;

    const newState = { ...state, ...updates };
    this.setState(columnId, newState, event);
  }

  /**
   * Batch updates (for plugins)
   * @internal - Used by plugin implementations
   */
  batchUpdate(updates: () => void): void {
    this.batch(updates);
  }

  // ============================================
  // Column Lookup
  // ============================================

  getColumn(columnId: string): ColumnState | undefined {
    return this.getState(columnId);
  }

  getColumnByField(field: string): ColumnState | undefined {
    const id = this.fieldToId.get(field);
    return id ? this.getState(id) : undefined;
  }

  getColumns(): ColumnState[] {
    const columns: ColumnState[] = [];
    this.fieldToId.forEach(id => {
      const state = this.getState(id);
      if (state) columns.push(state);
    });
    return columns;
  }

  getCount(): number {
    return this.fieldToId.size;
  }
}
