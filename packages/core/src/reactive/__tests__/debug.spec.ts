import { createSignal, gridBatch } from '../signal';
import {
  getEventLog,
  getEventsByTrace,
  resetDebug,
  getCurrentTraceId,
} from '../debug';
import { resetTracking } from '../tracking';

beforeEach(() => {
  resetTracking();
  resetDebug();
});

describe('debug', () => {
  it('records signal writes', () => {
    const s = createSignal('x', 0);
    s.value = 1;
    s.value = 2;

    const log = getEventLog();
    const writes = log.filter((e) => e.type === 'signal-write');
    expect(writes.length).toBe(2);
    expect(writes[0].name).toBe('x');
    expect(writes[0].oldValue).toBe(0);
    expect(writes[0].newValue).toBe(1);
    expect(writes[1].oldValue).toBe(1);
    expect(writes[1].newValue).toBe(2);
  });

  it('batch links events under same traceId', () => {
    const a = createSignal('a', 0);
    const b = createSignal('b', 0);

    gridBatch(() => {
      a.value = 1;
      b.value = 2;
    });

    const log = getEventLog();
    const traceIds = new Set(log.map((e) => e.traceId));

    // All events in the batch share the same non-zero traceId
    expect(traceIds.size).toBe(1);
    const traceId = [...traceIds][0];
    expect(traceId).toBeGreaterThan(0);
  });

  it('getEventsByTrace filters correctly', () => {
    const a = createSignal('a', 0);
    const b = createSignal('b', 0);

    // First batch
    gridBatch(() => {
      a.value = 1;
    });

    const firstLog = getEventLog();
    const firstTraceId = firstLog[firstLog.length - 1].traceId;

    // Second batch
    gridBatch(() => {
      b.value = 2;
    });

    const byFirst = getEventsByTrace(firstTraceId);
    expect(byFirst.length).toBe(1);
    expect(byFirst[0].name).toBe('a');
  });

  it('ring buffer evicts oldest after capacity', () => {
    const s = createSignal('x', 0);

    // Write more than the default capacity (1000)
    for (let i = 1; i <= 1010; i++) {
      s.value = i;
    }

    const log = getEventLog();
    expect(log.length).toBe(1000);
    // Oldest should have been evicted
    expect(log[0].newValue).toBe(11); // first 10 evicted
  });

  it('traceId is cleared after batch', () => {
    const s = createSignal('x', 0);

    gridBatch(() => {
      s.value = 1;
    });

    expect(getCurrentTraceId()).toBe(0);
  });
});
