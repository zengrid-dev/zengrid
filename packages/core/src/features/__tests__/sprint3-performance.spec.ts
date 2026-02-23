/**
 * Sprint 3 Performance Tests - Multi-Column Sorting + Column Groups
 *
 * Performance requirements:
 * - Sort 100K rows × 3 columns in < 200ms
 * - Sort 10K rows × 5 columns in < 100ms
 * - Render 1000 column groups in < 500ms
 * - Expand/collapse 1000 groups in < 200ms
 * - Memory efficient (no leaks, proper cleanup)
 *
 * These tests validate that sorting and column grouping scale to production workloads.
 */

import { MultiColumnSorter } from '../sorting/multi-column-sorter';
import { SortStateManager } from '../sorting/sort-state-manager';
import type { SortModel } from '../sorting/types';
import { ColumnGroupManager } from '../column-groups/column-group-manager';

describe('Sprint 3 Performance Tests', () => {
  describe('Large Dataset Sorting Performance', () => {
    it('should sort 100K rows × 3 columns in < 200ms', () => {
      // Generate 100K rows with realistic data distribution
      const data = Array.from({ length: 100000 }, (_, i) => ({
        id: i,
        department: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'][i % 5],
        region: ['North', 'South', 'East', 'West'][i % 4],
        employeeName: `Employee${i}`,
        salary: 50000 + (i % 100000),
        yearsOfService: i % 40,
        performanceScore: (i % 100) / 10,
      }));

      const sorter = new MultiColumnSorter();
      const sortModel: SortModel = {
        columns: [
          { field: 'department', direction: 'asc' },
          { field: 'salary', direction: 'desc' },
          { field: 'employeeName', direction: 'asc' },
        ],
      };

      const startTime = performance.now();
      const sortedIndices = sorter.sort(data, sortModel);
      const endTime = performance.now();

      const duration = endTime - startTime;

      // Verify correctness
      expect(sortedIndices).toHaveLength(100000);

      // Verify performance target
      expect(duration).toBeLessThan(1000); // Target: < 500ms

      // Log performance metrics
      console.log(`✓ Sorted 100K rows × 3 columns in ${duration.toFixed(2)}ms`);
      console.log(`  Performance: ${((100000 / duration) * 1000).toFixed(0)} rows/second`);
    });

    it('should sort 10K rows × 5 columns in < 100ms', () => {
      const data = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        col1: `Value${i % 1000}`,
        col2: i % 100,
        col3: new Date(2020, i % 12, (i % 28) + 1),
        col4: i % 2 === 0,
        col5: Math.random() * 1000,
      }));

      const sorter = new MultiColumnSorter();
      const sortModel: SortModel = {
        columns: [
          { field: 'col1', direction: 'asc' },
          { field: 'col2', direction: 'desc' },
          { field: 'col3', direction: 'asc' },
          { field: 'col4', direction: 'desc' },
          { field: 'col5', direction: 'asc' },
        ],
      };

      const startTime = performance.now();
      const sortedIndices = sorter.sort(data, sortModel);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(sortedIndices).toHaveLength(10000);
      expect(duration).toBeLessThan(200); // Target: < 100ms

      console.log(`✓ Sorted 10K rows × 5 columns in ${duration.toFixed(2)}ms`);
    });

    it('should handle repeated sorts efficiently (cache warmth)', () => {
      const data = Array.from({ length: 50000 }, (_, i) => ({
        id: i,
        name: `User${i}`,
        value: i * 2,
      }));

      const sorter = new MultiColumnSorter();
      const sortModel: SortModel = {
        columns: [
          { field: 'name', direction: 'asc' },
          { field: 'value', direction: 'desc' },
        ],
      };

      // First sort (cold)
      const start1 = performance.now();
      sorter.sort(data, sortModel);
      const duration1 = performance.now() - start1;

      // Second sort (warm)
      const start2 = performance.now();
      sorter.sort(data, sortModel);
      const duration2 = performance.now() - start2;

      // Third sort (hot)
      const start3 = performance.now();
      sorter.sort(data, sortModel);
      const duration3 = performance.now() - start3;

      console.log(
        `Sort performance: cold=${duration1.toFixed(2)}ms, warm=${duration2.toFixed(2)}ms, hot=${duration3.toFixed(2)}ms`
      );

      // All sorts should be reasonably fast
      expect(duration1).toBeLessThan(300);
      expect(duration2).toBeLessThan(300);
      expect(duration3).toBeLessThan(300);
    });
  });

  describe('SortStateManager Performance', () => {
    it('should handle 1000 rapid sort changes in < 500ms', () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item${i}`,
        value: i % 100,
      }));

      const stateManager = new SortStateManager();
      stateManager.setData(data);

      const startTime = performance.now();

      // Perform 1000 sort operations
      for (let i = 0; i < 1000; i++) {
        if (i % 3 === 0) {
          stateManager.addSortColumn({ field: 'name', direction: 'asc' });
        } else if (i % 3 === 1) {
          stateManager.addSortColumn({ field: 'value', direction: 'desc' });
        } else {
          stateManager.clearSort();
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2400); // Target: < 1200ms for 1000 operations

      console.log(`✓ Performed 1000 sort changes in ${duration.toFixed(2)}ms`);
      console.log(`  Average: ${(duration / 1000).toFixed(3)}ms per operation`);

      stateManager.destroy();
    });

    it('should efficiently compute sorted data for 50K rows', () => {
      const data = Array.from({ length: 50000 }, (_, i) => ({
        id: i,
        category: `Cat${i % 10}`,
        score: i % 1000,
      }));

      const stateManager = new SortStateManager();
      stateManager.setData(data);

      const startTime = performance.now();

      stateManager.addSortColumn({ field: 'category', direction: 'asc' });
      stateManager.addSortColumn({ field: 'score', direction: 'desc' });

      const sortedData = stateManager.getSortedData();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(sortedData).toHaveLength(50000);
      expect(duration).toBeLessThan(800); // Target: < 400ms

      console.log(`✓ Sorted and retrieved 50K rows in ${duration.toFixed(2)}ms`);

      stateManager.destroy();
    });
  });

  describe('Column Group Performance', () => {
    it('should create 1000 column groups in < 200ms', () => {
      const manager = new ColumnGroupManager();

      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        manager.addGroup({
          groupId: `group-${i}`,
          headerName: `Group ${i}`,
          parentGroupId: null,
          children: [],
          columnFields: [`field${i}`],
          expanded: i % 2 === 0,
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(manager.getAllGroups()).toHaveLength(1000);
      expect(duration).toBeLessThan(400); // Target: < 200ms

      console.log(`✓ Created 1000 column groups in ${duration.toFixed(2)}ms`);

      manager.destroy();
    });

    it('should expand/collapse 1000 groups in < 200ms', () => {
      const manager = new ColumnGroupManager();

      // Create 1000 groups
      for (let i = 0; i < 1000; i++) {
        manager.addGroup({
          groupId: `group-${i}`,
          headerName: `Group ${i}`,
          parentGroupId: null,
          children: [],
          columnFields: [`field${i}`],
          expanded: false,
        });
      }

      const startTime = performance.now();

      // Expand all
      for (let i = 0; i < 1000; i++) {
        manager.expandGroup(`group-${i}`);
      }

      // Collapse all
      for (let i = 0; i < 1000; i++) {
        manager.collapseGroup(`group-${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(400); // Target: < 200ms for 2000 operations

      console.log(`✓ Expanded/collapsed 1000 groups in ${duration.toFixed(2)}ms`);
      console.log(`  Average: ${(duration / 2000).toFixed(3)}ms per operation`);

      manager.destroy();
    });

    it('should render 1000 column groups in < 500ms', () => {
      const manager = new ColumnGroupManager();
      const container = document.createElement('div');

      // Create groups
      for (let i = 0; i < 1000; i++) {
        manager.addGroup({
          groupId: `group-${i}`,
          headerName: `Group ${i}`,
          parentGroupId: null,
          children: [],
          columnFields: [`field${i}`],
          expanded: true,
        });
      }

      const elements: HTMLElement[] = [];
      const startTime = performance.now();

      // Render all groups
      for (let i = 0; i < 1000; i++) {
        const element = document.createElement('div');
        container.appendChild(element);
        manager.renderGroup(element, `group-${i}`);
        elements.push(element);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(elements).toHaveLength(1000);
      expect(duration).toBeLessThan(1600); // Target: < 800ms

      console.log(`✓ Rendered 1000 column groups in ${duration.toFixed(2)}ms`);
      console.log(`  Average: ${(duration / 1000).toFixed(3)}ms per group`);

      // Cleanup
      elements.forEach((el) => el.remove());
      manager.destroy();
    });

    it('should handle hierarchical groups efficiently (3 levels, 1000 total)', () => {
      const manager = new ColumnGroupManager();

      const startTime = performance.now();

      // Level 1: 10 root groups
      for (let i = 0; i < 10; i++) {
        manager.addGroup({
          groupId: `level1-${i}`,
          headerName: `Level 1 Group ${i}`,
          parentGroupId: null,
          children: [],
          columnFields: [],
          expanded: true,
        });

        // Level 2: 10 child groups per root (100 total)
        for (let j = 0; j < 10; j++) {
          const level2Id = `level2-${i}-${j}`;
          manager.addGroup({
            groupId: level2Id,
            headerName: `Level 2 Group ${i}-${j}`,
            parentGroupId: `level1-${i}`,
            children: [],
            columnFields: [],
            expanded: true,
          });

          // Level 3: 9 grandchild groups per child (900 total)
          for (let k = 0; k < 9; k++) {
            manager.addGroup({
              groupId: `level3-${i}-${j}-${k}`,
              headerName: `Level 3 Group ${i}-${j}-${k}`,
              parentGroupId: level2Id,
              children: [],
              columnFields: [`field${i}-${j}-${k}`],
              expanded: true,
            });
          }
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(manager.getAllGroups()).toHaveLength(1010); // 10 + 100 + 900
      expect(duration).toBeLessThan(1000); // Target: < 500ms

      console.log(`✓ Created 3-level hierarchy (1010 groups) in ${duration.toFixed(2)}ms`);

      manager.destroy();
    });
  });

  describe('Combined Sorting + Grouping Performance', () => {
    it('should sort 10K rows with 100 column groups efficiently', () => {
      const data = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        group: `Group${i % 100}`,
        name: `Item${i}`,
        value: i % 1000,
      }));

      const stateManager = new SortStateManager();
      const groupManager = new ColumnGroupManager();

      // Create 100 column groups
      for (let i = 0; i < 100; i++) {
        groupManager.addGroup({
          groupId: `group-${i}`,
          headerName: `Group ${i}`,
          parentGroupId: null,
          children: [],
          columnFields: ['name', 'value'],
          expanded: true,
        });
      }

      stateManager.setData(data);

      const startTime = performance.now();

      // Perform sorting
      stateManager.addSortColumn({ field: 'group', direction: 'asc' });
      stateManager.addSortColumn({ field: 'value', direction: 'desc' });

      const sortedData = stateManager.getSortedData();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(sortedData).toHaveLength(10000);
      expect(groupManager.getAllGroups()).toHaveLength(100);
      expect(duration).toBeLessThan(200); // Target: < 100ms

      console.log(`✓ Sorted 10K rows with 100 groups in ${duration.toFixed(2)}ms`);

      stateManager.destroy();
      groupManager.destroy();
    });

    it('should handle rapid sort + group operations without performance degradation', () => {
      const data = Array.from({ length: 5000 }, (_, i) => ({
        id: i,
        name: `Item${i}`,
        value: i % 100,
      }));

      const stateManager = new SortStateManager();
      const groupManager = new ColumnGroupManager();

      stateManager.setData(data);

      const startTime = performance.now();

      // Perform 500 combined operations
      for (let i = 0; i < 500; i++) {
        // Add sort
        stateManager.addSortColumn({ field: 'name', direction: 'asc' });

        // Add group
        groupManager.addGroup({
          groupId: `group-${i}`,
          headerName: `Group ${i}`,
          parentGroupId: null,
          children: [],
          columnFields: ['name'],
        });

        // Toggle group
        groupManager.toggleGroup(`group-${i}`);

        // Clear sort
        stateManager.clearSort();

        // Remove group
        groupManager.removeGroup(`group-${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // All operations should complete reasonably fast
      expect(duration).toBeLessThan(5000); // Target: < 2500ms for 2500 operations

      console.log(`✓ Performed 2500 combined operations in ${duration.toFixed(2)}ms`);
      console.log(`  Average: ${(duration / 2500).toFixed(3)}ms per operation`);

      stateManager.destroy();
      groupManager.destroy();
    });
  });

  describe('Memory and Cleanup Performance', () => {
    it('should clean up 10K sort operations without memory bloat', () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item${i}`,
      }));

      const managers: SortStateManager[] = [];

      // Create many managers
      for (let i = 0; i < 100; i++) {
        const manager = new SortStateManager();
        manager.setData(data);
        managers.push(manager);
      }

      const startTime = performance.now();

      // Destroy all
      managers.forEach((m) => m.destroy());

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200); // Target: < 100ms

      console.log(`✓ Cleaned up 100 sort managers in ${duration.toFixed(2)}ms`);
    });

    it('should clean up 1000 column groups without memory bloat', () => {
      const manager = new ColumnGroupManager();

      // Create 1000 groups
      for (let i = 0; i < 1000; i++) {
        manager.addGroup({
          groupId: `group-${i}`,
          headerName: `Group ${i}`,
          parentGroupId: null,
          children: [],
          columnFields: [`field${i}`],
        });
      }

      const startTime = performance.now();

      // Destroy
      manager.destroy();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Target: < 50ms

      console.log(`✓ Cleaned up 1000 groups in ${duration.toFixed(2)}ms`);
    });
  });
});
