import { EventEmitter } from '../../events/event-emitter';
import type { GridEvents } from '../../events/grid-events';
import { buildRenderParams } from './header-render-params';

describe('buildRenderParams', () => {
  const emitter = new EventEmitter<GridEvents>();
  const column = { field: 'name', header: 'Name', sortable: true };

  it('uses sortIndex as the displayed multi-sort priority', () => {
    const sortState = [
      { column: 1, direction: 'desc' as const, sortIndex: 1 },
      { column: 0, direction: 'asc' as const, sortIndex: 0 },
    ];

    const primary = buildRenderParams(column, 0, 0, 120, 40, sortState, [], emitter);
    const secondary = buildRenderParams(
      { field: 'score', header: 'Score', sortable: true },
      1,
      1,
      120,
      40,
      sortState,
      [],
      emitter
    );
    const unsorted = buildRenderParams(
      { field: 'status', header: 'Status', sortable: true },
      2,
      2,
      120,
      40,
      sortState,
      [],
      emitter
    );

    expect(primary.sortPriority).toBe(0);
    expect(secondary.sortPriority).toBe(1);
    expect(unsorted.sortPriority).toBeUndefined();
  });
});
