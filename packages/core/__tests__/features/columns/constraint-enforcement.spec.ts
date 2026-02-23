/**
 * Constraint Enforcement Tests
 * Tests for BUG-002: Centralize Constraint Enforcement in ColumnModel
 *
 * Verifies that ColumnModel is the single source of truth for constraints,
 * and that ResizeConstraintManager properly delegates to it when configured.
 */

import { ColumnModel } from '../../../src/features/columns/column-model';
import { ResizeConstraintManager } from '../../../src/features/column-resize/resize-constraint-manager';
import type { ColumnDef } from '../../../src/types/column';

function createColumns(
  configs: Array<{
    width?: number;
    minWidth?: number;
    maxWidth?: number;
    resizable?: boolean;
  }>
): ColumnDef[] {
  return configs.map((cfg, i) => ({
    field: `field${i}`,
    header: `Field ${i}`,
    width: cfg.width ?? 100,
    minWidth: cfg.minWidth,
    maxWidth: cfg.maxWidth,
    resizable: cfg.resizable,
  }));
}

describe('ColumnModel Constraint Methods', () => {
  describe('getConstraints', () => {
    it('should return constraints for existing column', () => {
      const columns = createColumns([{ width: 100, minWidth: 50, maxWidth: 300 }]);
      const model = new ColumnModel(columns);

      const constraints = model.getConstraints('col-0');
      expect(constraints).toEqual({ minWidth: 50, maxWidth: 300 });
    });

    it('should use default constraints when not specified in ColumnDef', () => {
      const columns = createColumns([{ width: 100 }]); // No minWidth/maxWidth
      const model = new ColumnModel(columns);

      const constraints = model.getConstraints('col-0');
      expect(constraints).toEqual({ minWidth: 50, maxWidth: 1000 }); // ColumnModel defaults
    });

    it('should return undefined for non-existent column', () => {
      const model = new ColumnModel(createColumns([{ width: 100 }]));
      expect(model.getConstraints('col-99')).toBeUndefined();
    });
  });

  describe('setConstraints', () => {
    it('should update constraints for existing column', () => {
      const columns = createColumns([{ width: 100, minWidth: 50, maxWidth: 300 }]);
      const model = new ColumnModel(columns);

      model.setConstraints('col-0', { minWidth: 80, maxWidth: 500 });

      const constraints = model.getConstraints('col-0');
      expect(constraints).toEqual({ minWidth: 80, maxWidth: 500 });
    });

    it('should allow partial constraint updates', () => {
      const columns = createColumns([{ width: 100, minWidth: 50, maxWidth: 300 }]);
      const model = new ColumnModel(columns);

      // Only update minWidth
      model.setConstraints('col-0', { minWidth: 80 });

      const constraints = model.getConstraints('col-0');
      expect(constraints?.minWidth).toBe(80);
      expect(constraints?.maxWidth).toBe(300); // Unchanged
    });

    it('should re-clamp width when constraint tightens', () => {
      const columns = createColumns([{ width: 200, minWidth: 50, maxWidth: 500 }]);
      const model = new ColumnModel(columns);

      // Current width is 200, set maxWidth to 150
      model.setConstraints('col-0', { maxWidth: 150 });

      // Width should be clamped to new max
      expect(model.getWidth('col-0')).toBe(150);
    });

    it('should emit width event when constraint change clamps width', () => {
      const columns = createColumns([{ width: 200, minWidth: 50, maxWidth: 500 }]);
      const model = new ColumnModel(columns);

      let eventReceived = false;
      model.subscribe('col-0', {
        onChange(event) {
          if (event.type === 'width') {
            eventReceived = true;
            expect(event.actualValue).toBe(150);
          }
        },
      });

      model.setConstraints('col-0', { maxWidth: 150 });
      expect(eventReceived).toBe(true);
    });

    it('should not emit event if width unchanged after constraint update', () => {
      const columns = createColumns([{ width: 100, minWidth: 50, maxWidth: 500 }]);
      const model = new ColumnModel(columns);

      let eventCount = 0;
      model.subscribe('col-0', {
        onChange() {
          eventCount++;
        },
      });

      // Constraint change doesn't affect current width (100 is within [80, 600])
      model.setConstraints('col-0', { minWidth: 80, maxWidth: 600 });
      expect(eventCount).toBe(0);
    });

    it('should silently ignore non-existent column', () => {
      const model = new ColumnModel(createColumns([{ width: 100 }]));

      // Should not throw
      expect(() => {
        model.setConstraints('col-99', { minWidth: 80 });
      }).not.toThrow();
    });
  });

  describe('isResizable', () => {
    it('should return true by default', () => {
      const columns = createColumns([{ width: 100 }]); // No resizable specified
      const model = new ColumnModel(columns);

      expect(model.isResizable('col-0')).toBe(true);
    });

    it('should return true when resizable is explicitly true', () => {
      const columns = createColumns([{ width: 100, resizable: true }]);
      const model = new ColumnModel(columns);

      expect(model.isResizable('col-0')).toBe(true);
    });

    it('should return false when resizable is false', () => {
      const columns = createColumns([{ width: 100, resizable: false }]);
      const model = new ColumnModel(columns);

      expect(model.isResizable('col-0')).toBe(false);
    });

    it('should return true for non-existent column (safe default)', () => {
      const model = new ColumnModel(createColumns([{ width: 100 }]));

      // Non-existent column returns true (safe default - don't block unknown columns)
      // This is because undefined !== false evaluates to true
      expect(model.isResizable('col-99')).toBe(true);
    });
  });

  describe('setWidth with constraints', () => {
    it('should clamp width to minWidth', () => {
      const columns = createColumns([{ width: 100, minWidth: 50, maxWidth: 300 }]);
      const model = new ColumnModel(columns);

      model.setWidth('col-0', 20); // Below min
      expect(model.getWidth('col-0')).toBe(50); // Clamped to min
    });

    it('should clamp width to maxWidth', () => {
      const columns = createColumns([{ width: 100, minWidth: 50, maxWidth: 300 }]);
      const model = new ColumnModel(columns);

      model.setWidth('col-0', 500); // Above max
      expect(model.getWidth('col-0')).toBe(300); // Clamped to max
    });

    it('should allow width within constraints', () => {
      const columns = createColumns([{ width: 100, minWidth: 50, maxWidth: 300 }]);
      const model = new ColumnModel(columns);

      model.setWidth('col-0', 200); // Within range
      expect(model.getWidth('col-0')).toBe(200);
    });
  });
});

