/**
 * MultiColumnSorter Tests
 *
 * Comprehensive test suite for multi-column sorting functionality
 */

import { MultiColumnSorter } from '../multi-column-sorter';
import { SortModel, Comparators } from '../types';

describe('MultiColumnSorter', () => {
  let sorter: MultiColumnSorter;

  beforeEach(() => {
    sorter = new MultiColumnSorter();
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe('Basic Sorting', () => {
    it('should sort numbers in ascending order', () => {
      const data = [
        { id: 3, name: 'C' },
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ];

      const sortModel: SortModel = {
        columns: [{ field: 'id', direction: 'asc' }],
      };

      const result = sorter.sort(data, sortModel);
      expect(result).toEqual([1, 2, 0]); // Indices: A=1, B=2, C=0
    });

    it('should sort numbers in descending order', () => {
      const data = [
        { id: 3, name: 'C' },
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ];

      const sortModel: SortModel = {
        columns: [{ field: 'id', direction: 'desc' }],
      };

      const result = sorter.sort(data, sortModel);
      expect(result).toEqual([0, 2, 1]); // Indices: C=0, B=2, A=1
    });

    it('should sort strings in ascending order', () => {
      const data = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];

      const sortModel: SortModel = {
        columns: [{ field: 'name', direction: 'asc' }],
      };

      const result = sorter.sort(data, sortModel);
      expect(result).toEqual([1, 2, 0]); // Alice, Bob, Charlie
    });

    it('should sort strings in descending order', () => {
      const data = [{ name: 'Alice' }, { name: 'Charlie' }, { name: 'Bob' }];

      const sortModel: SortModel = {
        columns: [{ field: 'name', direction: 'desc' }],
      };

      const result = sorter.sort(data, sortModel);
      expect(result).toEqual([1, 2, 0]); // Charlie, Bob, Alice
    });

    it('should handle empty data array', () => {
      const data: any[] = [];
      const sortModel: SortModel = {
        columns: [{ field: 'id', direction: 'asc' }],
      };

      const result = sorter.sort(data, sortModel);
      expect(result).toEqual([]);
    });

    it('should handle empty sort columns', () => {
      const data = [{ id: 3 }, { id: 1 }, { id: 2 }];
      const sortModel: SortModel = { columns: [] };

      const result = sorter.sort(data, sortModel);
      expect(result).toEqual([0, 1, 2]); // Original order
    });

    it('should handle single element array', () => {
      const data = [{ id: 1 }];
      const sortModel: SortModel = {
        columns: [{ field: 'id', direction: 'asc' }],
      };

      const result = sorter.sort(data, sortModel);
      expect(result).toEqual([0]);
    });
  });

  describe('Multi-Column Sorting', () => {
    it('should sort by multiple columns with priority', () => {
      const data = [
        { dept: 'Sales', age: 30, name: 'John' },
        { dept: 'Engineering', age: 25, name: 'Alice' },
        { dept: 'Engineering', age: 30, name: 'Bob' },
        { dept: 'Sales', age: 25, name: 'Carol' },
      ];

      const sortModel: SortModel = {
        columns: [
          { field: 'dept', direction: 'asc', priority: 0 },
          { field: 'age', direction: 'desc', priority: 1 },
          { field: 'name', direction: 'asc', priority: 2 },
        ],
      };

      const result = sorter.sort(data, sortModel);

      // Expected order:
      // 1. Engineering, 30, Bob (index 2)
      // 2. Engineering, 25, Alice (index 1)
      // 3. Sales, 30, John (index 0)
      // 4. Sales, 25, Carol (index 3)
      expect(result).toEqual([2, 1, 0, 3]);
    });

    it('should use array order as priority if not specified', () => {
      const data = [
        { dept: 'B', level: 2 },
        { dept: 'A', level: 1 },
        { dept: 'A', level: 2 },
      ];

      const sortModel: SortModel = {
        columns: [
          { field: 'dept', direction: 'asc' },
          { field: 'level', direction: 'asc' },
        ],
      };

      const result = sorter.sort(data, sortModel);
      // A-1, A-2, B-2
      expect(result).toEqual([1, 2, 0]);
    });

    it('should respect explicit priority over array order', () => {
      const data = [
        { a: 2, b: 2 },
        { a: 1, b: 1 },
        { a: 1, b: 2 },
      ];

      const sortModel: SortModel = {
        columns: [
          { field: 'b', direction: 'asc', priority: 0 }, // Higher priority
          { field: 'a', direction: 'asc', priority: 1 }, // Lower priority
        ],
      };

      const result = sorter.sort(data, sortModel);
      // Sort by b first (priority 0), then by a
      // b=1,a=1 -> b=2,a=1 -> b=2,a=2
      expect(result).toEqual([1, 2, 0]);
    });
  });

  describe('Custom Comparators', () => {
    it('should use custom comparator when provided', () => {
      const data = [{ value: 'a' }, { value: 'C' }, { value: 'B' }];

      // Case-insensitive comparator
      const caseInsensitiveComparator = (a: any, b: any) => {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      };

      const sortModel: SortModel = {
        columns: [
          {
            field: 'value',
            direction: 'asc',
            comparator: caseInsensitiveComparator,
          },
        ],
      };

      const result = sorter.sort(data, sortModel);
      expect(result).toEqual([0, 2, 1]); // a, B, C
    });

    it('should use different comparators for different columns', () => {
      const data = [
        { name: 'alice', score: '90' },
        { name: 'Bob', score: '100' },
        { name: 'Charlie', score: '85' },
      ];

      const sortModel: SortModel = {
        columns: [
          {
            field: 'name',
            direction: 'asc',
            comparator: Comparators.stringCaseInsensitive,
          },
          {
            field: 'score',
            direction: 'desc',
            comparator: Comparators.number,
          },
        ],
      };

      const result = sorter.sort(data, sortModel);
      // alice, Bob, Charlie (case-insensitive name sort)
      expect(result).toEqual([0, 1, 2]);
    });
  });

  describe('Default Comparators', () => {
    it('should handle null and undefined values with number comparator', () => {
      const data = [
        { value: 5 },
        { value: null },
        { value: 3 },
        { value: undefined },
        { value: 1 },
      ];

      const sortModel: SortModel = {
        columns: [
          {
            field: 'value',
            direction: 'asc',
            comparator: Comparators.number,
          },
        ],
      };

      const result = sorter.sort(data, sortModel);
      const sortedValues = result.map((i) => data[i].value);

      // Separate numbers from null/undefined values
      const numbers = sortedValues.filter((v) => typeof v === 'number' && !isNaN(v));
      const nullish = sortedValues.filter((v) => v == null);

      // Numbers should be sorted (1, 3, 5)
      expect(numbers).toEqual([1, 3, 5]);

      // Null/undefined should be separate (2 values)
      expect(nullish.length).toBe(2);
      expect(nullish).toContain(null);
      expect(nullish).toContain(undefined);
    });

    it('should handle dates with date comparator', () => {
      const data = [
        { date: new Date('2024-03-15') },
        { date: new Date('2024-01-10') },
        { date: new Date('2024-12-25') },
      ];

      const sortModel: SortModel = {
        columns: [
          {
            field: 'date',
            direction: 'asc',
            comparator: Comparators.date,
          },
        ],
      };

      const result = sorter.sort(data, sortModel);
      expect(result).toEqual([1, 0, 2]); // Jan, Mar, Dec
    });

    it('should handle boolean values with boolean comparator', () => {
      const data = [{ active: true }, { active: false }, { active: true }, { active: false }];

      const sortModel: SortModel = {
        columns: [
          {
            field: 'active',
            direction: 'asc',
            comparator: Comparators.boolean,
          },
        ],
      };

      const result = sorter.sort(data, sortModel);
      const sortedValues = result.map((i) => data[i].active);

      // false < true, so false values come first
      expect(sortedValues[0]).toBe(false);
      expect(sortedValues[1]).toBe(false);
      expect(sortedValues[2]).toBe(true);
      expect(sortedValues[3]).toBe(true);
    });

    it('should auto-detect types with auto comparator', () => {
      const data = [{ value: 10 }, { value: 'apple' }, { value: 5 }, { value: 'banana' }];

      const sortModel: SortModel = {
        columns: [
          {
            field: 'value',
            direction: 'asc',
            comparator: Comparators.auto,
          },
        ],
      };

      const result = sorter.sort(data, sortModel);
      // Numbers: 5, 10; Strings: apple, banana
      // With auto comparator, comparison depends on first comparison
      expect(result.length).toBe(4);
    });
  });

  describe('Nested Field Paths', () => {
    it('should sort by nested field using dot notation', () => {
      const data = [
        { user: { name: 'Charlie', age: 30 } },
        { user: { name: 'Alice', age: 25 } },
        { user: { name: 'Bob', age: 35 } },
      ];

      const sortModel: SortModel = {
        columns: [{ field: 'user.name', direction: 'asc' }],
      };

      const result = sorter.sort(data, sortModel);
      expect(result).toEqual([1, 2, 0]); // Alice, Bob, Charlie
    });

    it('should handle deeply nested fields', () => {
      const data = [
        { company: { department: { team: { lead: 'Z' } } } },
        { company: { department: { team: { lead: 'A' } } } },
        { company: { department: { team: { lead: 'M' } } } },
      ];

      const sortModel: SortModel = {
        columns: [{ field: 'company.department.team.lead', direction: 'asc' }],
      };

      const result = sorter.sort(data, sortModel);
      expect(result).toEqual([1, 2, 0]); // A, M, Z
    });

    it('should handle missing nested fields gracefully', () => {
      const data = [
        { user: { name: 'Alice' } },
        { user: {} }, // name is missing
        { user: { name: 'Bob' } },
      ];

      const sortModel: SortModel = {
        columns: [{ field: 'user.name', direction: 'asc' }],
      };

      const result = sorter.sort(data, sortModel);
      // Undefined values should sort to end
      const sortedData = result.map((i) => data[i].user.name);
      expect(sortedData[2]).toBeUndefined();
    });

    it('should handle null objects in path', () => {
      const data = [{ user: { name: 'Alice' } }, { user: null }, { user: { name: 'Bob' } }];

      const sortModel: SortModel = {
        columns: [{ field: 'user.name', direction: 'asc' }],
      };

      const result = sorter.sort(data, sortModel);
      // Should not throw error
      expect(result.length).toBe(3);
    });
  });

  describe('Sort Model Operations', () => {
    it('should add a sort column', () => {
      const sortModel: SortModel = {
        columns: [{ field: 'name', direction: 'asc' }],
      };

      const newSortModel = sorter.addSortColumn(sortModel, {
        field: 'age',
        direction: 'desc',
      });

      expect(newSortModel.columns.length).toBe(2);
      expect(newSortModel.columns[0].field).toBe('age'); // New column has highest priority
      expect(newSortModel.columns[1].field).toBe('name');
    });

    it('should replace existing sort when adding same field', () => {
      const sortModel: SortModel = {
        columns: [
          { field: 'name', direction: 'asc' },
          { field: 'age', direction: 'desc' },
        ],
      };

      const newSortModel = sorter.addSortColumn(sortModel, {
        field: 'age',
        direction: 'asc', // Changed direction
      });

      expect(newSortModel.columns.length).toBe(2);
      const ageColumn = newSortModel.columns.find((c) => c.field === 'age');
      expect(ageColumn?.direction).toBe('asc');
    });

    it('should remove a sort column', () => {
      const sortModel: SortModel = {
        columns: [
          { field: 'name', direction: 'asc' },
          { field: 'age', direction: 'desc' },
        ],
      };

      const newSortModel = sorter.removeSortColumn(sortModel, 'age');

      expect(newSortModel.columns.length).toBe(1);
      expect(newSortModel.columns[0].field).toBe('name');
    });

    it('should toggle sort column: add -> asc -> desc -> remove', () => {
      let sortModel: SortModel = { columns: [] };

      // Toggle 1: Add with default direction (asc)
      sortModel = sorter.toggleSortColumn(sortModel, 'name');
      expect(sortModel.columns.length).toBe(1);
      expect(sortModel.columns[0].direction).toBe('asc');

      // Toggle 2: Change to desc
      sortModel = sorter.toggleSortColumn(sortModel, 'name');
      expect(sortModel.columns.length).toBe(1);
      expect(sortModel.columns[0].direction).toBe('desc');

      // Toggle 3: Remove
      sortModel = sorter.toggleSortColumn(sortModel, 'name');
      expect(sortModel.columns.length).toBe(0);
    });

    it('should clear all sorts', () => {
      const sortModel = sorter.clearSort();
      expect(sortModel.columns.length).toBe(0);
    });

    it('should get sort direction for a field', () => {
      const sortModel: SortModel = {
        columns: [
          { field: 'name', direction: 'asc' },
          { field: 'age', direction: 'desc' },
        ],
      };

      expect(sorter.getSortDirection(sortModel, 'name')).toBe('asc');
      expect(sorter.getSortDirection(sortModel, 'age')).toBe('desc');
      expect(sorter.getSortDirection(sortModel, 'unknown')).toBeNull();
    });

    it('should get sort priority for a field', () => {
      const sortModel: SortModel = {
        columns: [
          { field: 'name', direction: 'asc' },
          { field: 'age', direction: 'desc' },
          { field: 'dept', direction: 'asc' },
        ],
      };

      expect(sorter.getSortPriority(sortModel, 'name')).toBe(0);
      expect(sorter.getSortPriority(sortModel, 'age')).toBe(1);
      expect(sorter.getSortPriority(sortModel, 'dept')).toBe(2);
      expect(sorter.getSortPriority(sortModel, 'unknown')).toBeNull();
    });

    it('should check if sort model is empty', () => {
      expect(sorter.isSortModelEmpty({ columns: [] })).toBe(true);
      expect(sorter.isSortModelEmpty({ columns: [{ field: 'name', direction: 'asc' }] })).toBe(
        false
      );
    });
  });

  describe('Utility Methods', () => {
    it('should apply sorted indices to create sorted array', () => {
      const data = ['C', 'A', 'B'];
      const sortedIndices = [1, 2, 0];

      const sorted = sorter.applySortedIndices(data, sortedIndices);
      expect(sorted).toEqual(['A', 'B', 'C']);
    });

    it('should get inverse indices for unsort operation', () => {
      const sortedIndices = [2, 0, 1];
      const inverse = sorter.getInverseIndices(sortedIndices);

      expect(inverse).toEqual([1, 2, 0]);
      // Verify: inverse[sortedIndices[i]] === i
      for (let i = 0; i < sortedIndices.length; i++) {
        expect(inverse[sortedIndices[i]]).toBe(i);
      }
    });

    it('should sort by column convenience method', () => {
      const data = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];

      const result = sorter.sortByColumn(data, 'name', 'asc');
      expect(result).toEqual([1, 2, 0]); // Alice, Bob, Charlie
    });
  });

  describe('Options and Configuration', () => {
    it('should respect maxSortColumns option', () => {
      const sorter = new MultiColumnSorter({ maxSortColumns: 2 });
      const sortModel: SortModel = {
        columns: [
          { field: 'a', direction: 'asc' },
          { field: 'b', direction: 'asc' },
          { field: 'c', direction: 'asc' },
          { field: 'd', direction: 'asc' },
        ],
      };

      const data = [{ a: 1, b: 2, c: 3, d: 4 }];
      sorter.sort(data, sortModel); // Should only use first 2 columns

      // Verify through addSortColumn
      let model: SortModel = { columns: [] };
      model = sorter.addSortColumn(model, { field: 'a', direction: 'asc' });
      model = sorter.addSortColumn(model, { field: 'b', direction: 'asc' });
      model = sorter.addSortColumn(model, { field: 'c', direction: 'asc' });

      expect(model.columns.length).toBe(2); // Limited to maxSortColumns
    });

    it('should use defaultDirection option when toggling new column', () => {
      const sorter = new MultiColumnSorter({ defaultDirection: 'desc' });
      let sortModel: SortModel = { columns: [] };

      sortModel = sorter.toggleSortColumn(sortModel, 'name');

      expect(sortModel.columns[0].direction).toBe('desc');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle data with mixed types in same field', () => {
      const data = [
        { value: 10 },
        { value: 'text' },
        { value: 5 },
        { value: null },
        { value: undefined },
      ];

      const sortModel: SortModel = {
        columns: [{ field: 'value', direction: 'asc' }],
      };

      // Should not throw
      expect(() => sorter.sort(data, sortModel)).not.toThrow();
    });

    it('should handle very large arrays efficiently', () => {
      const size = 1000;
      const data = Array.from({ length: size }, (_, i) => ({
        id: size - i, // Reverse order
        name: `Item ${i}`,
      }));

      const sortModel: SortModel = {
        columns: [{ field: 'id', direction: 'asc' }],
      };

      const startTime = performance.now();
      const result = sorter.sort(data, sortModel);
      const endTime = performance.now();

      expect(result.length).toBe(size);
      expect(result[0]).toBe(size - 1); // Smallest id
      expect(result[size - 1]).toBe(0); // Largest id

      // Performance assertion (should be fast)
      expect(endTime - startTime).toBeLessThan(100); // < 100ms for 1000 items
    });

    it('should maintain stable sort for equal values', () => {
      const data = [
        { group: 'A', id: 0 },
        { group: 'A', id: 1 },
        { group: 'B', id: 2 },
        { group: 'A', id: 3 },
      ];

      const sortModel: SortModel = {
        columns: [{ field: 'group', direction: 'asc' }],
      };

      const result = sorter.sort(data, sortModel);

      // All 'A' groups should maintain original order (0, 1, 3)
      const aIndices = result.filter((i) => data[i].group === 'A');
      expect(aIndices).toEqual([0, 1, 3]);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should sort 10K rows in reasonable time', () => {
      const size = 10000;
      const data = Array.from({ length: size }, (_, i) => ({
        id: Math.floor(Math.random() * size),
        name: `Item ${i}`,
        category: ['A', 'B', 'C'][i % 3],
      }));

      const sortModel: SortModel = {
        columns: [
          { field: 'category', direction: 'asc' },
          { field: 'id', direction: 'desc' },
        ],
      };

      const startTime = performance.now();
      const result = sorter.sort(data, sortModel);
      const endTime = performance.now();

      expect(result.length).toBe(size);
      expect(endTime - startTime).toBeLessThan(200); // < 200ms for 10K items
    });
  });
});
