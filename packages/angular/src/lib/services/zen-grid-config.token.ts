import { InjectionToken, type Provider } from '@angular/core';
import type { ZenGridConfig } from '../types';

export const ZEN_GRID_CONFIG = new InjectionToken<ZenGridConfig>('ZenGridConfig');

export function provideZenGrid(config: ZenGridConfig): Provider {
  return {
    provide: ZEN_GRID_CONFIG,
    useValue: config,
  };
}
