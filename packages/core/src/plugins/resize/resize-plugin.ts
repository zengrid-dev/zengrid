import type { GridPlugin } from '../../reactive/types';

export interface ResizePluginOptions {
  debounceMs?: number; // default 150
}

export function createResizePlugin(options?: ResizePluginOptions): GridPlugin {
  const debounceMs = options?.debounceMs ?? 150;

  return {
    name: 'resize',
    phase: 120,
    setup(store, api) {
      store.extend('viewport.width', 0, 'resize', 120);
      store.extend('viewport.height', 0, 'resize', 120);

      let observer: ResizeObserver | null = null;
      let debounceTimer: ReturnType<typeof setTimeout> | null = null;

      store.action(
        'resize:attach',
        (el: HTMLElement) => {
          if (observer) store.exec('resize:detach');

          // Initialize dimensions immediately
          const rect = el.getBoundingClientRect();
          store.set('viewport.width', rect.width);
          store.set('viewport.height', rect.height);

          if (typeof ResizeObserver === 'undefined') return;
          observer = new ResizeObserver((entries) => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              const entry = entries[entries.length - 1];
              const { width, height } = entry.contentRect;
              store.set('viewport.width', width);
              store.set('viewport.height', height);
              api.fireEvent('viewport:resized', { width, height });
            }, debounceMs);
          });
          observer.observe(el);
        },
        'resize'
      );

      const detach = () => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
          debounceTimer = null;
        }
        if (observer) {
          observer.disconnect();
          observer = null;
        }
      };

      store.action('resize:detach', detach, 'resize');

      api.register('resize', {
        getDimensions: () => ({
          width: store.get('viewport.width') as number,
          height: store.get('viewport.height') as number,
        }),
        attach: (el: HTMLElement) => store.exec('resize:attach', el),
        detach: () => store.exec('resize:detach'),
      });

      return { teardown: [detach] };
    },
  };
}
