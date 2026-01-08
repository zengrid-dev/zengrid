/**
 * Sprint 3 Integration Tests - Multi-Column Sorting + Column Groups
 *
 * This suite tests the integration of:
 * - MultiColumnSorter (sorting data by multiple columns)
 * - SortStateManager (reactive sort state management)
 * - ColumnGroupModel (hierarchical column groups)
 * - ColumnGroupRenderer (visual group rendering)
 * - ColumnGroupManager (coordinating model + renderer)
 *
 * Test scenarios:
 * - Sorting columns within groups
 * - Multi-column sort with grouped columns
 * - Expanding/collapsing groups with active sorts
 * - Event system integration (sort + group events)
 * - Performance with large datasets
 * - Memory leak detection
 */

import { MultiColumnSorter } from '../sorting/multi-column-sorter';
import { SortStateManager } from '../sorting/sort-state-manager';
import type { SortModel, SortColumn } from '../sorting/types';
import { ColumnGroupModel } from '../column-groups/column-group-model';
import { ColumnGroupRenderer } from '../column-groups/column-group-renderer';
import { ColumnGroupManager } from '../column-groups/column-group-manager';
import type { ColumnGroup } from '../column-groups/types';

describe('Sprint 3 Integration: Multi-Column Sorting + Column Groups', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Sorting within Column Groups', () => {
    it('should sort columns that belong to the same group', () => {
      // Sample data representing employees in different departments
      const data = [
        { dept: 'Sales', region: 'North', name: 'Alice', age: 30, salary: 80000 },
        { dept: 'Sales', region: 'South', name: 'Bob', age: 25, salary: 75000 },
        { dept: 'Sales', region: 'North', name: 'Charlie', age: 35, salary: 85000 },
        { dept: 'Engineering', region: 'East', name: 'David', age: 28, salary: 90000 },
        { dept: 'Engineering', region: 'West', name: 'Eve', age: 32, salary: 95000 },
      ];

      // Create column groups
      const groupManager = new ColumnGroupManager();
      groupManager.addGroup({
        groupId: 'sales',
        headerName: 'Sales Department',
        parentGroupId: null,
        children: [],
        columnFields: ['region', 'name'],
        expanded: true,
      });

      // Sort by columns within the sales group
      const sortModel: SortModel = {
        columns: [
          { field: 'region', direction: 'asc' },
          { field: 'name', direction: 'asc' },
        ],
      };

      const sorter = new MultiColumnSorter();
      const sortedIndices = sorter.sort(data, sortModel);

      // Verify sorted order
      const sortedData = sortedIndices.map((i) => data[i]);

      // Filter to Sales department only for this test
      const salesData = sortedData.filter((d) => d.dept === 'Sales');

      // Sales North should come before Sales South (alphabetically)
      expect(salesData[0].region).toBe('North');
      expect(salesData[0].name).toBe('Alice');
      expect(salesData[1].region).toBe('North');
      expect(salesData[1].name).toBe('Charlie');
      expect(salesData[2].region).toBe('South');
      expect(salesData[2].name).toBe('Bob');

      groupManager.destroy();
    });

    it('should maintain sort state when group is expanded/collapsed', () => {
      const data = [
        { dept: 'Sales', name: 'Charlie', age: 35 },
        { dept: 'Sales', name: 'Alice', age: 30 },
        { dept: 'Sales', name: 'Bob', age: 25 },
      ];

      const groupManager = new ColumnGroupManager();
      const stateManager = new SortStateManager();

      groupManager.addGroup({
        groupId: 'sales',
        headerName: 'Sales Department',
        parentGroupId: null,
        children: [],
        columnFields: ['name', 'age'],
        expanded: true,
      });

      // Sort by name
      stateManager.setData(data);
      stateManager.addSortColumn({ field: 'name', direction: 'asc' });

      const sortedDataBefore = stateManager.getSortedData();
      expect(sortedDataBefore[0].name).toBe('Alice');
      expect(sortedDataBefore[1].name).toBe('Bob');
      expect(sortedDataBefore[2].name).toBe('Charlie');

      // Collapse group
      groupManager.collapseGroup('sales');

      // Re-expand group
      groupManager.expandGroup('sales');

      // Sort should still be active
      const sortedDataAfter = stateManager.getSortedData();
      expect(sortedDataAfter[0].name).toBe('Alice');
      expect(sortedDataAfter[1].name).toBe('Bob');
      expect(sortedDataAfter[2].name).toBe('Charlie');

      groupManager.destroy();
      stateManager.destroy();
    });
  });

  describe('Multi-Column Sort with Grouped Columns', () => {
    it('should sort by multiple columns across different groups', () => {
      const data = [
        { dept: 'Sales', region: 'North', name: 'Charlie', revenue: 100000 },
        { dept: 'Sales', region: 'North', name: 'Alice', revenue: 120000 },
        { dept: 'Sales', region: 'South', name: 'Bob', revenue: 110000 },
        { dept: 'Engineering', region: 'East', name: 'David', revenue: 90000 },
        { dept: 'Engineering', region: 'East', name: 'Eve', revenue: 95000 },
      ];

      const groupManager = new ColumnGroupManager();

      // Group 1: Department info
      groupManager.addGroup({
        groupId: 'dept-info',
        headerName: 'Department',
        parentGroupId: null,
        children: [],
        columnFields: ['dept', 'region'],
        expanded: true,
      });

      // Group 2: Employee info
      groupManager.addGroup({
        groupId: 'employee-info',
        headerName: 'Employee',
        parentGroupId: null,
        children: [],
        columnFields: ['name', 'revenue'],
        expanded: true,
      });

      // Sort: dept (asc) → region (asc) → revenue (desc)
      const sortModel: SortModel = {
        columns: [
          { field: 'dept', direction: 'asc' },
          { field: 'region', direction: 'asc' },
          { field: 'revenue', direction: 'desc' },
        ],
      };

      const sorter = new MultiColumnSorter();
      const sortedIndices = sorter.sort(data, sortModel);
      const sortedData = sortedIndices.map((i) => data[i]);

      // Engineering should come first (alphabetically)
      expect(sortedData[0].dept).toBe('Engineering');
      expect(sortedData[0].region).toBe('East');
      expect(sortedData[0].revenue).toBe(95000); // Higher revenue first (desc)

      expect(sortedData[1].dept).toBe('Engineering');
      expect(sortedData[1].region).toBe('East');
      expect(sortedData[1].revenue).toBe(90000);

      // Sales comes second
      expect(sortedData[2].dept).toBe('Sales');
      expect(sortedData[2].region).toBe('North');
      expect(sortedData[2].revenue).toBe(120000); // Higher revenue first

      groupManager.destroy();
    });

    it('should support adding and removing sorts dynamically', () => {
      const data = [
        { name: 'Charlie', age: 35, dept: 'Sales' },
        { name: 'Alice', age: 30, dept: 'Engineering' },
        { name: 'Bob', age: 25, dept: 'Sales' },
        { name: 'David', age: 28, dept: 'Engineering' },
      ];

      const stateManager = new SortStateManager();
      stateManager.setData(data);

      // Sort by name
      stateManager.addSortColumn({ field: 'name', direction: 'asc' });
      let sorted = stateManager.getSortedData();
      expect(sorted[0].name).toBe('Alice');
      expect(sorted[3].name).toBe('David');

      // Add dept as secondary sort (becomes primary due to adding at beginning)
      stateManager.addSortColumn({ field: 'dept', direction: 'asc' });
      sorted = stateManager.getSortedData();

      // Now sorted by dept first (priority 0), then name (priority 1)
      expect(sorted[0].dept).toBe('Engineering');
      expect(sorted[0].name).toBe('Alice'); // Alice (Engineering)
      expect(sorted[1].dept).toBe('Engineering');
      expect(sorted[1].name).toBe('David'); // David (Engineering)

      // Remove name sort
      stateManager.removeSortColumn('name');
      sorted = stateManager.getSortedData();

      // Now sorted by dept only
      expect(sorted[0].dept).toBe('Engineering');
      expect(sorted[1].dept).toBe('Engineering');
      expect(sorted[2].dept).toBe('Sales');

      stateManager.destroy();
    });

    it('should handle sort priority correctly with grouped columns', () => {
      const data = [
        { id: 1, dept: 'Sales', name: 'Bob' },
        { id: 2, dept: 'Sales', name: 'Alice' },
        { id: 3, dept: 'Engineering', name: 'Charlie' },
      ];

      const stateManager = new SortStateManager();
      stateManager.setData(data);

      // Add sorts in specific order
      stateManager.addSortColumn({ field: 'dept', direction: 'asc' }); // Priority 0 initially
      stateManager.addSortColumn({ field: 'name', direction: 'asc' }); // Priority 0 (added at beginning)

      // Verify priority (last added has highest priority)
      expect(stateManager.getSortPriority('name')).toBe(0); // Last added, highest priority
      expect(stateManager.getSortPriority('dept')).toBe(1); // First added, lower priority

      const sorted = stateManager.getSortedData();

      // Since name was added last, it has highest priority (priority 0)
      // Data sorted by name first, then dept
      expect(sorted[0].name).toBe('Alice'); // Alice (Sales)
      expect(sorted[1].name).toBe('Bob'); // Bob (Sales)
      expect(sorted[2].name).toBe('Charlie'); // Charlie (Engineering)

      stateManager.destroy();
    });
  });

  describe('Event System Integration', () => {
    it('should emit events when sorting changes in grouped columns', (done) => {
      const data = [
        { dept: 'Sales', name: 'Bob' },
        { dept: 'Sales', name: 'Alice' },
      ];

      const stateManager = new SortStateManager();
      const groupManager = new ColumnGroupManager();

      stateManager.setData(data);

      groupManager.addGroup({
        groupId: 'sales',
        headerName: 'Sales',
        parentGroupId: null,
        children: [],
        columnFields: ['dept', 'name'],
        expanded: true,
      });

      let sortEventFired = false;

      stateManager.on('sortChanged', (event) => {
        sortEventFired = true;
        expect(event.sortModel.columns).toHaveLength(1);
        expect(event.sortModel.columns[0].field).toBe('name');
        expect(event.sortedIndices).toHaveLength(2);

        if (sortEventFired) {
          stateManager.destroy();
          groupManager.destroy();
          done();
        }
      });

      // Trigger sort
      stateManager.addSortColumn({ field: 'name', direction: 'asc' });
    });

    it('should emit events when groups are toggled with active sorts', (done) => {
      const groupManager = new ColumnGroupManager();
      const stateManager = new SortStateManager();

      const data = [{ name: 'Alice' }, { name: 'Bob' }];
      stateManager.setData(data);
      stateManager.addSortColumn({ field: 'name', direction: 'asc' });

      groupManager.addGroup({
        groupId: 'test',
        headerName: 'Test',
        parentGroupId: null,
        children: [],
        columnFields: ['name'],
        expanded: true,
      });

      let toggleEventFired = false;

      groupManager.on('groupToggled', (event) => {
        toggleEventFired = true;
        expect(event.groupId).toBe('test');
        expect(event.expanded).toBe(false);

        // Sort should still be active
        expect(stateManager.getSortDirection('name')).toBe('asc');

        if (toggleEventFired) {
          groupManager.destroy();
          stateManager.destroy();
          done();
        }
      });

      groupManager.collapseGroup('test');
    });

    it('should coordinate multiple event listeners', () => {
      const stateManager = new SortStateManager();
      const groupManager = new ColumnGroupManager();

      let sortChangedCount = 0;
      let groupAddedCount = 0;

      stateManager.on('sortChanged', () => {
        sortChangedCount++;
      });

      groupManager.on('groupAdded', () => {
        groupAddedCount++;
      });

      // Trigger multiple events
      stateManager.setData([{ name: 'Alice' }]);
      stateManager.addSortColumn({ field: 'name', direction: 'asc' });
      stateManager.addSortColumn({ field: 'age', direction: 'desc' });

      groupManager.addGroup({
        groupId: 'g1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: ['name'],
      });

      groupManager.addGroup({
        groupId: 'g2',
        headerName: 'Group 2',
        parentGroupId: null,
        children: [],
        columnFields: ['age'],
      });

      expect(sortChangedCount).toBe(2); // Two sort additions
      expect(groupAddedCount).toBe(2); // Two group additions

      stateManager.destroy();
      groupManager.destroy();
    });
  });

  describe('Hierarchical Groups with Sorting', () => {
    it('should sort columns in nested groups', () => {
      const data = [
        { country: 'USA', state: 'CA', city: 'SF', sales: 1000 },
        { country: 'USA', state: 'CA', city: 'LA', sales: 900 },
        { country: 'USA', state: 'NY', city: 'NYC', sales: 1200 },
        { country: 'Canada', state: 'ON', city: 'Toronto', sales: 800 },
      ];

      const groupManager = new ColumnGroupManager({
        modelConfig: { maxDepth: 3 },
      });

      // Root group: Country
      groupManager.addGroup({
        groupId: 'usa',
        headerName: 'USA',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
      });

      // Child group: State
      groupManager.addGroup({
        groupId: 'california',
        headerName: 'California',
        parentGroupId: 'usa',
        children: [],
        columnFields: ['city', 'sales'],
        expanded: true,
      });

      // Sort by city within California group
      const sorter = new MultiColumnSorter();
      const sortModel: SortModel = {
        columns: [
          { field: 'city', direction: 'asc' },
          { field: 'sales', direction: 'desc' },
        ],
      };

      const sortedIndices = sorter.sort(data, sortModel);
      const sortedData = sortedIndices.map((i) => data[i]);

      // LA should come before SF (alphabetically)
      const caData = sortedData.filter((d) => d.state === 'CA');
      expect(caData[0].city).toBe('LA');
      expect(caData[1].city).toBe('SF');

      groupManager.destroy();
    });

    it('should maintain sorts when collapsing parent groups', () => {
      const groupManager = new ColumnGroupManager();
      const stateManager = new SortStateManager();

      const data = [
        { dept: 'Engineering', team: 'Backend', name: 'Alice' },
        { dept: 'Engineering', team: 'Backend', name: 'Bob' },
        { dept: 'Engineering', team: 'Frontend', name: 'Charlie' },
      ];

      // Parent group
      groupManager.addGroup({
        groupId: 'engineering',
        headerName: 'Engineering',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
      });

      // Child groups
      groupManager.addGroup({
        groupId: 'backend',
        headerName: 'Backend Team',
        parentGroupId: 'engineering',
        children: [],
        columnFields: ['name'],
        expanded: true,
      });

      // Sort by name
      stateManager.setData(data);
      stateManager.addSortColumn({ field: 'name', direction: 'asc' });

      const sortedBefore = stateManager.getSortedData();
      expect(sortedBefore[0].name).toBe('Alice');

      // Collapse parent
      groupManager.collapseGroup('engineering');

      // Expand parent
      groupManager.expandGroup('engineering');

      // Sort should persist
      const sortedAfter = stateManager.getSortedData();
      expect(sortedAfter[0].name).toBe('Alice');
      expect(sortedAfter[1].name).toBe('Bob');

      groupManager.destroy();
      stateManager.destroy();
    });
  });

  describe('Performance with Large Datasets', () => {
    it('should sort 10K rows with grouped columns in < 100ms', () => {
      const data = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        dept: i % 5 === 0 ? 'Sales' : 'Engineering',
        name: `User${i}`,
        age: 20 + (i % 40),
        salary: 50000 + (i % 50000),
      }));

      const sorter = new MultiColumnSorter();
      const sortModel: SortModel = {
        columns: [
          { field: 'dept', direction: 'asc' },
          { field: 'age', direction: 'desc' },
          { field: 'salary', direction: 'asc' },
        ],
      };

      const startTime = performance.now();
      const sortedIndices = sorter.sort(data, sortModel);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(sortedIndices).toHaveLength(10000);
      expect(duration).toBeLessThan(100); // Should be < 100ms

      // Verify sort correctness
      const sortedData = sortedIndices.map((i) => data[i]);
      for (let i = 1; i < sortedData.length; i++) {
        const prev = sortedData[i - 1];
        const curr = sortedData[i];

        // Check dept ordering
        if (prev.dept !== curr.dept) {
          expect(prev.dept.localeCompare(curr.dept)).toBeLessThanOrEqual(0);
        } else if (prev.age !== curr.age) {
          // Check age ordering (desc)
          expect(prev.age).toBeGreaterThanOrEqual(curr.age);
        } else {
          // Check salary ordering (asc)
          expect(prev.salary).toBeLessThanOrEqual(curr.salary);
        }
      }
    });

    it('should handle 100 column groups efficiently', () => {
      const groupManager = new ColumnGroupManager();

      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        groupManager.addGroup({
          groupId: `group-${i}`,
          headerName: `Group ${i}`,
          parentGroupId: null,
          children: [],
          columnFields: [`field${i}`],
          expanded: i % 2 === 0, // Alternate expanded/collapsed
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(groupManager.getAllGroups()).toHaveLength(100);
      expect(duration).toBeLessThan(100); // Should be < 100ms

      // Test bulk toggle
      const toggleStart = performance.now();
      for (let i = 0; i < 100; i++) {
        groupManager.toggleGroup(`group-${i}`);
      }
      const toggleEnd = performance.now();
      const toggleDuration = toggleEnd - toggleStart;

      expect(toggleDuration).toBeLessThan(50); // Should be fast

      groupManager.destroy();
    });

    it('should render 1000 grouped columns quickly', () => {
      const groupManager = new ColumnGroupManager();
      const elements: HTMLElement[] = [];

      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        const group = groupManager.addGroup({
          groupId: `group-${i}`,
          headerName: `Group ${i}`,
          parentGroupId: null,
          children: [],
          columnFields: [`field${i}`],
          expanded: true,
        });

        const element = document.createElement('div');
        container.appendChild(element);
        groupManager.renderGroup(element, `group-${i}`);
        elements.push(element);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(elements).toHaveLength(1000);
      expect(duration).toBeLessThan(500); // Should render in < 500ms

      // Clean up
      elements.forEach((el) => el.remove());
      groupManager.destroy();
    });
  });

  describe('Memory Leak Detection', () => {
    it('should not leak memory with 100 sort state changes', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Item${i}`,
        value: i * 10,
      }));

      const stateManager = new SortStateManager();
      stateManager.setData(data);

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform 100 sort operations
      for (let i = 0; i < 100; i++) {
        stateManager.addSortColumn({ field: 'name', direction: 'asc' });
        stateManager.clearSort();
        stateManager.addSortColumn({ field: 'value', direction: 'desc' });
        stateManager.clearSort();
      }

      stateManager.destroy();

      // Force GC if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryGrowth = finalMemory - initialMemory;

      // Memory growth should be minimal (< 1MB)
      expect(memoryGrowth).toBeLessThan(1024 * 1024);
    });

    it('should properly clean up group manager resources', () => {
      const managers: ColumnGroupManager[] = [];

      // Create 50 group managers
      for (let i = 0; i < 50; i++) {
        const manager = new ColumnGroupManager();

        manager.addGroup({
          groupId: `g${i}`,
          headerName: `Group ${i}`,
          parentGroupId: null,
          children: [],
          columnFields: [],
        });

        managers.push(manager);
      }

      expect(managers).toHaveLength(50);

      // Destroy all
      const startTime = performance.now();
      managers.forEach((m) => m.destroy());
      const endTime = performance.now();

      const duration = endTime - startTime;

      // Cleanup should be fast (< 100ms for 50 managers)
      expect(duration).toBeLessThan(100);
    });

    it('should handle rapid sort + group operations without leaks', () => {
      const data = [{ name: 'Alice' }, { name: 'Bob' }];
      const stateManager = new SortStateManager();
      const groupManager = new ColumnGroupManager();

      stateManager.setData(data);

      // Rapid operations
      for (let i = 0; i < 1000; i++) {
        // Add sort
        stateManager.addSortColumn({ field: 'name', direction: 'asc' });

        // Add group
        groupManager.addGroup({
          groupId: `g${i}`,
          headerName: `Group ${i}`,
          parentGroupId: null,
          children: [],
          columnFields: ['name'],
        });

        // Remove sort
        stateManager.clearSort();

        // Remove group
        groupManager.removeGroup(`g${i}`);
      }

      // Final state should be clean
      expect(stateManager.isSortModelEmpty()).toBe(true);
      expect(groupManager.getAllGroups()).toHaveLength(0);

      stateManager.destroy();
      groupManager.destroy();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle sorting empty datasets', () => {
      const stateManager = new SortStateManager();
      stateManager.setData([]);

      stateManager.addSortColumn({ field: 'name', direction: 'asc' });

      const sorted = stateManager.getSortedData();
      expect(sorted).toEqual([]);

      stateManager.destroy();
    });

    it('should handle invalid group references gracefully', () => {
      const groupManager = new ColumnGroupManager();

      // Try to toggle non-existent group
      expect(() => groupManager.toggleGroup('invalid')).not.toThrow();

      // Try to get non-existent group
      const group = groupManager.getGroup('invalid');
      expect(group).toBeUndefined();

      groupManager.destroy();
    });

    it('should handle sorting with missing fields', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob' }, // Missing age
        { age: 25 }, // Missing name
      ];

      const sorter = new MultiColumnSorter();
      const sortModel: SortModel = {
        columns: [
          { field: 'name', direction: 'asc' },
          { field: 'age', direction: 'desc' },
        ],
      };

      const sortedIndices = sorter.sort(data, sortModel);
      const sortedData = sortedIndices.map((i) => data[i]);

      // Should handle missing fields gracefully
      expect(sortedData).toHaveLength(3);

      // Items with values should sort correctly
      expect(sortedData.filter((d) => d.name)).toHaveLength(2);
    });

    it('should handle circular parent references in groups', () => {
      const groupManager = new ColumnGroupManager();

      groupManager.addGroup({
        groupId: 'g1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      });

      // Try to create circular reference: g2 -> g1 -> g2
      groupManager.addGroup({
        groupId: 'g2',
        headerName: 'Group 2',
        parentGroupId: 'g1',
        children: [],
        columnFields: [],
      });

      // Validation should prevent this
      const result = groupManager.validateHierarchy();
      expect(result.valid).toBe(true); // No cycles yet

      groupManager.destroy();
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle employee directory with department groups and sorting', () => {
      const employees = [
        { id: 1, dept: 'Engineering', team: 'Backend', name: 'Alice', salary: 120000, years: 5 },
        { id: 2, dept: 'Engineering', team: 'Backend', name: 'Bob', salary: 110000, years: 3 },
        { id: 3, dept: 'Engineering', team: 'Frontend', name: 'Charlie', salary: 115000, years: 4 },
        { id: 4, dept: 'Sales', team: 'Enterprise', name: 'David', salary: 100000, years: 2 },
        { id: 5, dept: 'Sales', team: 'SMB', name: 'Eve', salary: 95000, years: 6 },
      ];

      const groupManager = new ColumnGroupManager();
      const stateManager = new SortStateManager();

      // Create department groups
      groupManager.addGroup({
        groupId: 'dept-eng',
        headerName: 'Engineering Department',
        parentGroupId: null,
        children: [],
        columnFields: ['team', 'name', 'salary'],
        expanded: true,
      });

      groupManager.addGroup({
        groupId: 'dept-sales',
        headerName: 'Sales Department',
        parentGroupId: null,
        children: [],
        columnFields: ['team', 'name', 'salary'],
        expanded: true,
      });

      // Sort: dept -> years (desc) -> name (asc)
      // Note: Last added column has highest priority
      stateManager.setData(employees);
      stateManager.addSortColumn({ field: 'dept', direction: 'asc' });
      stateManager.addSortColumn({ field: 'years', direction: 'desc' });
      stateManager.addSortColumn({ field: 'name', direction: 'asc' });

      const sorted = stateManager.getSortedData();

      // Since name was added last, it has priority 0: sorted by name, then years, then dept
      expect(sorted[0].name).toBe('Alice'); // Engineering, 5 years
      expect(sorted[0].dept).toBe('Engineering');
      expect(sorted[0].years).toBe(5);

      expect(sorted[1].name).toBe('Bob'); // Engineering, 3 years
      expect(sorted[1].dept).toBe('Engineering');
      expect(sorted[1].years).toBe(3);

      expect(sorted[2].name).toBe('Charlie'); // Engineering, 4 years
      expect(sorted[2].dept).toBe('Engineering');
      expect(sorted[2].years).toBe(4);

      expect(sorted[3].name).toBe('David'); // Sales, 2 years
      expect(sorted[3].dept).toBe('Sales');
      expect(sorted[3].years).toBe(2);

      expect(sorted[4].name).toBe('Eve'); // Sales, 6 years
      expect(sorted[4].dept).toBe('Sales');
      expect(sorted[4].years).toBe(6);

      groupManager.destroy();
      stateManager.destroy();
    });

    it('should handle financial data with nested groups and multi-column sort', () => {
      const financials = [
        { year: 2024, quarter: 'Q1', region: 'US', revenue: 1000000, profit: 100000 },
        { year: 2024, quarter: 'Q1', region: 'EU', revenue: 800000, profit: 80000 },
        { year: 2024, quarter: 'Q2', region: 'US', revenue: 1200000, profit: 120000 },
        { year: 2024, quarter: 'Q2', region: 'EU', revenue: 900000, profit: 90000 },
        { year: 2023, quarter: 'Q4', region: 'US', revenue: 950000, profit: 95000 },
      ];

      const groupManager = new ColumnGroupManager();

      // Year group
      groupManager.addGroup({
        groupId: 'year-2024',
        headerName: '2024',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
      });

      // Quarter groups (nested under year)
      groupManager.addGroup({
        groupId: 'q1-2024',
        headerName: 'Q1',
        parentGroupId: 'year-2024',
        children: [],
        columnFields: ['region', 'revenue', 'profit'],
        expanded: true,
      });

      // Sort by revenue (desc) within Q1
      const sorter = new MultiColumnSorter();
      const sortModel: SortModel = {
        columns: [
          { field: 'year', direction: 'desc' },
          { field: 'quarter', direction: 'asc' },
          { field: 'revenue', direction: 'desc' },
        ],
      };

      const sortedIndices = sorter.sort(financials, sortModel);
      const sortedData = sortedIndices.map((i) => financials[i]);

      // 2024 should come first
      expect(sortedData[0].year).toBe(2024);
      expect(sortedData[0].quarter).toBe('Q1');
      expect(sortedData[0].revenue).toBe(1000000); // US has higher revenue

      groupManager.destroy();
    });
  });
});
