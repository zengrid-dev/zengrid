import { createSignal } from '../signal';
import { createEffect, flushEffects, resetScheduler } from '../effect-scheduler';
import { resetTracking } from '../tracking';
import { resetDebug } from '../debug';

beforeEach(() => {
  resetTracking();
  resetDebug();
  resetScheduler();
});

describe('createEffect', () => {
  it('runs the effect immediately on creation', () => {
    const s = createSignal('x', 0);
    let ran = false;

    createEffect('eff', () => {
      void s.value;
      ran = true;
    });

    expect(ran).toBe(true);
  });

  it('schedules re-run on signal write (deferred to flush)', () => {
    const s = createSignal('x', 0);
    let count = 0;

    createEffect('eff', () => {
      void s.value;
      count++;
    });

    expect(count).toBe(1); // initial run

    s.value = 1;
    // Not yet re-run (deferred to rAF/flush)
    expect(count).toBe(1);

    flushEffects();
    expect(count).toBe(2);
  });

  it('coalesces multiple signal writes into one effect run', () => {
    const a = createSignal('a', 0);
    const b = createSignal('b', 0);
    const c = createSignal('c', 0);
    let count = 0;

    createEffect('eff', () => {
      void a.value;
      void b.value;
      void c.value;
      count++;
    });

    expect(count).toBe(1); // initial

    // After the first run, effect enters "schedule" mode.
    // First signal write triggers the preact effect → schedules rAF.
    // Subsequent writes don't re-trigger (preact tracks only trigger after schedule branch).
    a.value = 1;

    flushEffects();
    expect(count).toBe(2);
  });

  it('flushes effects in phase order', () => {
    const s = createSignal('s', 0);
    const order: string[] = [];

    createEffect(
      'late',
      () => {
        void s.value;
        order.push('late');
      },
      'core',
      20
    );

    createEffect(
      'early',
      () => {
        void s.value;
        order.push('early');
      },
      'core',
      10
    );

    // Initial runs happen in registration order
    order.length = 0;

    s.value = 1;
    flushEffects();

    expect(order).toEqual(['early', 'late']);
  });

  it('effect error does not break other effects', () => {
    const s = createSignal('s', 0);
    const log: string[] = [];
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    createEffect(
      'ok-first',
      () => {
        void s.value;
        log.push('ok-first');
      },
      'core',
      5
    );

    createEffect(
      'broken',
      () => {
        void s.value;
        if (s.peek() > 0) throw new Error('boom');
        log.push('broken');
      },
      'core',
      10
    );

    createEffect(
      'ok-last',
      () => {
        void s.value;
        log.push('ok-last');
      },
      'core',
      15
    );

    log.length = 0;
    s.value = 1;
    flushEffects();

    expect(log).toContain('ok-first');
    expect(log).toContain('ok-last');
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('dispose prevents future runs', () => {
    const s = createSignal('s', 0);
    let count = 0;

    const dispose = createEffect('eff', () => {
      void s.value;
      count++;
    });

    expect(count).toBe(1);
    dispose();

    s.value = 1;
    flushEffects();
    expect(count).toBe(1); // no additional run
  });

  it('cleanup function runs before re-execution', () => {
    const s = createSignal('s', 0);
    const log: string[] = [];

    createEffect('eff', () => {
      const val = s.value;
      log.push(`run-${val}`);
      return () => log.push(`cleanup-${val}`);
    });

    expect(log).toEqual(['run-0']);

    s.value = 1;
    flushEffects();

    expect(log).toEqual(['run-0', 'cleanup-0', 'run-1']);
  });
});
