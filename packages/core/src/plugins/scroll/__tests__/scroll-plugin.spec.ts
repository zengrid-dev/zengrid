import { PluginHost } from '../../../grid/plugin-host';
import { GridApiImpl } from '../../../grid/grid-api';
import { GridStoreImpl } from '../../../reactive/store';
import { EventEmitter } from '../../../utils';
import { resetTracking } from '../../../reactive/tracking';
import { resetDebug } from '../../../reactive/debug';
import { resetScheduler } from '../../../reactive/effect-scheduler';
import { createScrollPlugin } from '../scroll-plugin';

let store: GridStoreImpl;
let emitter: EventEmitter;
let api: GridApiImpl;
let host: PluginHost;

function createScrollableContainer(scrollTop = 0, scrollLeft = 0): HTMLElement {
  const el = document.createElement('div');
  let _scrollTop = scrollTop;
  let _scrollLeft = scrollLeft;
  Object.defineProperty(el, 'scrollTop', {
    get: () => _scrollTop,
    set: (v: number) => {
      _scrollTop = v;
    },
    configurable: true,
  });
  Object.defineProperty(el, 'scrollLeft', {
    get: () => _scrollLeft,
    set: (v: number) => {
      _scrollLeft = v;
    },
    configurable: true,
  });
  return el;
}

beforeEach(() => {
  resetTracking();
  resetDebug();
  resetScheduler();
  store = new GridStoreImpl();
  emitter = new EventEmitter();
  api = new GridApiImpl(store, emitter);
  host = new PluginHost(store, api);
});

describe('ScrollPlugin', () => {
  it('extends store with scroll.top and scroll.left signals', () => {
    host.use(createScrollPlugin());

    expect(store.get('scroll.top')).toBe(0);
    expect(store.get('scroll.left')).toBe(0);
  });

  it('scroll:attach adds listener and updates store on scroll', () => {
    host.use(createScrollPlugin());

    const container = createScrollableContainer();
    store.exec('scroll:attach', container);

    // Simulate scroll
    (container as any).scrollTop = 150;
    (container as any).scrollLeft = 75;
    container.dispatchEvent(new Event('scroll'));

    expect(store.get('scroll.top')).toBe(150);
    expect(store.get('scroll.left')).toBe(75);
  });

  it('scroll:detach removes listener', () => {
    host.use(createScrollPlugin());

    const container = createScrollableContainer();
    store.exec('scroll:attach', container);

    // Verify it works
    (container as any).scrollTop = 100;
    (container as any).scrollLeft = 50;
    container.dispatchEvent(new Event('scroll'));
    expect(store.get('scroll.top')).toBe(100);

    // Detach
    store.exec('scroll:detach');

    // Scroll again — values should not change
    (container as any).scrollTop = 200;
    (container as any).scrollLeft = 100;
    container.dispatchEvent(new Event('scroll'));

    expect(store.get('scroll.top')).toBe(100);
    expect(store.get('scroll.left')).toBe(50);
  });

  it('teardown calls scroll:detach', () => {
    host.use(createScrollPlugin());

    const container = createScrollableContainer();
    store.exec('scroll:attach', container);

    const removeSpy = jest.spyOn(container, 'removeEventListener');

    // Destroy should call teardown which detaches
    host.destroy();

    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('API getPosition returns current scroll position', () => {
    host.use(createScrollPlugin());

    const getPosition = api.getMethod('scroll', 'getPosition') as Function;
    expect(getPosition()).toEqual({ top: 0, left: 0 });

    const container = createScrollableContainer();
    store.exec('scroll:attach', container);

    (container as any).scrollTop = 200;
    (container as any).scrollLeft = 300;
    container.dispatchEvent(new Event('scroll'));

    expect(getPosition()).toEqual({ top: 200, left: 300 });
  });

  it('re-attaching detaches previous container', () => {
    host.use(createScrollPlugin());

    const container1 = createScrollableContainer();
    const container2 = createScrollableContainer();

    store.exec('scroll:attach', container1);

    // Scroll on container1
    (container1 as any).scrollTop = 50;
    (container1 as any).scrollLeft = 25;
    container1.dispatchEvent(new Event('scroll'));
    expect(store.get('scroll.top')).toBe(50);

    // Attach container2
    store.exec('scroll:attach', container2);

    // Scroll on container1 should not update
    (container1 as any).scrollTop = 999;
    container1.dispatchEvent(new Event('scroll'));
    expect(store.get('scroll.top')).toBe(50);

    // Scroll on container2 should update
    (container2 as any).scrollTop = 300;
    (container2 as any).scrollLeft = 150;
    container2.dispatchEvent(new Event('scroll'));
    expect(store.get('scroll.top')).toBe(300);
    expect(store.get('scroll.left')).toBe(150);
  });
});
