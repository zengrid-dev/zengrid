# VirtualScroller Component

## Purpose

VirtualScroller is the core orchestrator of ZenGrid's virtual scrolling system. It calculates which cells are visible at the current scroll position and manages the rendering lifecycle.

**Goal**: Render only visible cells to achieve 60fps with 100k+ rows.

## Location

`packages/core/src/rendering/virtual-scroller/virtual-scroller.ts`

## Responsibilities

1. **Own scroll state** - Track `scrollTop` and `scrollLeft` (as refs, not state)
2. **Calculate visible range** - Determine which rows/columns are visible
3. **Manage overscan** - Include buffer rows/columns beyond viewport
4. **Coordinate rendering** - Work with CellPositioner to render visible cells
5. **Optimize re-renders** - Only trigger re-render when visible range changes

## Dependencies

```typescript
import { HeightProvider } from '../height-provider';
import { WidthProvider } from '../width-provider';
import { ViewportModel } from '../../features/viewport/viewport-model';
import { CellPositioner } from '../cell-positioner';
```

**Depends on**:
- HeightProvider - Row height lookups
- WidthProvider - Column width lookups
- ViewportModel - Visible range calculation
- CellPositioner - Coordinate conversion

**Depended on by**:
- Grid component
- Feature managers (selection, sorting, etc.)

## Public Interface

```typescript
interface VirtualScroller {
  // Calculate visible range for given scroll position
  calculateVisibleRange(
    scrollTop: number,
    scrollLeft: number
  ): VisibleRange;

  // Update scroll position (synchronous, no re-render)
  updateScroll(scrollTop: number, scrollLeft: number): void;

  // Get total grid dimensions
  getTotalHeight(): number;
  getTotalWidth(): number;

  // Configure overscan
  setOverscan(rowOverscan: number, colOverscan: number): void;
}

interface VisibleRange {
  startRow: number;
  endRow: number;   // Inclusive
  startCol: number;
  endCol: number;   // Inclusive
}
```

## Implementation Strategy

### Scroll State Management

**CRITICAL**: Use refs for scroll position, NOT React state.

```typescript
class VirtualScroller {
  // ✅ CORRECT - refs don't trigger re-renders
  private scrollTopRef = { current: 0 };
  private scrollLeftRef = { current: 0 };

  // ❌ WRONG - state triggers re-render 60 times/sec
  // private scrollTop: number;
  // private setScrollTop: (v: number) => void;

  updateScroll(scrollTop: number, scrollLeft: number) {
    this.scrollTopRef.current = scrollTop;
    this.scrollLeftRef.current = scrollLeft;

    // Calculate new range
    const newRange = this.calculateVisibleRange(scrollTop, scrollLeft);

    // Only notify if range changed
    if (!this.rangeEquals(newRange, this.currentRange)) {
      this.currentRange = newRange;
      this.notifyRangeChange(newRange);
    }
  }
}
```

**Why refs?**:
- Scroll events fire 60+ times per second
- State updates trigger React reconciliation (~2-3ms)
- 60 × 3ms = 180ms wasted per second
- Refs are synchronous and don't cause re-renders

### Visible Range Calculation

```typescript
calculateVisibleRange(
  scrollTop: number,
  scrollLeft: number
): VisibleRange {
  // 1. Find visible rows (O(log n) via HeightProvider)
  const startRow = this.heightProvider.findFirstVisible(scrollTop);
  const scrollBottom = scrollTop + this.viewportHeight;
  const endRow = this.heightProvider.findLastVisible(scrollBottom);

  // 2. Find visible columns (O(log n) via WidthProvider)
  const startCol = this.widthProvider.findFirstVisible(scrollLeft);
  const scrollRight = scrollLeft + this.viewportWidth;
  const endCol = this.widthProvider.findLastVisible(scrollRight);

  // 3. Apply overscan (render buffer)
  const overscanStartRow = Math.max(0, startRow - this.overscanRows);
  const overscanEndRow = Math.min(this.rowCount - 1, endRow + this.overscanRows);
  const overscanStartCol = Math.max(0, startCol - this.overscanCols);
  const overscanEndCol = Math.min(this.colCount - 1, endCol + this.overscanCols);

  return {
    startRow: overscanStartRow,
    endRow: overscanEndRow,
    startCol: overscanStartCol,
    endCol: overscanEndCol,
  };
}
```

