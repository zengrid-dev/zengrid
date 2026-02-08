/**
 * SegmentTreeHeightProvider Tests
 * Tests for O(log n) height provider implementation
 */

import { SegmentTreeHeightProvider } from '../../../src/rendering/height-provider/segment-tree-height-provider';

describe('SegmentTreeHeightProvider', () => {
  describe('constructor', () => {
    it('should initialize with row count and default height', () => {
      const provider = new SegmentTreeHeightProvider(100, 30);
      expect(provider.length).toBe(100);
      expect(provider.getTotalHeight()).toBe(3000); // 100 * 30
    });

    it('should throw for invalid row count', () => {
      expect(() => new SegmentTreeHeightProvider(0, 30)).toThrow(RangeError);
      expect(() => new SegmentTreeHeightProvider(-1, 30)).toThrow(RangeError);
    });

    it('should throw for invalid default height', () => {
      expect(() => new SegmentTreeHeightProvider(100, 0)).toThrow(RangeError);
      expect(() => new SegmentTreeHeightProvider(100, -10)).toThrow(RangeError);
    });
  });

  describe('getHeight', () => {
    it('should return default height for all rows initially', () => {
      const provider = new SegmentTreeHeightProvider(5, 40);
      for (let i = 0; i < 5; i++) {
        expect(provider.getHeight(i)).toBe(40);
      }
    });

    it('should throw for out of bounds index', () => {
      const provider = new SegmentTreeHeightProvider(10, 30);
      expect(() => provider.getHeight(-1)).toThrow(RangeError);
      expect(() => provider.getHeight(10)).toThrow(RangeError);
      expect(() => provider.getHeight(100)).toThrow(RangeError);
    });
  });

  describe('getOffset', () => {
    it('should return correct cumulative offset', () => {
      const provider = new SegmentTreeHeightProvider(5, 30);
      // Row 0 starts at 0
      expect(provider.getOffset(0)).toBe(0);
      // Row 1 starts at 30
      expect(provider.getOffset(1)).toBe(30);
      // Row 2 starts at 60
      expect(provider.getOffset(2)).toBe(60);
      // Row 4 starts at 120
      expect(provider.getOffset(4)).toBe(120);
    });

    it('should return correct offset after height changes', () => {
      const provider = new SegmentTreeHeightProvider(5, 30);

      // Change row 1 height to 50
      provider.setHeight(1, 50);

      // Row 0 still starts at 0
      expect(provider.getOffset(0)).toBe(0);
      // Row 1 still starts at 30
      expect(provider.getOffset(1)).toBe(30);
      // Row 2 now starts at 80 (30 + 50)
      expect(provider.getOffset(2)).toBe(80);
      // Row 3 starts at 110 (30 + 50 + 30)
      expect(provider.getOffset(3)).toBe(110);
    });

    it('should throw for out of bounds index', () => {
      const provider = new SegmentTreeHeightProvider(10, 30);
      expect(() => provider.getOffset(-1)).toThrow(RangeError);
      expect(() => provider.getOffset(10)).toThrow(RangeError);
    });
  });

  describe('getTotalHeight', () => {
    it('should return sum of all row heights', () => {
      const provider = new SegmentTreeHeightProvider(10, 25);
      expect(provider.getTotalHeight()).toBe(250);
    });

    it('should update after height changes', () => {
      const provider = new SegmentTreeHeightProvider(5, 30);
      expect(provider.getTotalHeight()).toBe(150);

      provider.setHeight(0, 50);
      expect(provider.getTotalHeight()).toBe(170); // 50 + 30 + 30 + 30 + 30

      provider.setHeight(4, 100);
      expect(provider.getTotalHeight()).toBe(240); // 50 + 30 + 30 + 30 + 100
    });
  });

  describe('findIndexAtOffset', () => {
    it('should find correct row for uniform heights', () => {
      const provider = new SegmentTreeHeightProvider(5, 30);

      // Row 0: [0, 30)
      expect(provider.findIndexAtOffset(0)).toBe(0);
      expect(provider.findIndexAtOffset(15)).toBe(0);
      expect(provider.findIndexAtOffset(29)).toBe(0);

      // Row 1: [30, 60)
      expect(provider.findIndexAtOffset(30)).toBe(1);
      expect(provider.findIndexAtOffset(45)).toBe(1);

      // Row 4: [120, 150)
      expect(provider.findIndexAtOffset(120)).toBe(4);
    });

    it('should find correct row for variable heights', () => {
      const provider = new SegmentTreeHeightProvider(5, 30);

      // Set variable heights
      provider.setHeight(0, 20);
      provider.setHeight(1, 40);
      provider.setHeight(2, 30);
      provider.setHeight(3, 50);
      provider.setHeight(4, 10);

      // Row 0: [0, 20)
      expect(provider.findIndexAtOffset(10)).toBe(0);

      // Row 1: [20, 60)
      expect(provider.findIndexAtOffset(20)).toBe(1);
      expect(provider.findIndexAtOffset(50)).toBe(1);

      // Row 2: [60, 90)
      expect(provider.findIndexAtOffset(60)).toBe(2);

      // Row 3: [90, 140)
      expect(provider.findIndexAtOffset(100)).toBe(3);

      // Row 4: [140, 150)
      expect(provider.findIndexAtOffset(140)).toBe(4);
    });

    it('should handle edge cases', () => {
      const provider = new SegmentTreeHeightProvider(3, 30);

      // Offset 0 => row 0
      expect(provider.findIndexAtOffset(0)).toBe(0);

      // Negative offset => row 0
      expect(provider.findIndexAtOffset(-10)).toBe(0);

      // Offset beyond total => last row
      expect(provider.findIndexAtOffset(100)).toBe(2);
      expect(provider.findIndexAtOffset(1000)).toBe(2);
    });
  });

  describe('setHeight', () => {
    it('should update height and reflect in queries', () => {
      const provider = new SegmentTreeHeightProvider(5, 30);

      provider.setHeight(2, 100);

      expect(provider.getHeight(2)).toBe(100);
      expect(provider.getTotalHeight()).toBe(220); // 30 + 30 + 100 + 30 + 30
    });

    it('should not change anything when setting same height', () => {
      const provider = new SegmentTreeHeightProvider(5, 30);
      const subscriber = jest.fn();
      provider.subscribe(subscriber);

      provider.setHeight(2, 30); // Same height

      expect(subscriber).not.toHaveBeenCalled();
    });

    it('should throw for out of bounds index', () => {
      const provider = new SegmentTreeHeightProvider(10, 30);
      expect(() => provider.setHeight(-1, 50)).toThrow(RangeError);
      expect(() => provider.setHeight(10, 50)).toThrow(RangeError);
    });

    it('should throw for negative height', () => {
      const provider = new SegmentTreeHeightProvider(10, 30);
      expect(() => provider.setHeight(0, -10)).toThrow(RangeError);
    });

    it('should allow zero height', () => {
      const provider = new SegmentTreeHeightProvider(5, 30);
      provider.setHeight(2, 0);
      expect(provider.getHeight(2)).toBe(0);
      expect(provider.getTotalHeight()).toBe(120); // 30 + 30 + 0 + 30 + 30
    });
  });

  describe('batchSetHeight', () => {
    it('should update multiple heights efficiently', () => {
      const provider = new SegmentTreeHeightProvider(10, 30);

      const updates = new Map<number, number>([
        [0, 50],
        [3, 100],
        [7, 25],
      ]);

      provider.batchSetHeight(updates);

      expect(provider.getHeight(0)).toBe(50);
      expect(provider.getHeight(3)).toBe(100);
      expect(provider.getHeight(7)).toBe(25);
      expect(provider.getHeight(1)).toBe(30); // Unchanged
    });

    it('should notify subscribers for each change', () => {
      const provider = new SegmentTreeHeightProvider(5, 30);
      const subscriber = jest.fn();
      provider.subscribe(subscriber);

      const updates = new Map<number, number>([
        [0, 50],
        [2, 40],
      ]);

      provider.batchSetHeight(updates);

      expect(subscriber).toHaveBeenCalledTimes(2);
      expect(subscriber).toHaveBeenCalledWith(0, 50);
      expect(subscriber).toHaveBeenCalledWith(2, 40);
    });

    it('should skip unchanged heights', () => {
      const provider = new SegmentTreeHeightProvider(5, 30);
      const subscriber = jest.fn();
      provider.subscribe(subscriber);

      const updates = new Map<number, number>([
        [0, 30], // Same height
        [2, 40], // Different height
      ]);

      provider.batchSetHeight(updates);

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith(2, 40);
    });

    it('should handle empty updates', () => {
      const provider = new SegmentTreeHeightProvider(5, 30);
      const subscriber = jest.fn();
      provider.subscribe(subscriber);

      provider.batchSetHeight(new Map());

      expect(subscriber).not.toHaveBeenCalled();
      expect(provider.getTotalHeight()).toBe(150);
    });

    it('should throw for out of bounds index', () => {
      const provider = new SegmentTreeHeightProvider(5, 30);

      const updates = new Map<number, number>([
        [0, 50],
        [10, 100], // Out of bounds
      ]);

      expect(() => provider.batchSetHeight(updates)).toThrow(RangeError);
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers when height changes', () => {
      const provider = new SegmentTreeHeightProvider(5, 30);
      const subscriber = jest.fn();

      provider.subscribe(subscriber);
      provider.setHeight(2, 100);

      expect(subscriber).toHaveBeenCalledWith(2, 100);
    });

    it('should support multiple subscribers', () => {
      const provider = new SegmentTreeHeightProvider(5, 30);
      const sub1 = jest.fn();
      const sub2 = jest.fn();

      provider.subscribe(sub1);
      provider.subscribe(sub2);
      provider.setHeight(1, 50);

      expect(sub1).toHaveBeenCalledWith(1, 50);
      expect(sub2).toHaveBeenCalledWith(1, 50);
    });

    it('should return unsubscribe function', () => {
      const provider = new SegmentTreeHeightProvider(5, 30);
      const subscriber = jest.fn();

      const unsubscribe = provider.subscribe(subscriber);
      provider.setHeight(0, 40);
      expect(subscriber).toHaveBeenCalledTimes(1);

      unsubscribe();
      provider.setHeight(1, 50);
      expect(subscriber).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should handle errors in subscribers gracefully', () => {
      const provider = new SegmentTreeHeightProvider(5, 30);
      const errorSub = jest.fn(() => {
        throw new Error('Test error');
      });
      const goodSub = jest.fn();

      // Mock console.error to suppress output during test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      provider.subscribe(errorSub);
      provider.subscribe(goodSub);

      // Should not throw, and should still call other subscribers
      expect(() => provider.setHeight(0, 50)).not.toThrow();
      expect(goodSub).toHaveBeenCalledWith(0, 50);

      consoleSpy.mockRestore();
    });
  });

  describe('performance', () => {
    it('should handle large dataset efficiently', () => {
      const rowCount = 100000;
      const provider = new SegmentTreeHeightProvider(rowCount, 30);

      // Measure update time
      const updateStart = performance.now();
      for (let i = 0; i < 1000; i++) {
        const randomRow = Math.floor(Math.random() * rowCount);
        provider.setHeight(randomRow, Math.random() * 100 + 20);
      }
      const updateDuration = performance.now() - updateStart;

      // Measure lookup time
      const lookupStart = performance.now();
      for (let i = 0; i < 1000; i++) {
        const randomOffset = Math.random() * provider.getTotalHeight();
        provider.findIndexAtOffset(randomOffset);
      }
      const lookupDuration = performance.now() - lookupStart;

      // O(log n) operations should complete quickly
      expect(updateDuration).toBeLessThan(100); // 1000 updates < 100ms
      expect(lookupDuration).toBeLessThan(100); // 1000 lookups < 100ms
    });
  });
});
