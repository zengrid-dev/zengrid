import type { HeaderRenderer } from '../rendering/headers/header-renderer.interface';
import type { GridContext } from './grid-context';

export function createHeaderMethods(ctx: GridContext) {
  return {
    registerHeaderRenderer(name: string, renderer: HeaderRenderer): void {
      if (!ctx.headerManager) {
        throw new Error('Header manager not initialized. Columns must be defined.');
      }
      ctx.headerManager.registerRenderer(name, renderer);
    },

    updateHeader(columnIndex: number): void {
      ctx.headerManager?.updateHeader(columnIndex);
    },

    updateAllHeaders(): void {
      ctx.headerManager?.updateAllHeaders();
    },

    refreshHeaders(): void {
      ctx.headerManager?.refreshHeaders();
    },
  };
}

export type HeaderMethods = ReturnType<typeof createHeaderMethods>;
