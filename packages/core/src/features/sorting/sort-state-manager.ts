/**
 * SortStateManager - Reactive state management for grid sorting
 *
 * Manages sort state across columns with reactive updates.
 * Uses EventEmitter for pub/sub patterns and integrates with MultiColumnSorter.
 *
 * Features:
 * - Reactive state updates with event notifications
 * - Integration with MultiColumnSorter for sorting operations
 * - Sort model manipulation (add, remove, toggle, clear)
 * - Sort state queries (direction, priority)
 * - Automatic sorted indices computation
 *
 * Events:
 * - 'sortChanged': Emitted when sort model changes
 * - 'sortCleared': Emitted when all sorts are cleared
 */

import { EventEmitter } from '../../utils/event-emitter';
import { MultiColumnSorter } from './multi-column-sorter';
import {
  SortModel,
  SortColumn,
  SortChangedEvent,
  SortDirection,
  ComparatorFn,
  MultiColumnSorterOptions
} from './types';

/**
 * Event map for SortStateManager
 */
export interface SortStateManagerEvents {
  sortChanged: SortChangedEvent;
  sortCleared: { previousModel: SortModel };
}

/**
 * Options for SortStateManager
 */
export interface SortStateManagerOptions extends MultiColumnSorterOptions {
  /**
   * Initial sort model
   */
  initialSortModel?: SortModel;
}

/**
 * Manages sort state for ZenGrid with reactive updates
 *
 * Provides a reactive state container for sorting with event-driven
 * notifications and integration with MultiColumnSorter.
 */
export class SortStateManager {
  private eventEmitter: EventEmitter<SortStateManagerEvents>;
  private sorter: MultiColumnSorter;
  private currentSortModel: SortModel;
  private currentData: any[] = [];
  private currentSortedIndices: number[] = [];

  /**
   * Create a new sort state manager
   *
   * @param options - Configuration options
   */
  constructor(options: SortStateManagerOptions = {}) {
    this.eventEmitter = new EventEmitter<SortStateManagerEvents>();
    this.sorter = new MultiColumnSorter(options);
    this.currentSortModel = options.initialSortModel ?? { columns: [] };
  }

  /**
   * Get the current sort model
   *
   * @returns Current sort model (read-only copy)
   */
  getSortModel(): SortModel {
    return {
      columns: [...this.currentSortModel.columns]
    };
  }

  /**
   * Set the data to be sorted
   *
   * @param data - Array of data rows
   */
  setData(data: any[]): void {
    this.currentData = data;
    this.updateSortedIndices();
  }

  /**
   * Get the current data
   *
   * @returns Current data array
   */
  getData(): any[] {
    return this.currentData;
  }

  /**
   * Get the current sorted indices
   *
   * @returns Array of sorted indices
   */
  getSortedIndices(): number[] {
    return [...this.currentSortedIndices];
  }

  /**
   * Get the sorted data (data reordered by sorted indices)
   *
   * @returns Sorted data array
   */
  getSortedData(): any[] {
    return this.sorter.applySortedIndices(this.currentData, this.currentSortedIndices);
  }

  /**
   * Set the entire sort model
   *
   * @param sortModel - New sort model
   */
  setSortModel(sortModel: SortModel): void {
    const previousModel = this.currentSortModel;
    this.currentSortModel = {
      columns: [...sortModel.columns]
    };

    this.updateSortedIndices();
    this.emitSortChanged(previousModel);
  }

  /**
   * Add a sort column to the current sort model
   *
   * @param column - Column to add
   */
  addSortColumn(column: SortColumn): void {
    const previousModel = this.currentSortModel;
    this.currentSortModel = this.sorter.addSortColumn(this.currentSortModel, column);

    this.updateSortedIndices();
    this.emitSortChanged(previousModel, column);
  }

  /**
   * Remove a sort column from the current sort model
   *
   * @param field - Field name to remove
   */
  removeSortColumn(field: string): void {
    const previousModel = this.currentSortModel;
    const removedColumn = this.currentSortModel.columns.find(col => col.field === field);

    this.currentSortModel = this.sorter.removeSortColumn(this.currentSortModel, field);

    this.updateSortedIndices();
    this.emitSortChanged(previousModel, removedColumn);
  }

