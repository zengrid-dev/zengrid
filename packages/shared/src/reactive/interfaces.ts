/**
 * Reactive Primitives - Interface Abstractions
 *
 * @description
 * Interface-based abstractions for loose coupling and testability.
 * Enables dependency injection, mocking, and composition.
 *
 * @example
 * ```typescript
 * // Use interfaces for loose coupling
 * class ColumnModel {
 *   constructor(private state: IReactiveState<ColumnState, ColumnEvent>) {}
 * }
 *
 * // Can inject real or mock implementation
 * const model = new ColumnModel(new ReactiveState());
 * const testModel = new ColumnModel(new MockReactiveState());
 * ```
 */

// ========================================
// Core Subscriber Interface
// ========================================

/**
 * Subscriber for state changes
 */
export interface ISubscriber<E> {
  onChange(event: E): void;
  onBatchChange?(events: E[]): void;
}

// ========================================
// ReactiveState Interface
// ========================================

/**
 * Reactive state container with targeted subscriptions
 *
 * @template T - State value type (not exposed in interface, used internally)
 * @template E - Event type (used in subscriptions)
 */
export interface IReactiveState<T, E> {
  /**
   * Subscribe to specific key changes (targeted O(m))
   */
  subscribeToKey(key: string, subscriber: ISubscriber<E>): () => void;

  /**
   * Subscribe to all state changes (global observer)
   */
  subscribeGlobal(subscriber: ISubscriber<E>): () => void;

  /**
   * Get subscriber count for debugging
   */
  getSubscriberCount(key: string): number;

  /**
   * Get global subscriber count
   */
  getGlobalSubscriberCount(): number;

  /**
   * Get event history (if enabled)
   */
  getEventHistory(): E[];

  /**
   * Get last N events from history
   */
  getLastEvents(count: number): E[];

  /**
   * Clear event history
   */
  clearEventHistory(): void;

  /**
   * Cleanup
   */
  destroy(): void;

  // T is intentionally not used in interface - it's internal to implementation
  // The type parameter is kept for compatibility with ReactiveState implementation
  __state?: T; // Phantom type parameter marker
}

// ========================================
// SubscriptionManager Interface
// ========================================

/**
 * Manages subscriptions and notifications
 */
export interface ISubscriptionManager<E> {
  subscribeToKey(key: string, subscriber: ISubscriber<E>): () => void;
  subscribeGlobal(subscriber: ISubscriber<E>): () => void;
  notifyKey(key: string, event: E): void;
  notifyBatch(eventsByKey: Map<string, E[]>): void;
  getKeySubscriberCount(key: string): number;
  getGlobalSubscriberCount(): number;
  hasKeySubscribers(key: string): boolean;
  clear(): void;
}

// ========================================
// BatchManager Interface
// ========================================

/**
 * Manages batch mode and event queuing
 */
export interface IBatchManager<E> {
  isBatching(): boolean;
  enterBatch(): void;
  exitBatch(): void;
  addEvent(key: string, event: E): void;
  flushEvents(): Array<{ key: string; event: E }>;
  groupEventsByKey(events: Array<{ key: string; event: E }>): Map<string, E[]>;
  clear(): void;
}

// ========================================
// EventDelegator Interface
// ========================================

/**
 * Event handler types
 */
export interface IElementEventHandlers {
  onClick?: (event: MouseEvent) => void;
  onDblClick?: (event: MouseEvent) => void;
  onMouseDown?: (event: MouseEvent) => void;
  onMouseUp?: (event: MouseEvent) => void;
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
  onContextMenu?: (event: MouseEvent) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
}

/**
 * Event delegator options
 */
export interface IEventDelegatorOptions {
  idAttribute?: string;
  customEvents?: Record<string, { domEvent: string; useCapture: boolean }>;
}

/**
 * Event delegation for thousands of elements
 */
export interface IEventDelegator {
  registerElement(elementId: string, handlers: IElementEventHandlers): void;
  unregisterElement(elementId: string): void;
  updateElement(elementId: string, handlers: IElementEventHandlers, merge?: boolean): void;
  isRegistered(elementId: string): boolean;
  getAllRegisteredIds(): string[];
  getRegisteredCount(): number;
  destroy(): void;
}

// ========================================
// ObjectPool Interface
// ========================================

/**
 * Object pool options
 */
export interface IObjectPoolOptions<T> {
  factory: () => T;
  reset?: (obj: T) => void;
  validate?: (obj: T) => boolean;
  initialSize?: number;
  maxSize?: number;
  // Lifecycle hooks
  onAcquire?: (obj: T) => void;
  onRelease?: (obj: T) => void;
  onEvict?: (obj: T) => void;
}

/**
 * Object pool statistics
 */
export interface IObjectPoolStats {
  available: number;
  created: number;
  acquired: number;
  released: number;
  hitRate: number;
  maxSize: number;
}

/**
 * Object pooling for virtual rendering
 */
export interface IObjectPool<T> {
  acquire(): T;
  release(obj: T): void;
  acquireMany(count: number): T[];
  releaseMany(objects: T[]): void;
  prewarm(count: number): void;
  size(): number;
  getStats(): IObjectPoolStats;
  shrink(targetSize: number): void;
  clear(): void;
  destroy(): void;
}

// ========================================
// BatchProcessor Interface
// ========================================

/**
 * Batch processor options
 */
export interface IBatchProcessorOptions<T> {
  process: (items: T[]) => void;
  delay?: number;
  maxBatchSize?: number;
  deduplicate?: (items: T[]) => T[];
}

/**
 * Batch processing for grouped operations
 */
export interface IBatchProcessor<T> {
  add(item: T): void;
  addMany(items: T[]): void;
  flush(): void;
  clear(): void;
  size(): number;
  isIdle(): boolean;
  destroy(): void;
}

// ========================================
// EventHandlerRegistry Interface
// ========================================

/**
 * Event handler storage and lookup
 */
export interface IEventHandlerRegistry {
  register(elementId: string, handlers: IElementEventHandlers): void;
  unregister(elementId: string): void;
  update(elementId: string, handlers: IElementEventHandlers, merge: boolean): void;
  get(elementId: string): IElementEventHandlers | undefined;
  getHandler(
    elementId: string,
    handlerName: keyof IElementEventHandlers
  ): ((event: any) => void) | undefined;
  size(): number;
  clear(): void;
}
