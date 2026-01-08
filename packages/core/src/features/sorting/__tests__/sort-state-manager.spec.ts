/**
 * Tests for SortStateManager
 */

import { SortStateManager } from '../sort-state-manager';
import { SortModel, SortColumn, SortChangedEvent } from '../types';

describe('SortStateManager', () => {
  describe('Initialization', () => {
    it('should initialize with empty sort model by default', () => {
      const manager = new SortStateManager();
      const sortModel = manager.getSortModel();

      expect(sortModel.columns).toEqual([]);
      expect(manager.isSortModelEmpty()).toBe(true);
    });

    it('should initialize with provided initial sort model', () => {
      const initialSortModel: SortModel = {
        columns: [
          { field: 'name', direction: 'asc' },
          { field: 'age', direction: 'desc' }
        ]
      };

      const manager = new SortStateManager({ initialSortModel });
      const sortModel = manager.getSortModel();

      expect(sortModel.columns).toEqual(initialSortModel.columns);
      expect(manager.isSortModelEmpty()).toBe(false);
    });

    it('should accept sorter options', () => {
      const manager = new SortStateManager({
        maxSortColumns: 5,
        defaultDirection: 'desc'
      });

      expect(manager).toBeDefined();
      expect(manager.isSortModelEmpty()).toBe(true);
    });
  });

  describe('Sort Model Management', () => {
    let manager: SortStateManager;

    beforeEach(() => {
      manager = new SortStateManager();
    });

    afterEach(() => {
      manager.destroy();
    });

    it('should set and get sort model', () => {
      const sortModel: SortModel = {
        columns: [{ field: 'name', direction: 'asc' }]
      };

      manager.setSortModel(sortModel);
      const retrieved = manager.getSortModel();

      expect(retrieved.columns).toEqual(sortModel.columns);
    });

    it('should return a copy of sort model (not reference)', () => {
      const sortModel: SortModel = {
        columns: [{ field: 'name', direction: 'asc' }]
      };

      manager.setSortModel(sortModel);
      const retrieved = manager.getSortModel();

      // Modify retrieved copy
      retrieved.columns.push({ field: 'age', direction: 'desc' });

      // Original should not be affected
      const original = manager.getSortModel();
      expect(original.columns.length).toBe(1);
    });

    it('should add a sort column', () => {
      const column: SortColumn = { field: 'name', direction: 'asc' };

      manager.addSortColumn(column);
      const sortModel = manager.getSortModel();

      expect(sortModel.columns.length).toBe(1);
      expect(sortModel.columns[0]).toEqual(column);
    });

    it('should replace existing sort for same field when adding', () => {
      manager.addSortColumn({ field: 'name', direction: 'asc' });
      manager.addSortColumn({ field: 'name', direction: 'desc' });

      const sortModel = manager.getSortModel();

      expect(sortModel.columns.length).toBe(1);
      expect(sortModel.columns[0].direction).toBe('desc');
    });

    it('should remove a sort column', () => {
      manager.addSortColumn({ field: 'name', direction: 'asc' });
      manager.addSortColumn({ field: 'age', direction: 'desc' });

      manager.removeSortColumn('name');
      const sortModel = manager.getSortModel();

      expect(sortModel.columns.length).toBe(1);
      expect(sortModel.columns[0].field).toBe('age');
    });

    it('should handle removing non-existent field', () => {
      manager.addSortColumn({ field: 'name', direction: 'asc' });
      manager.removeSortColumn('nonexistent');

      const sortModel = manager.getSortModel();
      expect(sortModel.columns.length).toBe(1);
    });

    it('should toggle sort column from none to asc', () => {
      manager.toggleSortColumn('name');

      const sortModel = manager.getSortModel();
      expect(sortModel.columns.length).toBe(1);
      expect(sortModel.columns[0].field).toBe('name');
      expect(sortModel.columns[0].direction).toBe('asc');
    });

    it('should toggle sort column from asc to desc', () => {
      manager.addSortColumn({ field: 'name', direction: 'asc' });
      manager.toggleSortColumn('name');

      const sortModel = manager.getSortModel();
      expect(sortModel.columns[0].direction).toBe('desc');
    });

    it('should toggle sort column from desc to none', () => {
      manager.addSortColumn({ field: 'name', direction: 'desc' });
      manager.toggleSortColumn('name');

      const sortModel = manager.getSortModel();
      expect(sortModel.columns.length).toBe(0);
    });

    it('should clear all sorts', () => {
      manager.addSortColumn({ field: 'name', direction: 'asc' });
      manager.addSortColumn({ field: 'age', direction: 'desc' });

      manager.clearSort();
      const sortModel = manager.getSortModel();

      expect(sortModel.columns.length).toBe(0);
      expect(manager.isSortModelEmpty()).toBe(true);
    });

    it('should get sort direction for a field', () => {
      manager.addSortColumn({ field: 'name', direction: 'asc' });

      expect(manager.getSortDirection('name')).toBe('asc');
      expect(manager.getSortDirection('age')).toBeNull();
    });

    it('should get sort priority for a field', () => {
      manager.addSortColumn({ field: 'name', direction: 'asc' });
      manager.addSortColumn({ field: 'age', direction: 'desc' });

      // Most recently added has highest priority (index 0)
      expect(manager.getSortPriority('age')).toBe(0);
      expect(manager.getSortPriority('name')).toBe(1);
      expect(manager.getSortPriority('nonexistent')).toBeNull();
    });
  });

  describe('Data Management and Sorting', () => {
    let manager: SortStateManager;
    let testData: any[];

    beforeEach(() => {
      manager = new SortStateManager();
      testData = [
        { name: 'Charlie', age: 30 },
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 }
      ];
    });

    afterEach(() => {
      manager.destroy();
    });

    it('should set and get data', () => {
      manager.setData(testData);
      const retrieved = manager.getData();

      expect(retrieved).toEqual(testData);
    });

    it('should compute sorted indices when data is set', () => {
      manager.addSortColumn({ field: 'name', direction: 'asc' });
      manager.setData(testData);

      const indices = manager.getSortedIndices();

      // Sorted by name: Alice (1), Bob (2), Charlie (0)
      expect(indices).toEqual([1, 2, 0]);
    });

    it('should get sorted data', () => {
      manager.addSortColumn({ field: 'name', direction: 'asc' });
      manager.setData(testData);

      const sortedData = manager.getSortedData();

      expect(sortedData[0].name).toBe('Alice');
      expect(sortedData[1].name).toBe('Bob');
      expect(sortedData[2].name).toBe('Charlie');
    });

    it('should update sorted indices when sort model changes', () => {
      manager.setData(testData);
      manager.addSortColumn({ field: 'name', direction: 'asc' });

      const indices = manager.getSortedIndices();
      expect(indices).toEqual([1, 2, 0]);
    });

    it('should handle multi-column sorting', () => {
      manager.setData(testData);
      // Add name first (will be lower priority), then age (will be higher priority)
      manager.addSortColumn({ field: 'name', direction: 'asc' });
      manager.addSortColumn({ field: 'age', direction: 'desc' });

      const sortedData = manager.getSortedData();

      // Most recently added column (age) has highest priority
      // Sorted by age desc (30, 30, 25), then name asc (Bob, Charlie, Alice)
      expect(sortedData[0].name).toBe('Bob');
      expect(sortedData[1].name).toBe('Charlie');
      expect(sortedData[2].name).toBe('Alice');
    });

    it('should handle empty data', () => {
      manager.setData([]);
      manager.addSortColumn({ field: 'name', direction: 'asc' });

      const indices = manager.getSortedIndices();
      const sortedData = manager.getSortedData();

      expect(indices).toEqual([]);
      expect(sortedData).toEqual([]);
    });

    it('should return original order when no sorts are active', () => {
      manager.setData(testData);

      const sortedData = manager.getSortedData();
      expect(sortedData).toEqual(testData);
    });

    it('should update indices when clearing sort', () => {
      manager.setData(testData);
      manager.addSortColumn({ field: 'name', direction: 'asc' });
      manager.clearSort();

      const indices = manager.getSortedIndices();
      // Should return original order [0, 1, 2]
      expect(indices).toEqual([0, 1, 2]);
    });
  });

  describe('Event System', () => {
    let manager: SortStateManager;
    let testData: any[];

    beforeEach(() => {
      manager = new SortStateManager();
      testData = [
        { name: 'Charlie', age: 30 },
        { name: 'Alice', age: 25 }
      ];
      manager.setData(testData);
    });

    afterEach(() => {
      manager.destroy();
    });

    it('should emit sortChanged event when sort model is set', (done) => {
      const listener = (event: SortChangedEvent) => {
        expect(event.sortModel.columns.length).toBe(1);
        expect(event.sortModel.columns[0].field).toBe('name');
        expect(event.sortedIndices).toEqual([1, 0]); // Alice, Charlie
        done();
      };

      manager.on('sortChanged', listener);
      manager.setSortModel({
        columns: [{ field: 'name', direction: 'asc' }]
      });
    });

    it('should emit sortChanged event when adding sort column', (done) => {
      const listener = (event: SortChangedEvent) => {
        expect(event.changedColumn?.field).toBe('name');
        expect(event.changedColumn?.direction).toBe('asc');
        done();
      };

      manager.on('sortChanged', listener);
      manager.addSortColumn({ field: 'name', direction: 'asc' });
    });

    it('should emit sortChanged event when removing sort column', (done) => {
      manager.addSortColumn({ field: 'name', direction: 'asc' });

      const listener = (event: SortChangedEvent) => {
        expect(event.sortModel.columns.length).toBe(0);
        done();
      };

      manager.on('sortChanged', listener);
      manager.removeSortColumn('name');
    });

    it('should emit sortChanged event when toggling sort column', (done) => {
      const listener = (event: SortChangedEvent) => {
        expect(event.changedColumn?.field).toBe('name');
        done();
      };

      manager.on('sortChanged', listener);
      manager.toggleSortColumn('name');
    });

    it('should emit sortCleared event when clearing sorts', (done) => {
      manager.addSortColumn({ field: 'name', direction: 'asc' });

      const listener = (event: { previousModel: SortModel }) => {
        expect(event.previousModel.columns.length).toBe(1);
        done();
      };

      manager.on('sortCleared', listener);
      manager.clearSort();
    });

    it('should support one-time event listeners', () => {
      let callCount = 0;

      const listener = () => {
        callCount++;
      };

      manager.once('sortChanged', listener);

      manager.addSortColumn({ field: 'name', direction: 'asc' });
      manager.addSortColumn({ field: 'age', direction: 'desc' });

      expect(callCount).toBe(1);
    });

    it('should support unsubscribing from events', () => {
      let callCount = 0;

      const listener = () => {
        callCount++;
      };

      const unsubscribe = manager.on('sortChanged', listener);

      manager.addSortColumn({ field: 'name', direction: 'asc' });
      unsubscribe();
      manager.addSortColumn({ field: 'age', direction: 'desc' });

      expect(callCount).toBe(1);
    });

    it('should support removing specific event listeners with off()', () => {
      let callCount = 0;

      const listener = () => {
        callCount++;
      };

      manager.on('sortChanged', listener);

      manager.addSortColumn({ field: 'name', direction: 'asc' });
      manager.off('sortChanged', listener);
      manager.addSortColumn({ field: 'age', direction: 'desc' });

      expect(callCount).toBe(1);
    });

    it('should support removing all event listeners', () => {
      let callCount = 0;

      const listener = () => {
        callCount++;
      };

      manager.on('sortChanged', listener);
      manager.on('sortCleared', listener);

      manager.removeAllListeners();

      manager.addSortColumn({ field: 'name', direction: 'asc' });
      manager.clearSort();

      expect(callCount).toBe(0);
    });

    it('should support removing all listeners for a specific event', () => {
      let sortChangedCount = 0;
      let sortClearedCount = 0;

      manager.on('sortChanged', () => sortChangedCount++);
      manager.on('sortCleared', () => sortClearedCount++);

      manager.removeAllListeners('sortChanged');

      manager.addSortColumn({ field: 'name', direction: 'asc' });
      manager.clearSort();

      expect(sortChangedCount).toBe(0);
      expect(sortClearedCount).toBe(1);
    });

    it('should handle multiple listeners for same event', () => {
      let count1 = 0;
      let count2 = 0;

      manager.on('sortChanged', () => count1++);
      manager.on('sortChanged', () => count2++);

      manager.addSortColumn({ field: 'name', direction: 'asc' });

      expect(count1).toBe(1);
      expect(count2).toBe(1);
    });
  });

  describe('Destroy and Cleanup', () => {
    it('should clean up resources on destroy', () => {
      const manager = new SortStateManager();
      const testData = [{ name: 'Alice' }, { name: 'Bob' }];

      manager.setData(testData);
      manager.addSortColumn({ field: 'name', direction: 'asc' });

      manager.destroy();

      expect(manager.getData()).toEqual([]);
      expect(manager.getSortedIndices()).toEqual([]);
      expect(manager.isSortModelEmpty()).toBe(true);
    });

    it('should remove all event listeners on destroy', () => {
      const manager = new SortStateManager();
      let callCount = 0;

      const listener = () => {
        callCount++;
      };

      manager.on('sortChanged', listener);
      manager.destroy();

      manager.addSortColumn({ field: 'name', direction: 'asc' });

      expect(callCount).toBe(0);
    });
  });

  describe('Integration with MultiColumnSorter', () => {
    let manager: SortStateManager;

    beforeEach(() => {
      manager = new SortStateManager({ maxSortColumns: 3 });
    });

    afterEach(() => {
      manager.destroy();
    });

    it('should respect maxSortColumns option', () => {
      manager.addSortColumn({ field: 'field1', direction: 'asc' });
      manager.addSortColumn({ field: 'field2', direction: 'asc' });
      manager.addSortColumn({ field: 'field3', direction: 'asc' });
      manager.addSortColumn({ field: 'field4', direction: 'asc' });

      const sortModel = manager.getSortModel();
      expect(sortModel.columns.length).toBe(3);
    });

    it('should use defaultDirection option when toggling from none', () => {
      const customManager = new SortStateManager({ defaultDirection: 'desc' });

      customManager.toggleSortColumn('name');
      const direction = customManager.getSortDirection('name');

      expect(direction).toBe('desc');

      customManager.destroy();
    });

    it('should support custom comparators', () => {
      const testData = [
        { id: '2' },
        { id: '10' },
        { id: '1' }
      ];

      manager.setData(testData);

      // Custom numeric comparator for string IDs
      const numericComparator = (a: any, b: any) => {
        return Number(a) - Number(b);
      };

      manager.addSortColumn({
        field: 'id',
        direction: 'asc',
        comparator: numericComparator
      });

      const sortedData = manager.getSortedData();

      expect(sortedData[0].id).toBe('1');
      expect(sortedData[1].id).toBe('2');
      expect(sortedData[2].id).toBe('10');
    });
  });

  describe('Edge Cases', () => {
    let manager: SortStateManager;

    beforeEach(() => {
      manager = new SortStateManager();
    });

    afterEach(() => {
      manager.destroy();
    });

    it('should handle null and undefined values in data', () => {
      const testData = [
        { name: 'Alice', age: null },
        { name: null, age: 30 },
        { name: 'Bob', age: undefined }
      ];

      manager.setData(testData);
      manager.addSortColumn({ field: 'name', direction: 'asc' });

      const sortedData = manager.getSortedData();
      // null values should sort last
      expect(sortedData[sortedData.length - 1].name).toBeNull();
    });

    it('should handle missing fields in data', () => {
      const testData = [
        { name: 'Alice' },
        { age: 30 },
        { name: 'Bob', age: 25 }
      ];

      manager.setData(testData);
      manager.addSortColumn({ field: 'name', direction: 'asc' });

      // Should not throw error
      const sortedData = manager.getSortedData();
      expect(sortedData.length).toBe(3);
    });

    it('should handle nested field paths', () => {
      const testData = [
        { user: { name: 'Charlie' } },
        { user: { name: 'Alice' } },
        { user: { name: 'Bob' } }
      ];

      manager.setData(testData);
      manager.addSortColumn({ field: 'user.name', direction: 'asc' });

      const sortedData = manager.getSortedData();
      expect(sortedData[0].user.name).toBe('Alice');
      expect(sortedData[1].user.name).toBe('Bob');
      expect(sortedData[2].user.name).toBe('Charlie');
    });

    it('should return empty arrays for uninitialized data', () => {
      expect(manager.getSortedIndices()).toEqual([]);
      expect(manager.getSortedData()).toEqual([]);
    });

    it('should handle rapid sort model changes', () => {
      const testData = [{ name: 'Alice' }, { name: 'Bob' }];
      manager.setData(testData);

      // Rapid changes
      manager.addSortColumn({ field: 'name', direction: 'asc' });
      manager.toggleSortColumn('name');
      manager.removeSortColumn('name');
      manager.addSortColumn({ field: 'name', direction: 'desc' });

      const sortModel = manager.getSortModel();
      expect(sortModel.columns.length).toBe(1);
      expect(sortModel.columns[0].direction).toBe('desc');
    });
  });
});
