import {
  Injectable,
  TemplateRef,
  ApplicationRef,
  EmbeddedViewRef,
  inject,
  Injector,
  createComponent,
  ComponentRef,
  Type,
  EnvironmentInjector,
} from '@angular/core';
import type {
  CellRenderer,
  RenderParams,
  CellEditor,
  EditorParams,
} from '@zengrid/core';
import type { ZenCellTemplateContext, ZenEditorTemplateContext } from '../types';

interface PooledView<C> {
  viewRef: EmbeddedViewRef<C>;
  inUse: boolean;
}

interface PooledComponent {
  componentRef: ComponentRef<any>;
  inUse: boolean;
}

const MAX_POOL_SIZE = 100;

@Injectable({ providedIn: 'root' })
export class TemplateBridgeService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(Injector);
  private readonly envInjector = inject(EnvironmentInjector);

  private templatePools = new Map<TemplateRef<any>, PooledView<any>[]>();
  private componentPools = new Map<Type<any>, PooledComponent[]>();

  createTemplateRenderer(templateRef: TemplateRef<ZenCellTemplateContext>): CellRenderer {
    return new TemplateRendererBridge(this, templateRef);
  }

  createComponentRenderer(componentType: Type<any>): CellRenderer {
    return new ComponentRendererBridge(this, componentType);
  }

  createTemplateEditor(templateRef: TemplateRef<ZenEditorTemplateContext>): CellEditor {
    return new TemplateEditorBridge(this, templateRef);
  }

  createComponentEditor(componentType: Type<any>): CellEditor {
    return new ComponentEditorBridge(this, componentType);
  }

  acquireView<C>(templateRef: TemplateRef<C>, context: C): EmbeddedViewRef<C> {
    let pool = this.templatePools.get(templateRef);
    if (!pool) {
      pool = [];
      this.templatePools.set(templateRef, pool);
    }

    // Find a pooled view not in use
    const pooled = pool.find(p => !p.inUse);
    if (pooled) {
      pooled.inUse = true;
      // Update context
      Object.assign(pooled.viewRef.context as any, context);
      pooled.viewRef.detectChanges();
      return pooled.viewRef;
    }

    // Create new
    const viewRef = templateRef.createEmbeddedView(context);
    this.appRef.attachView(viewRef);

    if (pool.length < MAX_POOL_SIZE) {
      pool.push({ viewRef, inUse: true });
    }

    return viewRef;
  }

  releaseView<C>(templateRef: TemplateRef<C>, viewRef: EmbeddedViewRef<C>): void {
    const pool = this.templatePools.get(templateRef);
    if (!pool) return;

    const pooled = pool.find(p => p.viewRef === viewRef);
    if (pooled) {
      pooled.inUse = false;
      // Detach root nodes from DOM
      for (const node of viewRef.rootNodes) {
        (node as HTMLElement).remove?.();
      }
    } else {
      this.appRef.detachView(viewRef);
      viewRef.destroy();
    }
  }

  acquireComponent(componentType: Type<any>, hostElement: HTMLElement): ComponentRef<any> {
    let pool = this.componentPools.get(componentType);
    if (!pool) {
      pool = [];
      this.componentPools.set(componentType, pool);
    }

    const pooled = pool.find(p => !p.inUse);
    if (pooled) {
      pooled.inUse = true;
      hostElement.appendChild((pooled.componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0]);
      return pooled.componentRef;
    }

    const componentRef = createComponent(componentType, {
      environmentInjector: this.envInjector,
      elementInjector: this.injector,
      hostElement,
    });
    this.appRef.attachView(componentRef.hostView);

    if (pool.length < MAX_POOL_SIZE) {
      pool.push({ componentRef, inUse: true });
    }

    return componentRef;
  }

  releaseComponent(componentType: Type<any>, componentRef: ComponentRef<any>): void {
    const pool = this.componentPools.get(componentType);
    if (!pool) return;

    const pooled = pool.find(p => p.componentRef === componentRef);
    if (pooled) {
      pooled.inUse = false;
      const rootNode = (componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
      rootNode?.remove?.();
    } else {
      componentRef.destroy();
    }
  }

  destroyAll(): void {
    for (const pool of this.templatePools.values()) {
      for (const { viewRef } of pool) {
        this.appRef.detachView(viewRef);
        viewRef.destroy();
      }
    }
    this.templatePools.clear();

    for (const pool of this.componentPools.values()) {
      for (const { componentRef } of pool) {
        componentRef.destroy();
      }
    }
    this.componentPools.clear();
  }
}

class TemplateRendererBridge implements CellRenderer {
  private activeViews = new Map<HTMLElement, EmbeddedViewRef<ZenCellTemplateContext>>();

  constructor(
    private bridge: TemplateBridgeService,
    private templateRef: TemplateRef<ZenCellTemplateContext>,
  ) {}

