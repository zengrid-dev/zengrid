/**
 * @module reactive
 *
 * Reusable reactive primitives for high-performance grid features
 *
 * @description
 * This module provides scalable patterns for building features with
 * thousands of interactive elements (cells, rows, columns) without
 * performance degradation.
 *
 * Now with:
 * - Interface abstractions for loose coupling
 * - Dependency injection support
 * - Exposed helpers for composition
 * - Event history for debugging
 *
 * @performance
 * Designed for grids with 1000+ cells:
 * - Event listeners: O(1) not O(n)
 * - Notifications: Targeted, not broadcast
 * - Memory: Constant overhead, pooled resources
 * - GC pressure: Minimal (object reuse)
 *
 * @example
 * ```typescript
 * import {
 *   ReactiveState,
 *   EventDelegator,
 *   ObjectPool,
 *   BatchProcessor
 * } from '@zengrid/shared/reactive';
 *
 * // 1. Reactive state with event history (new!)
 * const state = new ReactiveState(undefined, undefined, 100);  // 100 event history
 *
 * // 2. Composition with interfaces (new!)
 * class ColumnModel {
 *   constructor(private state: IReactiveState<ColumnState, ColumnEvent>) {}
 * }
 *
 * // 3. Use exposed helpers directly (new!)
 * import { SubscriptionManager } from '@zengrid/shared/reactive';
 * const subs = new SubscriptionManager();
 * ```
 *
 * @packageDocumentation
 */

// ========================================
// Interfaces (for loose coupling)
// ========================================

export type {
  ISubscriber,
  IReactiveState,
  ISubscriptionManager,
  IBatchManager,
  IEventDelegator,
  IElementEventHandlers,
  IEventDelegatorOptions,
  IObjectPool,
  IObjectPoolOptions,
  IObjectPoolStats,
  IBatchProcessor,
  IBatchProcessorOptions,
  IEventHandlerRegistry,
} from './interfaces';

// ========================================
// Core Reactive Primitives
// ========================================

export {
  ReactiveState,
  type StateSubscriber,  // Backward compatible
} from './reactive-state';

export {
  EventDelegator,
  type ElementEventHandlers,  // Backward compatible
  type EventDelegatorOptions,  // Backward compatible
} from './event-delegator';

export {
  ObjectPool,
  type ObjectPoolOptions,  // Backward compatible
  type ObjectPoolStats,  // Backward compatible
} from './object-pool';

export {
  BatchProcessor,
  type BatchProcessorOptions,  // Backward compatible
} from './batch-processor';

// ========================================
// Helpers (for composition)
// ========================================

export { SubscriptionManager } from './core/subscription-manager';
export { BatchManager } from './core/batch-manager';
export { EventHandlerRegistry } from './core/event-handler-registry';
export { EventMapper } from './core/event-mapper';
export { PoolStatsTracker } from './core/pool-stats';
export { BatchQueue } from './core/batch-queue';