describe('ResizeConstraintManager with constraintProvider', () => {
  describe('without constraintProvider (legacy mode)', () => {
    it('should use internal constraints', () => {
      const manager = new ResizeConstraintManager({
        defaultConstraints: { minWidth: 30, maxWidth: 500 },
      });

      const constraints = manager.getConstraints(0);
      expect(constraints.minWidth).toBe(30);
      expect(constraints.maxWidth).toBe(500);
    });

    it('should use column-specific constraints when provided', () => {
      const columnConstraints = new Map<number, { minWidth?: number; maxWidth?: number }>();
      columnConstraints.set(0, { minWidth: 80, maxWidth: 200 });

      const manager = new ResizeConstraintManager({
        defaultConstraints: { minWidth: 30, maxWidth: 500 },
        columnConstraints,
      });

      expect(manager.getConstraints(0)).toEqual({ minWidth: 80, maxWidth: 200 });
      expect(manager.getConstraints(1)).toEqual({ minWidth: 30, maxWidth: 500 }); // Uses default
    });

    it('should use built-in defaults when none provided', () => {
      const manager = new ResizeConstraintManager({});

      const constraints = manager.getConstraints(0);
      expect(constraints.minWidth).toBe(30); // ResizeConstraintManager default
      expect(constraints.maxWidth).toBe(Infinity);
    });
  });

  describe('with constraintProvider (ColumnModel integration)', () => {
    it('should delegate to constraintProvider', () => {
      const columns = createColumns([
        { width: 100, minWidth: 60, maxWidth: 400 },
        { width: 150, minWidth: 70, maxWidth: 350 },
      ]);
      const columnModel = new ColumnModel(columns);

      const manager = new ResizeConstraintManager({
        defaultConstraints: { minWidth: 30, maxWidth: 500 },
        constraintProvider: (col: number) => {
          const columnId = `col-${col}`;
          return columnModel.getConstraints(columnId) ?? { minWidth: 50, maxWidth: 1000 };
        },
      });

      // Should use ColumnModel constraints, not internal defaults
      expect(manager.getConstraints(0)).toEqual({ minWidth: 60, maxWidth: 400 });
      expect(manager.getConstraints(1)).toEqual({ minWidth: 70, maxWidth: 350 });
    });

    it('should override internal constraints when provider exists', () => {
      const columns = createColumns([{ width: 100, minWidth: 80, maxWidth: 200 }]);
      const columnModel = new ColumnModel(columns);

      // Internal constraints set to different values
      const columnConstraints = new Map<number, { minWidth?: number; maxWidth?: number }>();
      columnConstraints.set(0, { minWidth: 30, maxWidth: 500 });

      const manager = new ResizeConstraintManager({
        defaultConstraints: { minWidth: 10, maxWidth: 1000 },
        columnConstraints, // These should be ignored when provider exists
        constraintProvider: (col: number) => {
          const columnId = `col-${col}`;
          return columnModel.getConstraints(columnId) ?? { minWidth: 50, maxWidth: 1000 };
        },
      });

      // Should use ColumnModel values (80, 200), not internal (30, 500)
      expect(manager.getConstraints(0)).toEqual({ minWidth: 80, maxWidth: 200 });
    });

    it('should apply constraints correctly when provider exists', () => {
      const columns = createColumns([{ width: 100, minWidth: 50, maxWidth: 300 }]);
      const columnModel = new ColumnModel(columns);

      const manager = new ResizeConstraintManager({
        constraintProvider: (col: number) => {
          const columnId = `col-${col}`;
          return columnModel.getConstraints(columnId) ?? { minWidth: 50, maxWidth: 1000 };
        },
      });

      expect(manager.applyConstraints(0, 20)).toBe(50); // Clamped to min
      expect(manager.applyConstraints(0, 500)).toBe(300); // Clamped to max
      expect(manager.applyConstraints(0, 150)).toBe(150); // Within range
    });

    it('should respect runtime constraint updates from ColumnModel', () => {
      const columns = createColumns([{ width: 100, minWidth: 50, maxWidth: 300 }]);
      const columnModel = new ColumnModel(columns);

      const manager = new ResizeConstraintManager({
        constraintProvider: (col: number) => {
          const columnId = `col-${col}`;
          return columnModel.getConstraints(columnId) ?? { minWidth: 50, maxWidth: 1000 };
        },
      });

      // Initial constraints
      expect(manager.getConstraints(0)).toEqual({ minWidth: 50, maxWidth: 300 });

      // Update constraints via ColumnModel
      columnModel.setConstraints('col-0', { minWidth: 80, maxWidth: 250 });

      // Manager should see the new constraints (because it calls provider each time)
      expect(manager.getConstraints(0)).toEqual({ minWidth: 80, maxWidth: 250 });
    });
  });
});