**Performance**: O(log n) due to binary search in HeightProvider/WidthProvider.

### Overscan Strategy

**Overscan** = rendering extra rows/columns beyond viewport to prevent blank areas during fast scrolling.

```typescript
// Default overscan configuration
const OVERSCAN_ROWS = 3;    // Render 3 extra rows above/below
const OVERSCAN_COLS = 2;    // Render 2 extra columns left/right

// Example with viewport showing rows 50-70:
// Visible: [50, 70]
// With overscan: [47, 73]  (3 rows above, 3 below)
```

**Trade-off**:
- **More overscan** = smoother fast scrolling, more DOM nodes, higher memory
- **Less overscan** = fewer DOM nodes, blank areas during fast scroll

**Recommended**: 2-5 rows/columns overscan for most use cases.

## Critical Invariants

### Invariant 1: Range Includes Overscan

**Always** include overscan buffer in visible range.

```typescript
// ✅ CORRECT
const range = {
  startRow: Math.max(0, visibleStartRow - overscan),
  endRow: Math.min(rowCount - 1, visibleEndRow + overscan),
};

// ❌ WRONG - no overscan = blank areas
const range = {
  startRow: visibleStartRow,
  endRow: visibleEndRow,
};
```

### Invariant 2: Range Within Bounds

**Never** return indices outside [0, rowCount-1] or [0, colCount-1].

```typescript
// ✅ CORRECT - clamped to bounds
const startRow = Math.max(0, calculatedStart);
const endRow = Math.min(rowCount - 1, calculatedEnd);

// ❌ WRONG - can be negative or exceed bounds
const startRow = calculatedStart - overscan;
const endRow = calculatedEnd + overscan;
```

### Invariant 3: Only Re-render on Range Change

**Only** trigger re-render when visible range changes, not on every scroll.

```typescript
// ✅ CORRECT - compare ranges
if (!this.rangeEquals(newRange, currentRange)) {
  this.notifyRangeChange(newRange);
}

// ❌ WRONG - re-renders 60 times/sec
this.notifyRangeChange(newRange); // Always notifies
```

## Common Patterns

### Pattern 1: Scroll Event Handler

```typescript
const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
  const { scrollTop, scrollLeft } = e.currentTarget;

  // Update refs (no re-render)
  virtualScroller.updateScroll(scrollTop, scrollLeft);

  // VirtualScroller handles range comparison internally
  // Only notifies if range changed
};
```

### Pattern 2: Range Comparison

```typescript
private rangeEquals(a: VisibleRange, b: VisibleRange): boolean {
  return (
    a.startRow === b.startRow &&
    a.endRow === b.endRow &&
    a.startCol === b.startCol &&
    a.endCol === b.endCol
  );
}
```

### Pattern 3: Scroll Anchoring

When row heights change above viewport, maintain visual scroll position:

```typescript
private handleHeightChange(rowIndex: number, delta: number) {
  const { startRow } = this.currentRange;

  // If change is above viewport, adjust scroll
  if (rowIndex < startRow) {
    this.scrollTopRef.current += delta;
    // Update DOM scroll position
    this.scrollContainer.scrollTop += delta;
  }
}
```

## Performance Considerations

### Scroll Handler Budget: < 0.5ms

Scroll handler must complete in < 0.5ms to stay within 3ms JavaScript budget.

**Current implementation**: ~0.3ms

**Optimizations**:
1. Use refs instead of state (no React reconciliation)
2. O(log n) range calculation (segment tree)
3. Early exit if range unchanged
4. No layout reads (`getBoundingClientRect`, etc.)
5. Minimal calculations

### Memory Management

**DOM nodes**: Typically 20-40 visible cells + overscan = 40-80 DOM nodes

**Memory usage**: ~2-5KB per cell × 80 cells = ~400KB

**Object pooling**: Reuse DOM nodes when cells scroll out of view

## Testing

### Unit Tests

