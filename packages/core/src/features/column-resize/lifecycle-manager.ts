import type { EventEmitter } from '../../events/event-emitter';
import type { GridEvents } from '../../events/grid-events';
import type {
  ColumnResizeOptions,
  ResizableDataSource,
  ResizeStrategy,
} from './column-resize-manager.interface';
import { ResizeConstraintManager } from './resize-constraint-manager';
import { ResizeZoneDetector } from './resize-zone-detector';
import { ResizeStateManager } from './resize-state-manager';
import { ResizeHandleRenderer } from './resize-handle-renderer';
import { ResizePreview } from './resize-preview';
import { AutoFitCalculator } from './auto-fit-calculator';
import { EventHandlers } from './event-handlers';

export interface LifecycleState {
  container: HTMLElement | null;
  handleRenderer: ResizeHandleRenderer | null;
  previewRenderer: ResizePreview | null;
  eventHandlers: EventHandlers | null;
}

export interface LifecycleConfig {
  enabled: boolean;
  showHandles: boolean;
  showPreview: boolean;
  events?: EventEmitter<GridEvents>;
  dataSource: ResizableDataSource;
  strategy: ResizeStrategy;
  constraintManager: ResizeConstraintManager;
  zoneDetector: ResizeZoneDetector;
  stateManager: ResizeStateManager;
  autoFitCalculator: AutoFitCalculator | null;
  options: ColumnResizeOptions;
  getScrollLeft: () => number;
  getViewportHeight: () => number;
  onWidthChange: () => void;
  onUpdateHandles: () => void;
}

/**
 * Manages lifecycle operations: attach, detach, destroy
 */
export class LifecycleManager {
  private state: LifecycleState = {
    container: null,
    handleRenderer: null,
    previewRenderer: null,
    eventHandlers: null,
  };

  constructor(private config: LifecycleConfig) {}

  /**
   * Attach event listeners to container
   */
  attach(container: HTMLElement): void {
    if (!this.config.enabled) return;

    // If already attached to a different container, detach first
    if (this.state.container && this.state.container !== container) {
      this.detach();
    }

    // If already attached to the same container, do nothing
    if (this.state.container === container) {
      return;
    }

    this.state.container = container;

    // Initialize renderers
    if (this.config.showHandles) {
      this.state.handleRenderer = new ResizeHandleRenderer(container);
      this.config.onUpdateHandles();
    }

    if (this.config.showPreview) {
      this.state.previewRenderer = new ResizePreview(container);
    }

    // Initialize and attach event handlers
    this.state.eventHandlers = new EventHandlers({
      container,
      dataSource: this.config.dataSource,
      events: this.config.events,
      strategy: this.config.strategy,
      constraintManager: this.config.constraintManager,
      zoneDetector: this.config.zoneDetector,
      stateManager: this.config.stateManager,
      handleRenderer: this.state.handleRenderer,
      previewRenderer: this.state.previewRenderer,
      autoFitCalculator: this.config.autoFitCalculator,
      isColumnResizable: this.config.options.isColumnResizable,
      onBeforeResize: this.config.options.onBeforeResize,
      onDuringResize: this.config.options.onDuringResize,
      getScrollLeft: this.config.getScrollLeft,
      getViewportHeight: this.config.getViewportHeight,
      onWidthChange: this.config.onWidthChange,
      onUpdateHandles: this.config.onUpdateHandles,
    });
    this.state.eventHandlers.attach();
  }

  /**
   * Detach event listeners from container
   */
  detach(): void {
    if (!this.state.container) return;

    this.state.eventHandlers?.detach();
    this.state.eventHandlers = null;
    this.state.container = null;
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    // End any active resize operation
    if (this.config.stateManager.isActive()) {
      this.config.stateManager.endResize();
      this.state.previewRenderer?.hide();
    }

    this.detach();
    this.state.handleRenderer?.destroy();
    this.state.previewRenderer?.destroy();
    this.config.autoFitCalculator?.destroy();
  }

  /**
   * Get current state
   */
  getState(): Readonly<LifecycleState> {
    return this.state;
  }
}