  /**
   * Toggle sort direction for a field
   *
   * Cycles through: none → asc → desc → none
   *
   * @param field - Field name to toggle
   * @param comparator - Optional custom comparator
   */
  toggleSortColumn(field: string, comparator?: ComparatorFn): void {
    const previousModel = this.currentSortModel;
    const previousColumn = this.currentSortModel.columns.find(col => col.field === field);

    this.currentSortModel = this.sorter.toggleSortColumn(
      this.currentSortModel,
      field,
      comparator
    );

    const newColumn = this.currentSortModel.columns.find(col => col.field === field);

    this.updateSortedIndices();
    this.emitSortChanged(previousModel, newColumn ?? previousColumn);
  }

  /**
   * Clear all sorts
   */
  clearSort(): void {
    const previousModel = this.currentSortModel;
    this.currentSortModel = this.sorter.clearSort();

    this.currentSortedIndices = Array.from(
      { length: this.currentData.length },
      (_, i) => i
    );

    this.eventEmitter.emit('sortCleared', { previousModel });
    this.emitSortChanged(previousModel);
  }

  /**
   * Get sort direction for a specific field
   *
   * @param field - Field name
   * @returns Sort direction or null if not sorted
   */
  getSortDirection(field: string): SortDirection | null {
    return this.sorter.getSortDirection(this.currentSortModel, field);
  }

  /**
   * Get sort priority for a specific field
   *
   * @param field - Field name
   * @returns Sort priority (0-based) or null if not sorted
   */
  getSortPriority(field: string): number | null {
    return this.sorter.getSortPriority(this.currentSortModel, field);
  }

  /**
   * Check if the sort model is empty
   *
   * @returns True if no sorts are active
   */
  isSortModelEmpty(): boolean {
    return this.sorter.isSortModelEmpty(this.currentSortModel);
  }

  /**
   * Subscribe to sort change events
   *
   * @param event - Event name
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  on<K extends keyof SortStateManagerEvents>(
    event: K,
    listener: (data: SortStateManagerEvents[K]) => void
  ): () => void {
    return this.eventEmitter.on(event, listener);
  }

  /**
   * Subscribe to a sort change event (one-time only)
   *
   * @param event - Event name
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  once<K extends keyof SortStateManagerEvents>(
    event: K,
    listener: (data: SortStateManagerEvents[K]) => void
  ): () => void {
    return this.eventEmitter.once(event, listener);
  }

  /**
   * Unsubscribe from a sort change event
   *
   * @param event - Event name
   * @param listener - Listener function to remove
   */
  off<K extends keyof SortStateManagerEvents>(
    event: K,
    listener: (data: SortStateManagerEvents[K]) => void
  ): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Remove all event listeners
   *
   * @param event - Optional event name (if omitted, removes all listeners)
   */
  removeAllListeners<K extends keyof SortStateManagerEvents>(event?: K): void {
    this.eventEmitter.removeAllListeners(event);
  }

  /**
   * Destroy the sort state manager and clean up resources
   */
  destroy(): void {
    this.eventEmitter.removeAllListeners();
    this.currentData = [];
    this.currentSortedIndices = [];
    this.currentSortModel = { columns: [] };
  }

  /**
   * Update sorted indices based on current sort model and data
   *
   * @private
   */
  private updateSortedIndices(): void {
    if (this.currentData.length === 0) {
      this.currentSortedIndices = [];
      return;
    }

    this.currentSortedIndices = this.sorter.sort(this.currentData, this.currentSortModel);
  }

  /**
   * Emit sort changed event
   *
   * @private
   * @param previousModel - Previous sort model
   * @param changedColumn - Column that triggered the change (optional)
   */
  private emitSortChanged(_previousModel: SortModel, changedColumn?: SortColumn): void {
    this.eventEmitter.emit('sortChanged', {
      sortModel: this.getSortModel(),
      changedColumn,
      sortedIndices: this.getSortedIndices()
    });
  }
}
