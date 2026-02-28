import { Injector } from '@angular/core';
import type { GridPlugin, GridStore, GridApiInterface, PluginDisposable } from '@zengrid/core';

export class AngularPluginWrapper implements GridPlugin {
  readonly name: string;
  readonly phase: number;
  readonly dependencies?: string[];

  constructor(
    private readonly injector: Injector,
    private readonly pluginFactory: (injector: Injector) => GridPlugin,
  ) {
    const plugin = this.pluginFactory(this.injector);
    this.name = plugin.name;
    this.phase = plugin.phase;
    this.dependencies = plugin.dependencies;
  }

  setup(store: GridStore, api: GridApiInterface): PluginDisposable | void {
    const plugin = this.pluginFactory(this.injector);
    return plugin.setup(store, api);
  }

  dispose(): void {
    // Plugin cleanup handled by PluginHost
  }
}

export function createAngularPlugin(
  injector: Injector,
  factory: (injector: Injector) => GridPlugin,
): GridPlugin {
  return new AngularPluginWrapper(injector, factory);
}
