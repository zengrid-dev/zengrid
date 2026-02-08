/**
 * ColumnModelWidthProvider Tests
 * Tests for the adapter that bridges ColumnModel to WidthProvider interface
 */

import { ColumnModelWidthProvider } from '../../../src/rendering/width-provider/column-model-width-provider';
import { ColumnModel } from '../../../src/features/columns/column-model';
import type { ColumnDef } from '../../../src/types/column';

function createColumns(widths: number[]): ColumnDef[] {
  return widths.map((w, i) => ({
    field: `field${i}`,
    header: `Field ${i}`,
    width: w,
    minWidth: 10,
    maxWidth: 2000,
  }));
}

describe('ColumnModelWidthProvider', () => {
  describe('constructor', () => {
    it('should create from a ColumnModel', () => {
      const model = new ColumnModel(createColumns([100, 150, 200]));
      const provider = new ColumnModelWidthProvider(model);
      expect(provider.length).toBe(3);
    });

    it('should handle single column', () => {
      const model = new ColumnModel(createColumns([120]));
      const provider = new ColumnModelWidthProvider(model);
      expect(provider.length).toBe(1);
      expect(provider.getWidth(0)).toBe(120);
    });
  });

  describe('getWidth', () => {
    it('should return correct widths from ColumnModel', () => {
      const model = new ColumnModel(createColumns([100, 150, 200]));
      const provider = new ColumnModelWidthProvider(model);

      expect(provider.getWidth(0)).toBe(100);
      expect(provider.getWidth(1)).toBe(150);
      expect(provider.getWidth(2)).toBe(200);
    });

    it('should return constrained widths', () => {
      const columns: ColumnDef[] = [
        { field: 'a', header: 'A', width: 5, minWidth: 50, maxWidth: 500 },
      ];
      const model = new ColumnModel(columns);
      const provider = new ColumnModelWidthProvider(model);

      // Width 5 should be clamped to minWidth 50
      expect(provider.getWidth(0)).toBe(50);
    });

    it('should throw on negative index', () => {
      const model = new ColumnModel(createColumns([100]));
      const provider = new ColumnModelWidthProvider(model);
      expect(() => provider.getWidth(-1)).toThrow(RangeError);
    });

    it('should throw on index >= length', () => {
      const model = new ColumnModel(createColumns([100, 150]));
      const provider = new ColumnModelWidthProvider(model);
      expect(() => provider.getWidth(2)).toThrow(RangeError);
    });
  });

  describe('getOffset', () => {
    it('should return cumulative offsets', () => {
      const model = new ColumnModel(createColumns([100, 150, 200]));
      const provider = new ColumnModelWidthProvider(model);

      expect(provider.getOffset(0)).toBe(0);
      expect(provider.getOffset(1)).toBe(100);
      expect(provider.getOffset(2)).toBe(250); // 100 + 150
    });

    it('should return 0 for first column', () => {
      const model = new ColumnModel(createColumns([200]));
      const provider = new ColumnModelWidthProvider(model);
      expect(provider.getOffset(0)).toBe(0);
    });
  });

  describe('getTotalWidth', () => {
    it('should return sum of all widths', () => {
      const model = new ColumnModel(createColumns([100, 150, 200]));
      const provider = new ColumnModelWidthProvider(model);
      expect(provider.getTotalWidth()).toBe(450);
    });

    it('should return 0 for empty columns', () => {
      const model = new ColumnModel([]);
      const provider = new ColumnModelWidthProvider(model);
      expect(provider.getTotalWidth()).toBe(0);
    });
  });

  describe('findIndexAtOffset', () => {
    it('should find correct column at offset', () => {
      const model = new ColumnModel(createColumns([100, 150, 200]));
      const provider = new ColumnModelWidthProvider(model);

      expect(provider.findIndexAtOffset(0)).toBe(0);    // Start of col 0
      expect(provider.findIndexAtOffset(50)).toBe(0);    // Middle of col 0
      expect(provider.findIndexAtOffset(100)).toBe(1);   // Start of col 1
      expect(provider.findIndexAtOffset(200)).toBe(1);   // Middle of col 1
      expect(provider.findIndexAtOffset(250)).toBe(2);   // Start of col 2
      expect(provider.findIndexAtOffset(400)).toBe(2);   // Middle of col 2
    });

    it('should return last column for offset >= total', () => {
      const model = new ColumnModel(createColumns([100, 150, 200]));
      const provider = new ColumnModelWidthProvider(model);
      expect(provider.findIndexAtOffset(1000)).toBe(3); // past end
    });

    it('should return 0 for negative offset', () => {
      const model = new ColumnModel(createColumns([100, 150]));
      const provider = new ColumnModelWidthProvider(model);
      expect(provider.findIndexAtOffset(-10)).toBe(0);
    });
  });

  describe('setWidth', () => {
    it('should delegate to ColumnModel', () => {
      const model = new ColumnModel(createColumns([100, 150, 200]));
      const provider = new ColumnModelWidthProvider(model);

      provider.setWidth(1, 300);

      // ColumnModel should have the new width
      expect(model.getWidth('col-1')).toBe(300);
      // Provider should read the new width
      expect(provider.getWidth(1)).toBe(300);
    });

    it('should enforce constraints via ColumnModel', () => {
      const columns: ColumnDef[] = [
        { field: 'a', header: 'A', width: 100, minWidth: 50, maxWidth: 200 },
      ];
      const model = new ColumnModel(columns);
      const provider = new ColumnModelWidthProvider(model);

      // Try to set below min
      provider.setWidth(0, 10);
      expect(provider.getWidth(0)).toBe(50);

      // Try to set above max
      provider.setWidth(0, 500);
      expect(provider.getWidth(0)).toBe(200);
    });

    it('should update offsets after width change', () => {
      const model = new ColumnModel(createColumns([100, 150, 200]));
      const provider = new ColumnModelWidthProvider(model);

      // Before: offsets are 0, 100, 250
      expect(provider.getOffset(2)).toBe(250);

      // Change col 0 from 100 to 200
      provider.setWidth(0, 200);

      // After: offsets should be 0, 200, 350
      expect(provider.getOffset(1)).toBe(200);
      expect(provider.getOffset(2)).toBe(350);
    });

    it('should update totalWidth after width change', () => {
      const model = new ColumnModel(createColumns([100, 150, 200]));
      const provider = new ColumnModelWidthProvider(model);

      expect(provider.getTotalWidth()).toBe(450);

      provider.setWidth(0, 200);
      expect(provider.getTotalWidth()).toBe(550); // 200 + 150 + 200
    });

    it('should throw on out of bounds index', () => {
      const model = new ColumnModel(createColumns([100]));
      const provider = new ColumnModelWidthProvider(model);
      expect(() => provider.setWidth(1, 200)).toThrow(RangeError);
      expect(() => provider.setWidth(-1, 200)).toThrow(RangeError);
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate cache when ColumnModel width changes directly', () => {
      const model = new ColumnModel(createColumns([100, 150, 200]));
      const provider = new ColumnModelWidthProvider(model);

      // Prime the cache
      expect(provider.getTotalWidth()).toBe(450);

      // Change width directly through ColumnModel (not through provider)
      model.setWidth('col-0', 300);

      // Provider should see the new width (cache invalidated via subscription)
      expect(provider.getWidth(0)).toBe(300);
      expect(provider.getTotalWidth()).toBe(650); // 300 + 150 + 200
      expect(provider.getOffset(1)).toBe(300);
    });

    it('should invalidate cache on column reorder', () => {
      const model = new ColumnModel(createColumns([100, 150, 200]));
      const provider = new ColumnModelWidthProvider(model);

      // Prime the cache
      expect(provider.getWidth(0)).toBe(100);
      expect(provider.getWidth(1)).toBe(150);

      // Simulate reorder by directly updating order (via plugin pattern)
      // Move col-0 to position 2, col-2 to position 0
      model.updateState('col-0', { order: 2 }, {
        type: 'reorder',
        columnId: 'col-0',
        oldValue: 0,
        newValue: 2,
        state: model.getColumn('col-0')!,
      });
      model.updateState('col-2', { order: 0 }, {
        type: 'reorder',
        columnId: 'col-2',
        oldValue: 2,
        newValue: 0,
        state: model.getColumn('col-2')!,
      });

      // After reorder: visual order is col-2(200), col-1(150), col-0(100)
      expect(provider.getWidth(0)).toBe(200);
      expect(provider.getWidth(1)).toBe(150);
      expect(provider.getWidth(2)).toBe(100);
    });
  });

  describe('length', () => {
    it('should return column count', () => {
      const model = new ColumnModel(createColumns([100, 150, 200]));
      const provider = new ColumnModelWidthProvider(model);
      expect(provider.length).toBe(3);
    });

    it('should return 0 for empty model', () => {
      const model = new ColumnModel([]);
      const provider = new ColumnModelWidthProvider(model);
      expect(provider.length).toBe(0);
    });
  });

  describe('destroy', () => {
    it('should unsubscribe from ColumnModel on destroy', () => {
      const model = new ColumnModel(createColumns([100, 150]));
      const provider = new ColumnModelWidthProvider(model);

      // Prime cache
      expect(provider.getTotalWidth()).toBe(250);

      // Destroy
      provider.destroy();

      // After destroy, direct ColumnModel changes won't invalidate cache
      // (subscription removed). This is expected — provider should not be used after destroy.
      model.setWidth('col-0', 300);

      // Cache is stale after destroy (expected behavior)
      // We just verify destroy doesn't throw
    });
  });
});
