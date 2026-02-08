/**
 * SegmentTree Tests
 * Tests for findIndexAtSum method and core functionality
 */

import { SegmentTree, AggregationType } from '../../../src/data-structures/segment-tree';

describe('SegmentTree', () => {
  describe('constructor', () => {
    it('should create tree with sum aggregation', () => {
      const tree = new SegmentTree({
        values: [10, 20, 30],
        type: AggregationType.SUM,
      });
      expect(tree.total).toBe(60);
      expect(tree.size).toBe(3);
    });

    it('should handle empty array', () => {
      const tree = new SegmentTree({
        values: [],
        type: AggregationType.SUM,
      });
      expect(tree.total).toBe(0);
      expect(tree.size).toBe(0);
    });

    it('should handle single element', () => {
      const tree = new SegmentTree({
        values: [42],
        type: AggregationType.SUM,
      });
      expect(tree.total).toBe(42);
      expect(tree.size).toBe(1);
    });
  });

  describe('query', () => {
    it('should return correct sum for range', () => {
      const tree = new SegmentTree({
        values: [1, 3, 5, 7, 9, 11],
        type: AggregationType.SUM,
      });
      expect(tree.query(0, 2)).toBe(9); // 1 + 3 + 5
      expect(tree.query(1, 4)).toBe(24); // 3 + 5 + 7 + 9
      expect(tree.query(0, 5)).toBe(36); // sum of all
    });

    it('should return single element for point query', () => {
      const tree = new SegmentTree({
        values: [10, 20, 30, 40, 50],
        type: AggregationType.SUM,
      });
      expect(tree.query(2, 2)).toBe(30);
    });
  });

  describe('update', () => {
    it('should update value and reflect in queries', () => {
      const tree = new SegmentTree({
        values: [1, 2, 3, 4, 5],
        type: AggregationType.SUM,
      });

      expect(tree.total).toBe(15);
      tree.update(2, 10); // Change 3 to 10
      expect(tree.total).toBe(22);
      expect(tree.query(1, 3)).toBe(16); // 2 + 10 + 4
    });

    it('should update first element', () => {
      const tree = new SegmentTree({
        values: [1, 2, 3],
        type: AggregationType.SUM,
      });

      tree.update(0, 100);
      expect(tree.total).toBe(105);
    });

    it('should update last element', () => {
      const tree = new SegmentTree({
        values: [1, 2, 3],
        type: AggregationType.SUM,
      });

      tree.update(2, 100);
      expect(tree.total).toBe(103);
    });
  });

  describe('get', () => {
    it('should return value at index', () => {
      const tree = new SegmentTree({
        values: [10, 20, 30, 40],
        type: AggregationType.SUM,
      });

      expect(tree.get(0)).toBe(10);
      expect(tree.get(1)).toBe(20);
      expect(tree.get(3)).toBe(40);
    });
  });

  describe('findIndexAtSum (O(log n) row height lookup)', () => {
    it('should find correct index for uniform heights', () => {
      // Simulate 5 rows, each 30px tall
      const heights = [30, 30, 30, 30, 30]; // Total: 150px
      const tree = new SegmentTree({
        values: heights,
        type: AggregationType.SUM,
      });

      // Row 0: [0, 30)
      expect(tree.findIndexAtSum(0)).toBe(0);
      expect(tree.findIndexAtSum(15)).toBe(0);
      expect(tree.findIndexAtSum(29)).toBe(0);

      // Row 1: [30, 60)
      expect(tree.findIndexAtSum(30)).toBe(1);
      expect(tree.findIndexAtSum(45)).toBe(1);

      // Row 2: [60, 90)
      expect(tree.findIndexAtSum(60)).toBe(2);

      // Row 3: [90, 120)
      expect(tree.findIndexAtSum(90)).toBe(3);

      // Row 4: [120, 150)
      expect(tree.findIndexAtSum(120)).toBe(4);

      // Beyond total
      expect(tree.findIndexAtSum(150)).toBe(4);
      expect(tree.findIndexAtSum(200)).toBe(4);
    });

    it('should find correct index for variable heights', () => {
      // Variable row heights
      const heights = [20, 40, 30, 50, 10]; // Total: 150px
      const tree = new SegmentTree({
        values: heights,
        type: AggregationType.SUM,
      });

      // findIndexAtSum finds first index where prefix sum >= target
      // Prefix sums: [20, 60, 90, 140, 150] (cumulative including each index)

      // Target 10: prefix[0]=20 >= 10, returns 0
      expect(tree.findIndexAtSum(10)).toBe(0);

      // Target 20: prefix[0]=20 >= 20, returns 0
      expect(tree.findIndexAtSum(20)).toBe(0);

      // Target 21: prefix[0]=20 < 21, prefix[1]=60 >= 21, returns 1
      expect(tree.findIndexAtSum(21)).toBe(1);
      expect(tree.findIndexAtSum(50)).toBe(1);
      expect(tree.findIndexAtSum(60)).toBe(1);

      // Target 61: prefix[1]=60 < 61, prefix[2]=90 >= 61, returns 2
      expect(tree.findIndexAtSum(61)).toBe(2);
      expect(tree.findIndexAtSum(89)).toBe(2);
      expect(tree.findIndexAtSum(90)).toBe(2);

      // Target 91: prefix[2]=90 < 91, prefix[3]=140 >= 91, returns 3
      expect(tree.findIndexAtSum(91)).toBe(3);
      expect(tree.findIndexAtSum(130)).toBe(3);
      expect(tree.findIndexAtSum(140)).toBe(3);

      // Target 141: prefix[3]=140 < 141, prefix[4]=150 >= 141, returns 4
      expect(tree.findIndexAtSum(141)).toBe(4);
    });

    it('should handle edge case: target = 0', () => {
      const tree = new SegmentTree({
        values: [30, 30, 30],
        type: AggregationType.SUM,
      });

      expect(tree.findIndexAtSum(0)).toBe(0);
    });

    it('should handle edge case: target negative', () => {
      const tree = new SegmentTree({
        values: [30, 30, 30],
        type: AggregationType.SUM,
      });

      expect(tree.findIndexAtSum(-10)).toBe(0);
    });

    it('should handle edge case: target exceeds total', () => {
      const tree = new SegmentTree({
        values: [30, 30, 30],
        type: AggregationType.SUM,
      });

      expect(tree.findIndexAtSum(100)).toBe(2); // Last index
      expect(tree.findIndexAtSum(1000)).toBe(2);
    });

    it('should handle single element', () => {
      const tree = new SegmentTree({
        values: [50],
        type: AggregationType.SUM,
      });

      expect(tree.findIndexAtSum(0)).toBe(0);
      expect(tree.findIndexAtSum(25)).toBe(0);
      expect(tree.findIndexAtSum(50)).toBe(0);
      expect(tree.findIndexAtSum(100)).toBe(0);
    });

    it('should throw error for non-SUM aggregation', () => {
      const tree = new SegmentTree({
        values: [10, 20, 30],
        type: AggregationType.MIN,
      });

      expect(() => tree.findIndexAtSum(15)).toThrow(
        'findIndexAtSum only works with SUM aggregation type'
      );
    });

    it('should handle large dataset (performance)', () => {
      // 100,000 rows with random heights
      const heights = Array.from({ length: 100000 }, () => Math.floor(Math.random() * 50) + 20);
      const tree = new SegmentTree({
        values: heights,
        type: AggregationType.SUM,
      });

      // Verify O(log n) performance - should complete quickly
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        const randomOffset = Math.random() * tree.total;
        tree.findIndexAtSum(randomOffset);
      }
      const duration = performance.now() - start;

      // 1000 queries should complete in < 100ms for O(log n)
      expect(duration).toBeLessThan(100);
    });

    it('should be consistent with manual prefix sum calculation', () => {
      const heights = [25, 35, 45, 55, 65];
      const tree = new SegmentTree({
        values: heights,
        type: AggregationType.SUM,
      });

      // Calculate cumulative sums manually (sum INCLUDING each index)
      // cumulativeSums[i] = heights[0] + ... + heights[i]
      const cumulativeSums: number[] = [];
      let sum = 0;
      for (let i = 0; i < heights.length; i++) {
        sum += heights[i];
        cumulativeSums.push(sum);
      }
      // cumulativeSums = [25, 60, 105, 160, 225]

      // findIndexAtSum finds first index where cumulative >= target
      // For target just above previous cumulative, it should return that index
      expect(tree.findIndexAtSum(1)).toBe(0);   // 25 >= 1
      expect(tree.findIndexAtSum(26)).toBe(1);  // 60 >= 26
      expect(tree.findIndexAtSum(61)).toBe(2);  // 105 >= 61
      expect(tree.findIndexAtSum(106)).toBe(3); // 160 >= 106
      expect(tree.findIndexAtSum(161)).toBe(4); // 225 >= 161
    });
  });

  describe('findIndexAtSum after updates', () => {
    it('should return correct index after height update', () => {
      const tree = new SegmentTree({
        values: [30, 30, 30, 30],
        type: AggregationType.SUM,
      });

      // Initial cumulative sums: [30, 60, 90, 120]
      // findIndexAtSum(31) should return 1 (first where cumulative >= 31)
      expect(tree.findIndexAtSum(31)).toBe(1);

      // Update row 1 height: 30 -> 60
      tree.update(1, 60);

      // New cumulative sums: [30, 90, 120, 150]
      // findIndexAtSum(31) should still return 1 (first where cumulative >= 31)
      expect(tree.findIndexAtSum(31)).toBe(1);

      // But findIndexAtSum(61) now returns 1 instead of 2
      expect(tree.findIndexAtSum(61)).toBe(1);  // 90 >= 61

      // And findIndexAtSum(91) returns 2
      expect(tree.findIndexAtSum(91)).toBe(2);  // 120 >= 91
    });
  });
});
