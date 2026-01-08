/**
 * ZenGrid Shared Package
 * Reusable algorithms and data structures
 *
 * @packageDocumentation
 */

// Data Structures
export { RingBuffer } from './data-structures/ring-buffer';

export { SparseMatrix } from './data-structures/sparse-matrix';
export type {
  ReadonlySparseMatrix,
  ISparseMatrix,
  SparseMatrixOptions,
} from './data-structures/sparse-matrix';

export { PrefixSumArray } from './data-structures/prefix-sum-array';
export type {
  IPrefixSumArray,
  PrefixSumArrayOptions,
} from './data-structures/prefix-sum-array';

export { ColumnStore } from './data-structures/column-store';
export type {
  IColumnStore,
  ColumnStoreOptions,
  ColumnDefinition,
  ColumnType,
  AggregateOperation,
  AggregationResult,
} from './data-structures/column-store';

export { LRUCache } from './data-structures/lru-cache';
export type {
  ILRUCache,
  LRUCacheOptions,
  CacheEntry,
  CacheStats,
} from './data-structures/lru-cache';

export { CommandStack } from './data-structures/command-stack';
export type {
  ICommandStack,
  ICommand,
  ICommandStackOptions,
} from './data-structures/command-stack';

export { SegmentTree, AggregationType } from './data-structures/segment-tree';
export type {
  ISegmentTree,
  SegmentTreeOptions,
  AggregateFunction,
} from './data-structures/segment-tree';
export { Aggregations, SegmentTreeUtils } from './data-structures/segment-tree';

export { SkipList } from './data-structures/skip-list';
export type {
  ISkipList,
  SkipListNode,
  SkipListOptions,
  RangeResult as SkipListRangeResult,
  SkipListStats,
} from './data-structures/skip-list';
export { defaultComparator as skipListDefaultComparator, SkipListUtils } from './data-structures/skip-list';

export { DisjointSet } from './data-structures/disjoint-set';
export type {
  IDisjointSet,
  DisjointSetOptions,
  DisjointSetStats,
} from './data-structures/disjoint-set';
export { DisjointSetUtils } from './data-structures/disjoint-set';

export { IndexMap } from './data-structures/index-map';
export type {
  IIndexMap,
  IndexMapEntry,
  IndexMapOptions,
} from './data-structures/index-map';

export { IntervalTree } from './data-structures/interval-tree';
export type {
  IIntervalTree,
  Interval,
  IntervalData,
  IntervalTreeOptions,
} from './data-structures/interval-tree';
export { IntervalUtils } from './data-structures/interval-tree';

export { RTree } from './data-structures/rtree';
export type {
  IRTree,
  RTreeData,
  RTreeOptions,
  RTreeSearchResult,
  RTreeStats,
  Rectangle as RTreeRectangle,
} from './data-structures/rtree';

export { Trie } from './data-structures/trie';
export type {
  ITrie,
  ITrieNode,
  TrieOptions,
  TrieSearchResult,
} from './data-structures/trie';

export { DependencyGraph } from './data-structures/dependency-graph';
export type {
  IDependencyGraph,
  NodeId,
  Dependency,
  DependencyGraphOptions,
  TopologicalSortResult,
  GraphStats,
} from './data-structures/dependency-graph';

export { SuffixArray } from './data-structures/suffix-array';
export type {
  ISuffixArray,
  SuffixArrayOptions,
  SuffixSearchResult,
  SuffixArrayStats,
} from './data-structures/suffix-array';

// Algorithms
export {
  binarySearch,
  binarySearchLeft,
  binarySearchRight,
} from './algorithms/search';
export type {
  BinarySearchOptions,
  BinarySearchResult,
} from './algorithms/search';

export {
  detectSequence,
  generateSequence,
  autofill,
} from './algorithms/pattern';
export type {
  SequenceType,
  SequencePattern,
} from './algorithms/pattern';

export { BloomFilter } from './algorithms/filter';

export {
  timsort,
  timsortIndices,
  numericComparator,
  stringComparator,
} from './algorithms/sorting';

// Types
export type {
  Comparator,
  Predicate,
  EqualityFn,
  HashFn,
  Range,
  Rectangle,
  Point,
  BoundingBox,
} from './types';

// Utilities
export {
  debounce,
  throttle,
  createRAFBatchScheduler,
  delay,
  timeout,
} from './utils/timing';
export type {
  DebounceOptions,
  DebouncedFunction,
  ThrottleOptions,
  ThrottledFunction,
  RAFBatchScheduler,
} from './utils/timing.interface';

// Patterns
export {
  EventEmitter,
  Subject,
  StateMachine,
  BaseCoordinator,
  Factory,
  SingletonFactory,
  Mediator,
  MediatedComponent,
  EventMediator,
  ObjectPool,
  KeyedObjectPool,
  resolveOperationMode,
  OperationModeManager,
} from './patterns';

export type {
  IEventEmitter,
  IObserver,
  ISubject,
  IStateMachine,
  StateMachineOptions,
  TransitionHandler,
  ICoordinator,
  IFactory,
  IMediator,
  IObjectPool,
  ObjectPoolOptions,
  ObjectPoolStats,
  OperationMode,
  ResolvedOperationMode,
  OperationModeConfig,
} from './patterns';

// Reactive Patterns (for scalable performance with 1000s of elements)
export {
  ReactiveState,
  EventDelegator,
  ObjectPool as ReactiveObjectPool,
  BatchProcessor,
} from './reactive';

export type {
  StateSubscriber,
  ElementEventHandlers,
  EventDelegatorOptions,
  ObjectPoolOptions as ReactiveObjectPoolOptions,
  ObjectPoolStats as ReactiveObjectPoolStats,
  BatchProcessorOptions,
} from './reactive';

// Version
export const VERSION = '0.1.0';