  render(element: HTMLElement, params: RenderParams): void {
    const context: ZenCellTemplateContext = {
      $implicit: params.value,
      value: params.value,
      cell: params.cell,
      row: params.rowData,
      column: params.column!,
      isSelected: params.isSelected,
    };

    const viewRef = this.bridge.acquireView(this.templateRef, context);
    for (const node of viewRef.rootNodes) {
      element.appendChild(node);
    }
    this.activeViews.set(element, viewRef);
  }

  update(element: HTMLElement, params: RenderParams): void {
    const viewRef = this.activeViews.get(element);
    if (!viewRef) {
      this.render(element, params);
      return;
    }

    const ctx = viewRef.context;
    ctx.$implicit = params.value;
    ctx.value = params.value;
    ctx.cell = params.cell;
    ctx.row = params.rowData;
    ctx.column = params.column!;
    ctx.isSelected = params.isSelected;
    viewRef.detectChanges();
  }

  destroy(element: HTMLElement): void {
    const viewRef = this.activeViews.get(element);
    if (viewRef) {
      this.bridge.releaseView(this.templateRef, viewRef);
      this.activeViews.delete(element);
    }
  }
}

class ComponentRendererBridge implements CellRenderer {
  private activeComponents = new Map<HTMLElement, ComponentRef<any>>();

  constructor(
    private bridge: TemplateBridgeService,
    private componentType: Type<any>,
  ) {}

  render(element: HTMLElement, params: RenderParams): void {
    const componentRef = this.bridge.acquireComponent(this.componentType, element);
    componentRef.setInput('params', params);
    componentRef.changeDetectorRef.detectChanges();
    this.activeComponents.set(element, componentRef);
  }

  update(element: HTMLElement, params: RenderParams): void {
    const componentRef = this.activeComponents.get(element);
    if (!componentRef) {
      this.render(element, params);
      return;
    }
    componentRef.setInput('params', params);
    componentRef.changeDetectorRef.detectChanges();
  }

  destroy(element: HTMLElement): void {
    const componentRef = this.activeComponents.get(element);
    if (componentRef) {
      this.bridge.releaseComponent(this.componentType, componentRef);
      this.activeComponents.delete(element);
    }
  }
}

class TemplateEditorBridge implements CellEditor {
  private viewRef: EmbeddedViewRef<ZenEditorTemplateContext> | null = null;
  private currentValue: any = null;
  private onCompleteFn: ((value: any, cancelled: boolean) => void) | null = null;

  constructor(
    private bridge: TemplateBridgeService,
    private templateRef: TemplateRef<ZenEditorTemplateContext>,
  ) {}

  init(container: HTMLElement, value: any, params: EditorParams): void {
    this.currentValue = value;
    this.onCompleteFn = params.onComplete ?? null;

    const context: ZenEditorTemplateContext = {
      $implicit: value,
      value,
      cell: params.cell,
      onComplete: (v: any) => {
        this.currentValue = v;
        this.onCompleteFn?.(v, false);
      },
      onChange: (v: any) => {
        this.currentValue = v;
        params.onChange?.(v);
      },
    };

    this.viewRef = this.bridge.acquireView(this.templateRef, context);
    for (const node of this.viewRef.rootNodes) {
      container.appendChild(node);
    }
  }

  getValue(): any {
    return this.currentValue;
  }

  focus(): void {
    if (!this.viewRef) return;
    const firstInput = this.viewRef.rootNodes
      .find((n: any) => n.querySelector?.('input,select,textarea'));
    firstInput?.querySelector?.('input,select,textarea')?.focus();
  }

  destroy(): void {
    if (this.viewRef) {
      this.bridge.releaseView(this.templateRef, this.viewRef);
      this.viewRef = null;
    }
  }
}

class ComponentEditorBridge implements CellEditor {
  private componentRef: ComponentRef<any> | null = null;
  private currentValue: any = null;

  constructor(
    private bridge: TemplateBridgeService,
    private componentType: Type<any>,
  ) {}

  init(container: HTMLElement, value: any, params: EditorParams): void {
    this.currentValue = value;
    this.componentRef = this.bridge.acquireComponent(this.componentType, container);
    this.componentRef.setInput('value', value);
    this.componentRef.setInput('params', params);
    this.componentRef.setInput('onComplete', (v: any) => {
      this.currentValue = v;
      params.onComplete?.(v, false);
    });
    this.componentRef.setInput('onChange', (v: any) => {
      this.currentValue = v;
      params.onChange?.(v);
    });
    this.componentRef.changeDetectorRef.detectChanges();
  }

  getValue(): any {
    return this.currentValue;
  }

  focus(): void {
    const hostEl = this.componentRef?.location?.nativeElement as HTMLElement;
    (hostEl?.querySelector?.('input,select,textarea') as HTMLElement)?.focus();
  }

  destroy(): void {
    if (this.componentRef) {
      this.bridge.releaseComponent(this.componentType, this.componentRef);
      this.componentRef = null;
    }
  }
}
