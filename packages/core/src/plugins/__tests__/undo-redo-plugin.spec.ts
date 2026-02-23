import { PluginHost } from '../../grid/plugin-host';
import { GridApiImpl } from '../../grid/grid-api';
import { GridStoreImpl } from '../../reactive/store';
import { EventEmitter } from '../../utils';
import { resetTracking } from '../../reactive/tracking';
import { resetDebug } from '../../reactive/debug';
import { resetScheduler } from '../../reactive/effect-scheduler';
import { createCorePlugin } from '../core-plugin';
import { createUndoRedoPlugin } from '../undo-redo';

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

describe('UndoRedoPlugin', () => {
  it('throws without core dependency', () => {
    expect(() => host.use(createUndoRedoPlugin())).toThrow('requires "core"');
  });

  it('initializes canUndo = false and canRedo = false', () => {
    host.use(createCorePlugin({ initialData: [[1]] }));
    host.use(createUndoRedoPlugin());

    expect(store.get('undoRedo.canUndo')).toBe(false);
    expect(store.get('undoRedo.canRedo')).toBe(false);
  });

  it('records cell edit and enables undo', () => {
    host.use(createCorePlugin({ initialData: [[1]] }));
    host.use(createUndoRedoPlugin({ enableCommandGrouping: false }));

    const setValue = jest.fn();
    store.exec('undoRedo:recordCellEdit', 0, 0, 'old', 'new', setValue);

    expect(store.get('undoRedo.canUndo')).toBe(true);
    expect(store.get('undoRedo.canRedo')).toBe(false);
  });

  it('undo reverts cell edit', () => {
    host.use(createCorePlugin({ initialData: [[1]] }));
    host.use(createUndoRedoPlugin({ enableCommandGrouping: false }));

    const setValue = jest.fn();
    store.exec('undoRedo:recordCellEdit', 0, 0, 'old', 'new', setValue);

    store.exec('undoRedo:undo');

    expect(setValue).toHaveBeenCalledWith(0, 0, 'old');
    expect(store.get('undoRedo.canUndo')).toBe(false);
    expect(store.get('undoRedo.canRedo')).toBe(true);
  });

  it('redo reapplies cell edit', () => {
    host.use(createCorePlugin({ initialData: [[1]] }));
    host.use(createUndoRedoPlugin({ enableCommandGrouping: false }));

    const setValue = jest.fn();
    store.exec('undoRedo:recordCellEdit', 0, 0, 'old', 'new', setValue);

    store.exec('undoRedo:undo');
    store.exec('undoRedo:redo');

    expect(setValue).toHaveBeenCalledWith(0, 0, 'new');
    expect(store.get('undoRedo.canUndo')).toBe(true);
    expect(store.get('undoRedo.canRedo')).toBe(false);
  });

  it('undoRedo:clear resets state', () => {
    host.use(createCorePlugin({ initialData: [[1]] }));
    host.use(createUndoRedoPlugin({ enableCommandGrouping: false }));

    const setValue = jest.fn();
    store.exec('undoRedo:recordCellEdit', 0, 0, 'old', 'new', setValue);
    expect(store.get('undoRedo.canUndo')).toBe(true);

    store.exec('undoRedo:clear');
    expect(store.get('undoRedo.canUndo')).toBe(false);
    expect(store.get('undoRedo.canRedo')).toBe(false);
  });

  it('fires undo-redo:change event', () => {
    const events: unknown[] = [];
    emitter.on('undo-redo:change', (d: unknown) => events.push(d));

    host.use(createCorePlugin({ initialData: [[1]] }));
    host.use(createUndoRedoPlugin({ enableCommandGrouping: false }));

    const setValue = jest.fn();
    store.exec('undoRedo:recordCellEdit', 0, 0, 'old', 'new', setValue);

    expect(events.length).toBe(1);
    expect((events[0] as any).canUndo).toBe(true);
    expect((events[0] as any).canRedo).toBe(false);
  });

  it('API methods are registered', () => {
    host.use(createCorePlugin({ initialData: [[1]] }));
    host.use(createUndoRedoPlugin());

    expect(api.getMethod('undoRedo', 'undo')).toBeDefined();
    expect(api.getMethod('undoRedo', 'redo')).toBeDefined();
    expect(api.getMethod('undoRedo', 'recordCellEdit')).toBeDefined();
    expect(api.getMethod('undoRedo', 'clear')).toBeDefined();
    expect(api.getMethod('undoRedo', 'canUndo')).toBeDefined();
    expect(api.getMethod('undoRedo', 'canRedo')).toBeDefined();
  });

  it('destroy cleans up without error', () => {
    host.use(createCorePlugin({ initialData: [[1]] }));
    host.use(createUndoRedoPlugin());

    const setValue = jest.fn();
    store.exec('undoRedo:recordCellEdit', 0, 0, 'a', 'b', setValue);
    expect(() => host.destroy()).not.toThrow();
  });
});
