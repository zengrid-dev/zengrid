import type { GridPlugin, PluginDisposable } from '../reactive/types';

export interface CorePluginOptions {
  initialData?: unknown[];
}

export function createCorePlugin(options?: CorePluginOptions): GridPlugin {
  return {
    name: 'core',
    phase: 0,
    setup(store, api): PluginDisposable {
      const data = options?.initialData ?? [];
      store.extend('rows.raw', data, 'core');
      store.extend(
        'rows.indices',
        Array.from({ length: data.length }, (_, i) => i),
        'core'
      );
      store.extend('rows.count', data.length, 'core');

      store.action(
        'core:setData',
        (newData: unknown[]) => {
          store.set('rows.raw', newData);
          store.set(
            'rows.indices',
            Array.from({ length: newData.length }, (_, i) => i)
          );
          store.set('rows.count', newData.length);
        },
        'core'
      );

      api.register('core', {
        setData: (d: unknown[]) => store.exec('core:setData', d),
        getRowCount: () => store.get('rows.count'),
        getData: () => store.get('rows.raw'),
        getRow: (i: number) => store.getRow(i),
      });

      return { teardown: [] };
    },
  };
}
