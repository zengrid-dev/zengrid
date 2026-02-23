/**
 * Interval Tree implementation
 * Augmented BST for efficient interval queries
 */

import type {
  IIntervalTree,
  Interval,
  IntervalData,
  IntervalTreeOptions,
} from './interval-tree.interface';
import { IntervalUtils } from './interval-tree.interface';
import { IntervalNode, findMinNode, getHeight } from './node';
import { insertNode } from './operations/insert';
import { deleteNode, findById } from './operations/delete';
import {
  searchOverlap,
  searchContained,
  searchContaining,
  hasOverlap as hasOverlapHelper,
  findMaxEndpoint,
} from './operations/search';
import { inorder, forEach as forEachHelper } from './operations/traversal';
import {
  filter as filterHelper,
  map as mapHelper,
  treeToString,
  validate as validateHelper,
  fromArray,
} from './operations/utilities';

/**
 * Interval Tree - Augmented BST for interval queries
 *
 * Implementation:
 * - Each node stores an interval and the max endpoint in its subtree
 * - Balanced using AVL tree rotations for guaranteed O(log n) operations
 * - Intervals are ordered by start time
 *
 * @example
 * ```typescript
 * const tree = new IntervalTree<string>();
 * tree.insert({ start: 10, end: 20 }, 'A');
 * tree.insert({ start: 15, end: 25 }, 'B');
 * tree.insert({ start: 30, end: 40 }, 'C');
 *
 * tree.search({ start: 18, end: 22 }); // Returns A and B
 * tree.searchPoint(35); // Returns C
 * ```
 */
export class IntervalTree<T> implements IIntervalTree<T> {
  private root: IntervalNode<T> | null = null;
  private count: number = 0;
  private nextId: number = 0;
  private readonly balanced: boolean;
  private readonly allowDuplicates: boolean;
  private readonly comparator: (a: Interval, b: Interval) => number;

  constructor(options: IntervalTreeOptions = {}) {
    this.balanced = options.balanced ?? false;
    this.allowDuplicates = options.allowDuplicates ?? true;
    this.comparator = options.comparator ?? IntervalUtils.defaultComparator;
  }

  insert(interval: Interval, data: T): IntervalData<T> {
    const intervalData: IntervalData<T> = {
      ...interval,
      data,
      id: this.nextId++,
    };

    let inserted = false;

    this.root = insertNode(
      this.root,
      intervalData,
      this.comparator,
      this.allowDuplicates,
      this.balanced,
      () => {
        inserted = true;
      }
    );

    if (inserted) {
      this.count++;
    }

    return intervalData;
  }

  delete(intervalData: IntervalData<T>): boolean {
    const sizeBefore = this.count;
    this.root = deleteNode(
      this.root,
      intervalData,
      this.comparator,
      this.balanced,
      () => this.count--
    );
    return this.count < sizeBefore;
  }

  deleteById(id: string | number): boolean {
    const interval = findById(this.root, id);
    if (interval) {
      return this.delete(interval);
    }
    return false;
  }

  search(interval: Interval): IntervalData<T>[] {
    const result: IntervalData<T>[] = [];
    searchOverlap(this.root, interval, result);
    return result;
  }

  searchPoint(point: number): IntervalData<T>[] {
    return this.search({ start: point, end: point });
  }

  searchContained(interval: Interval): IntervalData<T>[] {
    const result: IntervalData<T>[] = [];
    searchContained(this.root, interval, result);
    return result;
  }

  searchContaining(interval: Interval): IntervalData<T>[] {
    const result: IntervalData<T>[] = [];
    searchContaining(this.root, interval, result);
    return result;
  }

  findMin(): IntervalData<T> | undefined {
    const node = findMinNode(this.root);
    return node?.interval;
  }

  findMax(): IntervalData<T> | undefined {
    if (this.root === null) return undefined;
    return findMaxEndpoint(this.root);
  }

  hasOverlap(interval: Interval): boolean {
    return hasOverlapHelper(this.root, interval);
  }

  inorder(): IntervalData<T>[] {
    const result: IntervalData<T>[] = [];
    inorder(this.root, result);
    return result;
  }

  forEach(callback: (interval: IntervalData<T>) => void): void {
    forEachHelper(this.root, callback);
  }

  filter(predicate: (interval: IntervalData<T>) => boolean): IIntervalTree<T> {
    return filterHelper(this, this.root, predicate, {
      balanced: this.balanced,
      allowDuplicates: this.allowDuplicates,
      comparator: this.comparator,
    });
  }

  map<U>(mapper: (data: T, interval: Interval) => U): IIntervalTree<U> {
    return mapHelper(this, this.root, mapper, {
      balanced: this.balanced,
      allowDuplicates: this.allowDuplicates,
      comparator: this.comparator,
    });
  }

  clear(): void {
    this.root = null;
    this.count = 0;
    this.nextId = 0;
  }

  get size(): number {
    return this.count;
  }

  get isEmpty(): boolean {
    return this.count === 0;
  }

  get height(): number {
    return getHeight(this.root);
  }

  static from<T>(
    intervals: Array<{ interval: Interval; data: T }>,
    options?: IntervalTreeOptions
  ): IntervalTree<T> {
    return fromArray(IntervalTree, intervals, options) as IntervalTree<T>;
  }

  toString(): string {
    return treeToString(this.root, this.balanced);
  }

  validate(): boolean {
    return validateHelper(this.root, this.comparator);
  }
}
