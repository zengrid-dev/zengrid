import { PluginHost } from '../../grid/plugin-host';
import { GridApiImpl } from '../../grid/grid-api';
import { GridStoreImpl } from '../../reactive/store';
import { EventEmitter } from '../../utils';
import { resetTracking } from '../../reactive/tracking';
import { resetDebug } from '../../reactive/debug';
import { resetScheduler } from '../../reactive/effect-scheduler';
import { createCorePlugin } from '../core-plugin';
import { createDevToolsConnector } from '../legacy-bridge';

let store: GridStoreImpl;
let emitter: EventEmitter;
let api: GridApiImpl;
let host: PluginHost;

beforeEach(() => {
  resetTracking();
  resetDebug();
  resetScheduler();
  store = new GridStoreImpl();
  emitter = new EventEmitter();
  api = new GridApiImpl(store, emitter);
  host = new PluginHost(store, api);
  // Clean up any previous mock
  delete (window as any).__REDUX_DEVTOOLS_EXTENSION__;
});

afterEach(() => {
  delete (window as any).__REDUX_DEVTOOLS_EXTENSION__;
});

describe('DevToolsConnector', () => {
  it('requires core dependency', () => {
    expect(() => host.use(createDevToolsConnector())).toThrow('requires "core"');
  });

  it('registers at phase 300', () => {
    const plugin = createDevToolsConnector();
    expect(plugin.phase).toBe(300);
  });

  it('does nothing when devtools extension is not present', () => {
    host.use(createCorePlugin());
    expect(() => host.use(createDevToolsConnector())).not.toThrow();
  });

  describe('with mock devtools', () => {
    let mockDevtools: { send: jest.Mock; subscribe: jest.Mock; init: jest.Mock };
    let mockConnect: jest.Mock;

    beforeEach(() => {
      mockDevtools = {
        send: jest.fn(),
        subscribe: jest.fn(() => jest.fn()),
        init: jest.fn(),
      };
      mockConnect = jest.fn(() => mockDevtools);
      (window as any).__REDUX_DEVTOOLS_EXTENSION__ = { connect: mockConnect };
    });

    it('connects with default name and disabled time-travel', () => {
      host.use(createCorePlugin());
      host.use(createDevToolsConnector());
      expect(mockConnect).toHaveBeenCalledWith({
        name: 'ZenGrid Store',
        features: { jump: false, skip: false },
      });
    });

    it('connects with custom name', () => {
      host.use(createCorePlugin());
      host.use(createDevToolsConnector({ name: 'My Grid' }));
      expect(mockConnect).toHaveBeenCalledWith({
        name: 'My Grid',
        features: { jump: false, skip: false },
      });
    });

    it('calls init with initial state', () => {
      host.use(createCorePlugin({ initialData: [[1]] }));
      host.use(createDevToolsConnector());
      expect(mockDevtools.init).toHaveBeenCalledTimes(1);
      const state = mockDevtools.init.mock.calls[0][0];
      expect(state['rows.raw']).toEqual([[1]]);
    });

    it('sends action and state on store.exec', () => {
      host.use(createCorePlugin({ initialData: [[1]] }));
      host.use(createDevToolsConnector());

      store.exec('core:setData', [[2], [3]]);
      expect(mockDevtools.send).toHaveBeenCalled();
      const execCall = mockDevtools.send.mock.calls.find(
        ([action]: [{ type: string }]) => action.type === 'core:setData'
      );
      expect(execCall).toBeDefined();
      expect(execCall![0].type).toBe('core:setData');
      expect(execCall![1]['rows.raw']).toEqual([[2], [3]]);
    });

    it('sends [set] events on store.set', () => {
      host.use(createCorePlugin({ initialData: [[1]] }));
      host.use(createDevToolsConnector());

      store.set('rows.raw', [[9]]);
      const setCall = mockDevtools.send.mock.calls.find(
        ([action]: [{ type: string }]) => action.type === '[set] rows.raw'
      );
      expect(setCall).toBeDefined();
      expect(setCall![1]['rows.raw']).toEqual([[9]]);
    });

    it('restores original exec and set on teardown', () => {
      host.use(createCorePlugin({ initialData: [[1]] }));
      host.use(createDevToolsConnector());

      const wrappedExec = store.exec;
      const wrappedSet = store.set;
      host.destroy();

      expect(wrappedExec).not.toBe(store.exec);
      expect(wrappedSet).not.toBe(store.set);
    });
  });
});
