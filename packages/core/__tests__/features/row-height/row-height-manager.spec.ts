/**
 * RowHeightManager Tests
 * Tests for dynamic row height configuration management
 */

import { RowHeightManager, RowHeightMode } from '../../../src/features/row-height/row-height-manager';
import type { HeightProvider } from '../../../src/rendering/height-provider/height-provider.interface';
import type { ColumnDef } from '../../../src/types/column';

// Mock HeightProvider
const createMockHeightProvider = (): HeightProvider => ({
  getHeight: jest.fn().mockReturnValue(30),
  getOffset: jest.fn().mockReturnValue(0),
  getTotalHeight: jest.fn().mockReturnValue(300),
  findIndexAtOffset: jest.fn().mockReturnValue(0),
  length: 10,
});

describe('RowHeightManager', () => {
  describe('constructor', () => {
    it('should initialize with fixed mode', () => {
      const manager = new RowHeightManager({
        mode: 'fixed',
        config: { defaultHeight: 30 },
        heightProvider: createMockHeightProvider(),
        columns: [],
      });

      expect(manager.getMode()).toBe('fixed');
    });

    it('should initialize with auto mode', () => {
      const manager = new RowHeightManager({
        mode: 'auto',
        config: { defaultHeight: 40 },
        heightProvider: createMockHeightProvider(),
        columns: [],
      });

      expect(manager.getMode()).toBe('auto');
    });

    it('should use default config values', () => {
      const manager = new RowHeightManager({
        mode: 'fixed',
        config: {},
        heightProvider: createMockHeightProvider(),
        columns: [],
      });

      const stats = manager.getStats();
      expect(stats.defaultHeight).toBe(30);
      expect(stats.minHeight).toBe(20);
      expect(stats.maxHeight).toBe(500);
    });
  });

  describe('needsMeasurement', () => {
    it('should return false for fixed mode', () => {
      const manager = new RowHeightManager({
        mode: 'fixed',
        config: {},
        heightProvider: createMockHeightProvider(),
        columns: [],
      });

      expect(manager.needsMeasurement(0)).toBe(false);
      expect(manager.needsMeasurement(10)).toBe(false);
    });

    it('should return true for auto mode', () => {
      const manager = new RowHeightManager({
        mode: 'auto',
        config: {},
        heightProvider: createMockHeightProvider(),
        columns: [],
      });

      expect(manager.needsMeasurement(0)).toBe(true);
      expect(manager.needsMeasurement(10)).toBe(true);
    });

    it('should return true for content-aware mode with autoHeight columns', () => {
      const columns: ColumnDef[] = [
        { field: 'name', width: 100 },
        { field: 'description', width: 200, autoHeight: true },
        { field: 'value', width: 100 },
      ];

      const manager = new RowHeightManager({
        mode: 'content-aware',
        config: {},
        heightProvider: createMockHeightProvider(),
        columns,
      });

      expect(manager.needsMeasurement(0)).toBe(true);
    });

    it('should return false for content-aware mode without autoHeight columns', () => {
      const columns: ColumnDef[] = [
        { field: 'name', width: 100 },
        { field: 'value', width: 100 },
      ];

      const manager = new RowHeightManager({
        mode: 'content-aware',
        config: {},
        heightProvider: createMockHeightProvider(),
        columns,
      });

      expect(manager.needsMeasurement(0)).toBe(false);
    });

    it('should check heightAffectingColumns config', () => {
      const columns: ColumnDef[] = [
        { field: 'name', width: 100 },
        { field: 'description', width: 200 },
        { field: 'value', width: 100 },
      ];

      const manager = new RowHeightManager({
        mode: 'content-aware',
        config: {
          heightAffectingColumns: ['description'],
        },
        heightProvider: createMockHeightProvider(),
        columns,
      });

      expect(manager.needsMeasurement(0)).toBe(true);
    });
  });

  describe('updateColumns', () => {
    it('should update column configuration', () => {
      const manager = new RowHeightManager({
        mode: 'content-aware',
        config: {},
        heightProvider: createMockHeightProvider(),
        columns: [{ field: 'name', width: 100 }],
      });

      expect(manager.needsMeasurement(0)).toBe(false);

      manager.updateColumns([
        { field: 'name', width: 100 },
        { field: 'description', width: 200, autoHeight: true },
      ]);

      expect(manager.needsMeasurement(0)).toBe(true);
    });

    it('should rebuild height-affecting indices', () => {
      const manager = new RowHeightManager({
        mode: 'content-aware',
        config: {},
        heightProvider: createMockHeightProvider(),
        columns: [
          { field: 'name', width: 100, autoHeight: true },
        ],
      });

      const statsBefore = manager.getStats();
      expect(statsBefore.heightAffectingColumns).toBe(1);

      manager.updateColumns([
        { field: 'name', width: 100 },
      ]);

      const statsAfter = manager.getStats();
      expect(statsAfter.heightAffectingColumns).toBe(0);
    });
  });

  describe('setMode', () => {
    it('should change mode at runtime', () => {
      const manager = new RowHeightManager({
        mode: 'fixed',
        config: {},
        heightProvider: createMockHeightProvider(),
        columns: [],
      });

      expect(manager.getMode()).toBe('fixed');
      expect(manager.needsMeasurement(0)).toBe(false);

      manager.setMode('auto');

      expect(manager.getMode()).toBe('auto');
      expect(manager.needsMeasurement(0)).toBe(true);
    });

    it('should not rebuild if mode unchanged', () => {
      const columns: ColumnDef[] = [
        { field: 'name', width: 100, autoHeight: true },
      ];

      const manager = new RowHeightManager({
        mode: 'content-aware',
        config: {},
        heightProvider: createMockHeightProvider(),
        columns,
      });

      // Get initial stats
      const statsBefore = manager.getStats();

      // Set same mode
      manager.setMode('content-aware');

      // Stats should be unchanged (no rebuild)
      const statsAfter = manager.getStats();
      expect(statsAfter).toEqual(statsBefore);
    });

    it('should rebuild indices when switching to content-aware', () => {
      const columns: ColumnDef[] = [
        { field: 'name', width: 100, autoHeight: true },
        { field: 'value', width: 100 },
      ];

      const manager = new RowHeightManager({
        mode: 'fixed',
        config: {},
        heightProvider: createMockHeightProvider(),
        columns,
      });

      manager.setMode('content-aware');

      const stats = manager.getStats();
      expect(stats.heightAffectingColumns).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const columns: ColumnDef[] = [
        { field: 'a', width: 100, autoHeight: true },
        { field: 'b', width: 100, autoHeight: true },
        { field: 'c', width: 100 },
      ];

      const manager = new RowHeightManager({
        mode: 'content-aware',
        config: {
          defaultHeight: 35,
          minHeight: 25,
          maxHeight: 300,
        },
        heightProvider: createMockHeightProvider(),
        columns,
      });

      const stats = manager.getStats();

      expect(stats.mode).toBe('content-aware');
      expect(stats.heightAffectingColumns).toBe(2);
      expect(stats.defaultHeight).toBe(35);
      expect(stats.minHeight).toBe(25);
      expect(stats.maxHeight).toBe(300);
    });

    it('should count all columns for auto mode', () => {
      const columns: ColumnDef[] = [
        { field: 'a', width: 100 },
        { field: 'b', width: 100 },
        { field: 'c', width: 100 },
      ];

      const manager = new RowHeightManager({
        mode: 'auto',
        config: {},
        heightProvider: createMockHeightProvider(),
        columns,
      });

      const stats = manager.getStats();
      expect(stats.heightAffectingColumns).toBe(3); // All columns in auto mode
    });
  });

  describe('mode behavior', () => {
    const columns: ColumnDef[] = [
      { field: 'name', width: 100 },
      { field: 'description', width: 200, autoHeight: true },
      { field: 'tags', width: 150, autoHeight: true },
      { field: 'value', width: 100 },
    ];

    const modes: RowHeightMode[] = ['fixed', 'auto', 'content-aware'];

    modes.forEach((mode) => {
      it(`should handle ${mode} mode correctly`, () => {
        const manager = new RowHeightManager({
          mode,
          config: {},
          heightProvider: createMockHeightProvider(),
          columns,
        });

        expect(manager.getMode()).toBe(mode);

        const stats = manager.getStats();
        switch (mode) {
          case 'fixed':
            expect(manager.needsMeasurement(0)).toBe(false);
            break;
          case 'auto':
            expect(manager.needsMeasurement(0)).toBe(true);
            expect(stats.heightAffectingColumns).toBe(4); // All columns
            break;
          case 'content-aware':
            expect(manager.needsMeasurement(0)).toBe(true);
            expect(stats.heightAffectingColumns).toBe(2); // Only autoHeight columns
            break;
        }
      });
    });
  });
});
