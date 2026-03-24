import { DataManager } from './data-manager';
import { EventEmitter } from '../events/event-emitter';
import type { GridEvents } from '../events/grid-events';

function createBackendManager(
  callback: (request: import('../types').DataLoadRequest) => Promise<import('../types').DataLoadResponse>
): DataManager {
  return new DataManager({
    rowCount: 10,
    events: new EventEmitter<GridEvents>(),
    modeConfig: {
      mode: 'backend',
      callback,
    },
  });
}

describe('DataManager', () => {
  it('does not swallow load errors when destroyed during error handling', async () => {
    const expectedError = new Error('backend failed');
    const manager = createBackendManager(async () => {
      throw expectedError;
    });

    const events = (manager as any).events as EventEmitter<GridEvents>;
    events.on('error', () => {
      manager.destroy();
    });

    await expect(manager.loadRange(0, 5)).rejects.toThrow(expectedError);
  });

  it('cancels pending backend requests with an abort signal', async () => {
    let receivedSignal: AbortSignal | undefined;

    const manager = createBackendManager((request) => {
      receivedSignal = request.signal;
      return new Promise(() => {
        // Intentionally unresolved until cancellation.
      });
    });

    const loadPromise = manager.loadRange(0, 5);
    await Promise.resolve();

    manager.cancelPendingRequests();

    await expect(loadPromise).rejects.toMatchObject({ name: 'AbortError' });
    expect(receivedSignal).toBeDefined();
    expect(receivedSignal?.aborted).toBe(true);
    expect(manager.isDataLoading()).toBe(false);
  });
});
