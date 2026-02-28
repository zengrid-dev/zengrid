import type { GridPlugin } from '../../reactive/types';

export interface ScrollPluginOptions {
  // reserved for future options (e.g., debounce)
}

export function createScrollPlugin(_options?: ScrollPluginOptions): GridPlugin {
  return {
    name: 'scroll',
    phase: 100,
    setup(store, api) {
      store.extend('scroll.top', 0, 'scroll', 100);
      store.extend('scroll.left', 0, 'scroll', 100);

      let container: HTMLElement | null = null;

      let hasRendering = false;

      const onScroll = (e: Event) => {
        const target = e.target as HTMLElement;
        store.set('scroll.top', target.scrollTop);
        store.set('scroll.left', target.scrollLeft);
        // Bridge to rendering plugin for virtual scroll updates
        if (hasRendering) {
          store.exec('rendering:handleScroll', target.scrollTop, target.scrollLeft);
        }
      };

      store.action(
        'scroll:attach',
        (el: HTMLElement) => {
          if (container) {
            container.removeEventListener('scroll', onScroll);
          }
          container = el;
          container.addEventListener('scroll', onScroll, { passive: true });
          // Check once at attach time — rendering plugin is always installed before scroll:attach
          hasRendering = !!api.getMethod('rendering', 'handleScroll');
        },
        'scroll'
      );

      const detach = () => {
        if (container) {
          container.removeEventListener('scroll', onScroll);
          container = null;
        }
      };

      store.action('scroll:detach', detach, 'scroll');

      api.register('scroll', {
        getPosition: () => ({
          top: store.get('scroll.top') as number,
          left: store.get('scroll.left') as number,
        }),
        attach: (el: HTMLElement) => store.exec('scroll:attach', el),
        detach: () => store.exec('scroll:detach'),
      });

      return { teardown: [detach] };
    },
  };
}