describe('Constraint Consistency', () => {
  it('interactive resize and programmatic resize produce same result', () => {
    const columns = createColumns([{ width: 100, minWidth: 50, maxWidth: 300 }]);
    const columnModel = new ColumnModel(columns);

    const manager = new ResizeConstraintManager({
      constraintProvider: (col: number) => {
        const columnId = `col-${col}`;
        return columnModel.getConstraints(columnId) ?? { minWidth: 50, maxWidth: 1000 };
      },
    });

    // Simulate interactive resize: ResizeConstraintManager clamps first
    const interactiveResult = manager.applyConstraints(0, 20);

    // Simulate programmatic resize: ColumnModel clamps
    columnModel.setWidth('col-0', 20);
    const programmaticResult = columnModel.getWidth('col-0');

    // Both should produce the same clamped value
    expect(interactiveResult).toBe(programmaticResult);
    expect(interactiveResult).toBe(50);
  });

  it('constraints are consistent for values above maxWidth', () => {
    const columns = createColumns([{ width: 100, minWidth: 50, maxWidth: 300 }]);
    const columnModel = new ColumnModel(columns);

    const manager = new ResizeConstraintManager({
      constraintProvider: (col: number) => {
        const columnId = `col-${col}`;
        return columnModel.getConstraints(columnId) ?? { minWidth: 50, maxWidth: 1000 };
      },
    });

    const interactiveResult = manager.applyConstraints(0, 500);
    columnModel.setWidth('col-0', 500);
    const programmaticResult = columnModel.getWidth('col-0');

    expect(interactiveResult).toBe(programmaticResult);
    expect(interactiveResult).toBe(300);
  });
});
