import { PluginHost } from '../../../grid/plugin-host';
import { GridApiImpl } from '../../../grid/grid-api';
import { GridStoreImpl } from '../../../reactive/store';
import { EventEmitter } from '../../../utils';
import { resetTracking } from '../../../reactive/tracking';
import { resetDebug } from '../../../reactive/debug';
import { resetScheduler } from '../../../reactive/effect-scheduler';
import { createResizePlugin } from '../resize-plugin';

let store: GridStoreImpl;
let emitter: EventEmitter;
let api: GridApiImpl;
let host: PluginHost;

// Mock ResizeObserver
let resizeCallback: ResizeObserverCallback;
let mockObserve: jest.Mock;
let mockDisconnect: jest.Mock;

beforeEach(() => {
  resetTracking();
  resetDebug();
  resetScheduler();
  store = new GridStoreImpl();
  emitter = new EventEmitter();
  api = new GridApiImpl(store, emitter);
  host = new PluginHost(store, api);

  jest.useFakeTimers();

  mockObserve = jest.fn();
  mockDisconnect = jest.fn();

  (globalThis as any).ResizeObserver = class {
    constructor(cb: ResizeObserverCallback) {
      resizeCallback = cb;
    }
    observe = mockObserve;
    disconnect = mockDisconnect;
    unobserve = jest.fn();
  };
});

afterEach(() => {
  jest.useRealTimers();
});

function createMockContainer(width = 800, height = 600): HTMLElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({
    width,
    height,
    top: 0,
    left: 0,
    bottom: height,
    right: width,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
  return el;
}

function triggerResize(width: number, height: number) {
  resizeCallback([{ contentRect: { width, height } } as any], null as any);
}

describe('ResizePlugin', () => {
  it('extends store with viewport.width and viewport.height', () => {
    host.use(createResizePlugin());

    expect(store.get('viewport.width')).toBe(0);
    expect(store.get('viewport.height')).toBe(0);
  });

  it('resize:attach initializes dimensions from container', () => {
    host.use(createResizePlugin());

    const container = createMockContainer(800, 600);
    store.exec('resize:attach', container);

    expect(store.get('viewport.width')).toBe(800);
    expect(store.get('viewport.height')).toBe(600);
    expect(mockObserve).toHaveBeenCalledWith(container);
  });

  it('ResizeObserver updates dimensions after debounce', () => {
    host.use(createResizePlugin({ debounceMs: 100 }));

    const container = createMockContainer();
    store.exec('resize:attach', container);

    triggerResize(1024, 768);

    // Before debounce, still initial values
    expect(store.get('viewport.width')).toBe(800);
    expect(store.get('viewport.height')).toBe(600);

    // After debounce
    jest.advanceTimersByTime(100);

    expect(store.get('viewport.width')).toBe(1024);
    expect(store.get('viewport.height')).toBe(768);
  });

  it('debounces rapid resize events', () => {
    host.use(createResizePlugin({ debounceMs: 100 }));

    const container = createMockContainer();
    store.exec('resize:attach', container);

    // Rapid resizes
    triggerResize(500, 400);
    jest.advanceTimersByTime(50);
    triggerResize(600, 500);
    jest.advanceTimersByTime(50);
    triggerResize(700, 600);

    // Not yet debounced from last resize
    expect(store.get('viewport.width')).toBe(800); // still initial

    jest.advanceTimersByTime(100);

    // Only final values should be applied
    expect(store.get('viewport.width')).toBe(700);
    expect(store.get('viewport.height')).toBe(600);
  });

  it('fires viewport:resized event after debounce', () => {
    host.use(createResizePlugin({ debounceMs: 100 }));

    const fired: any[] = [];
    emitter.on('viewport:resized' as any, (payload: any) => fired.push(payload));

    const container = createMockContainer();
    store.exec('resize:attach', container);

    triggerResize(1200, 900);

    expect(fired).toHaveLength(0);

    jest.advanceTimersByTime(100);

    expect(fired).toHaveLength(1);
    expect(fired[0]).toEqual({ width: 1200, height: 900 });
  });

  it('resize:detach disconnects observer', () => {
    host.use(createResizePlugin());

    const container = createMockContainer();
    store.exec('resize:attach', container);

    store.exec('resize:detach');

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('teardown calls resize:detach', () => {
    host.use(createResizePlugin());

    const container = createMockContainer();
    store.exec('resize:attach', container);

    host.destroy();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('API getDimensions returns current dimensions', () => {
    host.use(createResizePlugin({ debounceMs: 50 }));

    const getDimensions = api.getMethod('resize', 'getDimensions') as Function;
    expect(getDimensions()).toEqual({ width: 0, height: 0 });

    const container = createMockContainer(1000, 500);
    store.exec('resize:attach', container);

    expect(getDimensions()).toEqual({ width: 1000, height: 500 });
  });
});
