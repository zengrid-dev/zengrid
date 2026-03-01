import { GridApiImpl } from '../grid-api';
import { GridStoreImpl } from '../../reactive/store';
import { EventEmitter } from '../../utils';
import { resetTracking } from '../../reactive/tracking';
import { resetDebug } from '../../reactive/debug';
import { resetScheduler } from '../../reactive/effect-scheduler';

let store: GridStoreImpl;
let emitter: EventEmitter;
let api: GridApiImpl;

beforeEach(() => {
  resetTracking();
  resetDebug();
  resetScheduler();
  store = new GridStoreImpl();
  emitter = new EventEmitter();
  api = new GridApiImpl(store, emitter);
});

describe('GridApiImpl', () => {
  describe('register + getMethod', () => {
    it('round-trips registered methods', () => {
      const fn = () => 42;
      api.register('sort', { apply: fn });
      expect(api.getMethod('sort', 'apply')).toBe(fn);
    });

    it('throws on duplicate namespace', () => {
      api.register('sort', { apply: () => {} });
      expect(() => api.register('sort', { reset: () => {} })).toThrow(
        'Namespace "sort" already registered'
      );
    });

    it('returns undefined for missing namespace', () => {
      expect(api.getMethod('unknown', 'foo')).toBeUndefined();
    });

    it('returns undefined for missing method in existing namespace', () => {
      api.register('sort', { apply: () => {} });
      expect(api.getMethod('sort', 'missing')).toBeUndefined();
    });
  });

  describe('exec', () => {
    it('delegates to store.exec', () => {
      let called = false;
      store.extend('rows.raw', [], 'core');
      store.action(
        'setData',
        () => {
          called = true;
        },
        'core'
      );
      api.exec('setData');
      expect(called).toBe(true);
    });
  });

  describe('fireEvent', () => {
    it('delegates to eventEmitter.emit', () => {
      let received: unknown = null;
      emitter.on('cellClick', (data: unknown) => {
        received = data;
      });
      api.fireEvent('cellClick', { row: 1, col: 2 });
      expect(received).toEqual({ row: 1, col: 2 });
    });
  });

  describe('getNamespaces', () => {
    it('lists all registered namespaces', () => {
      api.register('sort', { apply: () => {} });
      api.register('filter', { apply: () => {} });
      expect(api.getNamespaces()).toEqual(['sort', 'filter']);
    });

    it('returns empty array when none registered', () => {
      expect(api.getNamespaces()).toEqual([]);
    });
  });
});
