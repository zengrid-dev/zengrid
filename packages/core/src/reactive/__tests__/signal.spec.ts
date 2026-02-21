import { createSignal, createComputed, gridBatch } from '../signal';
import { resetTracking } from '../tracking';
import { resetDebug } from '../debug';

beforeEach(() => {
  resetTracking();
  resetDebug();
});

describe('createSignal', () => {
  it('reads and writes values', () => {
    const s = createSignal('count', 0);
    expect(s.value).toBe(0);
    s.value = 5;
    expect(s.value).toBe(5);
  });

  it('peek() reads without tracking', () => {
    const s = createSignal('count', 10);
    expect(s.peek()).toBe(10);
  });

  it('has correct metadata', () => {
    const s = createSignal('age', 25, 'plugin-a', 10);
    expect(s.metadata.name).toBe('age');
    expect(s.metadata.owner).toBe('plugin-a');
    expect(s.metadata.phase).toBe(10);
    expect(typeof s.metadata.createdAt).toBe('number');
  });

  it('exposes the underlying preact signal', () => {
    const s = createSignal('x', 42);
    expect(s.__signal).toBeDefined();
    expect(s.__signal.value).toBe(42);
  });
});

describe('createComputed', () => {
  it('derives values from signals', () => {
    const a = createSignal('a', 2);
    const b = createSignal('b', 3);
    const sum = createComputed('sum', () => a.value + b.value);

    expect(sum.value).toBe(5);
    a.value = 10;
    expect(sum.value).toBe(13);
  });

  it('diamond dependency recomputes exactly once', () => {
    const a = createSignal('a', 1);
    let bRuns = 0;
    let cRuns = 0;
    let dRuns = 0;

    const b = createComputed('b', () => {
      bRuns++;
      return a.value * 2;
    });

    const c = createComputed('c', () => {
      cRuns++;
      return a.value * 3;
    });

    const d = createComputed('d', () => {
      dRuns++;
      return b.value + c.value;
    });

    // Initial read
    expect(d.value).toBe(5); // 2 + 3
    const initialDRuns = dRuns;

    // Change source — d should recompute exactly once
    gridBatch(() => {
      a.value = 2;
    });

    expect(d.value).toBe(10); // 4 + 6
    expect(dRuns).toBe(initialDRuns + 1);
  });

  it('batch coalesces multiple writes', () => {
    const a = createSignal('a', 0);
    const b = createSignal('b', 0);
    const c = createSignal('c', 0);
    let runs = 0;

    const sum = createComputed('sum', () => {
      runs++;
      return a.value + b.value + c.value;
    });

    // Initial read
    expect(sum.value).toBe(0);
    const initialRuns = runs;

    gridBatch(() => {
      a.value = 1;
      b.value = 2;
      c.value = 3;
    });

    expect(sum.value).toBe(6);
    // Computed should have re-evaluated exactly once after the batch
    expect(runs).toBe(initialRuns + 1);
  });

  it('has correct metadata', () => {
    const c = createComputed('derived', () => 42, 'plugin-b', 20);
    expect(c.metadata.name).toBe('derived');
    expect(c.metadata.owner).toBe('plugin-b');
    expect(c.metadata.phase).toBe(20);
  });
});
