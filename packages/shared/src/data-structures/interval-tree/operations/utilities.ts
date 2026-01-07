/**
 * Utility Operations
 * Static and helper methods for IntervalTree
 */

import type {
  IIntervalTree,
  Interval,
  IntervalData,
  IntervalTreeOptions,
} from '../interval-tree.interface';
import type { IntervalNode } from '../node';
import { getHeight } from '../node';
import { forEach as forEachHelper, validateNode } from './traversal';

/**
 * Filter intervals by a predicate
 */
export function filter<T>(
  tree: IIntervalTree<T>,
  root: IntervalNode<T> | null,
  predicate: (interval: IntervalData<T>) => boolean,
  options: IntervalTreeOptions
): IIntervalTree<T> {
  const IntervalTree = tree.constructor as new (
    opts?: IntervalTreeOptions
  ) => IIntervalTree<T>;
  const result = new IntervalTree(options);

  forEachHelper(root, (interval) => {
    if (predicate(interval)) {
      result.insert(interval, interval.data);
    }
  });

  return result;
}

/**
 * Map intervals to a new interval tree
 */
export function map<T, U>(
  tree: IIntervalTree<T>,
  root: IntervalNode<T> | null,
  mapper: (data: T, interval: Interval) => U,
  options: IntervalTreeOptions
): IIntervalTree<U> {
  const IntervalTree = tree.constructor as new (
    opts?: IntervalTreeOptions
  ) => IIntervalTree<U>;
  const result = new IntervalTree(options);

  forEachHelper(root, (interval) => {
    const newData = mapper(interval.data, interval);
    result.insert(interval, newData);
  });

  return result;
}

/**
 * Get tree structure as string
 */
export function treeToString<T>(
  root: IntervalNode<T> | null,
  balanced: boolean
): string {
  const size = countNodes(root);
  const height = getHeight(root);
  return `IntervalTree(${size} intervals, height: ${height}, balanced: ${balanced})`;
}

/**
 * Count nodes in the tree
 */
function countNodes<T>(node: IntervalNode<T> | null): number {
  if (node === null) return 0;
  return 1 + countNodes(node.left) + countNodes(node.right);
}

/**
 * Validate tree structure
 */
export function validate<T>(
  root: IntervalNode<T> | null,
  comparator: (a: Interval, b: Interval) => number
): boolean {
  return validateNode(root, comparator);
}

/**
 * Create IntervalTree from array of intervals
 */
export function fromArray<T>(
  IntervalTreeClass: new (opts?: IntervalTreeOptions) => IIntervalTree<T>,
  intervals: Array<{ interval: Interval; data: T }>,
  options?: IntervalTreeOptions
): IIntervalTree<T> {
  const tree = new IntervalTreeClass(options);
  for (const { interval, data } of intervals) {
    tree.insert(interval, data);
  }
  return tree;
}