```typescript
describe('VirtualScroller', () => {
  it('calculates visible range correctly', () => {
    const scroller = new VirtualScroller({
      rowCount: 1000,
      colCount: 20,
      rowHeight: 40,
      colWidth: 100,
      viewportWidth: 800,
      viewportHeight: 600,
      overscanRows: 3,
    });

    const range = scroller.calculateVisibleRange(1000, 0);

    // At scrollTop=1000, with 40px row height:
    // First visible row: 1000 / 40 = 25
    // Last visible row: (1000 + 600) / 40 = 40
    // With overscan=3: [22, 43]
    expect(range.startRow).toBe(22);
    expect(range.endRow).toBe(43);
  });

  it('clamps range to data bounds', () => {
    const scroller = new VirtualScroller({
      rowCount: 10,
      overscanRows: 5,
    });

    const range = scroller.calculateVisibleRange(0, 0);

    // With overscan=5 and only 10 rows:
    // Should clamp to [0, 9], not [-5, 14]
    expect(range.startRow).toBe(0);
    expect(range.endRow).toBe(9);
  });

  it('only notifies when range changes', () => {
    const scroller = new VirtualScroller({...});
    const onRangeChange = jest.fn();
    scroller.on('rangeChange', onRangeChange);

    // Scroll within same range
    scroller.updateScroll(100, 0);
    scroller.updateScroll(105, 0);
    scroller.updateScroll(110, 0);

    // Should only notify once
    expect(onRangeChange).toHaveBeenCalledTimes(1);
  });
});
```

### Performance Tests

```typescript
describe('VirtualScroller performance', () => {
  it('calculates range in < 1ms', () => {
    const scroller = new VirtualScroller({
      rowCount: 100000,
      colCount: 100,
    });

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      scroller.calculateVisibleRange(i * 1000, 0);
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100); // < 1ms per call
  });
});
```

## Common Issues

### Issue 1: Blank Areas During Fast Scroll

**Symptom**: White/empty areas appear when scrolling quickly.

**Cause**: Insufficient overscan buffer.

**Solution**: Increase overscan:

```typescript
virtualScroller.setOverscan(5, 3); // 5 rows, 3 cols
```

### Issue 2: Poor Performance with Large Overscan

**Symptom**: Scrolling is janky with large overscan.

**Cause**: Too many DOM nodes being updated.

**Solution**: Reduce overscan or use object pooling:

```typescript
virtualScroller.setOverscan(2, 1); // Smaller overscan
```

### Issue 3: Cells Jump on Scroll

**Symptom**: Cells appear offset when scrolling.

**Cause**: Mixing grid and viewport coordinates.

**Solution**: Ensure coordinate conversion (see [coordinates.md](../coordinates.md))

## Integration Example

```typescript
function Grid({ data, rowHeight, colWidth }: GridProps) {
  const [visibleRange, setVisibleRange] = useState<VisibleRange>({
    startRow: 0,
    endRow: 20,
    startCol: 0,
    endCol: 10,
  });

  const virtualScroller = useMemo(() => {
    return new VirtualScroller({
      rowCount: data.length,
      colCount: data[0].length,
      rowHeight,
      colWidth,
      viewportWidth: 800,
      viewportHeight: 600,
      overscanRows: 3,
      overscanCols: 2,
      onRangeChange: setVisibleRange,
    });
  }, [data.length, data[0].length, rowHeight, colWidth]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    virtualScroller.updateScroll(scrollTop, scrollLeft);
  }, [virtualScroller]);

  return (
    <div className="grid-viewport" onScroll={handleScroll}>
      <div
        className="grid-content"
        style={{
          height: virtualScroller.getTotalHeight(),
          width: virtualScroller.getTotalWidth(),
        }}
      >
        {renderVisibleCells(visibleRange, data)}
      </div>
    </div>
  );
}
```

## Related Documentation

- [HeightProvider](height-provider.md) - Row height management
- [ViewportModel](viewport-model.md) - Visible range calculation
- [CellPositioner](cell-positioner.md) - Coordinate conversion
- [Architecture](../ARCHITECTURE.md) - System design
- [Performance](../performance.md) - Performance constraints
