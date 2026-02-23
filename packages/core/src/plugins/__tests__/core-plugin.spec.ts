import { PluginHost } from '../../grid/plugin-host';
import { GridApiImpl } from '../../grid/grid-api';
import { GridStoreImpl } from '../../reactive/store';
import { EventEmitter } from '../../utils';
import { resetTracking } from '../../reactive/tracking';
import { resetDebug } from '../../reactive/debug';
import { resetScheduler } from '../../reactive/effect-scheduler';
import { createCorePlugin } from '../core-plugin';

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
});

describe('CorePlugin', () => {
  it('initializes with empty data by default', () => {
    host.use(createCorePlugin());

    expect(store.get('rows.raw')).toEqual([]);
    expect(store.get('rows.indices')).toEqual([]);
    expect(store.get('rows.count')).toBe(0);
  });

  it('initializes with provided data', () => {
    const data = [
      [1, 'a'],
      [2, 'b'],
      [3, 'c'],
    ];
    host.use(createCorePlugin({ initialData: data }));

    expect(store.get('rows.raw')).toEqual(data);
    expect(store.get('rows.indices')).toEqual([0, 1, 2]);
    expect(store.get('rows.count')).toBe(3);
  });

  it('core:setData action updates all three signals', () => {
    host.use(createCorePlugin({ initialData: [[1]] }));

    const newData = [
      [10, 'x'],
      [20, 'y'],
    ];
    store.exec('core:setData', newData);

    expect(store.get('rows.raw')).toEqual(newData);
    expect(store.get('rows.indices')).toEqual([0, 1]);
    expect(store.get('rows.count')).toBe(2);
  });

  it('API methods round-trip correctly', () => {
    const data = [['a'], ['b'], ['c']];
    host.use(createCorePlugin({ initialData: data }));

    const getData = api.getMethod('core', 'getData') as Function;
    const getRowCount = api.getMethod('core', 'getRowCount') as Function;
    const getRow = api.getMethod('core', 'getRow') as Function;
    const setData = api.getMethod('core', 'setData') as Function;

    expect(getData()).toEqual(data);
    expect(getRowCount()).toBe(3);
    expect(getRow(1)).toEqual(['b']);

    setData([['x'], ['y']]);
    expect(getData()).toEqual([['x'], ['y']]);
    expect(getRowCount()).toBe(2);
  });

  it('destroy cleans up without error', () => {
    host.use(createCorePlugin({ initialData: [[1]] }));
    expect(() => host.destroy()).not.toThrow();
  });
});
