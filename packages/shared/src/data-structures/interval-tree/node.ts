/**
 * Interval Tree Node
 * Internal node structure for the interval tree
 */

import type { IntervalData } from './interval-tree.interface';

/**
 * Internal tree node
 * Each node stores an interval and the maximum endpoint in its subtree
 */
export class IntervalNode<T> {
  interval: IntervalData<T>;
  max: number; // Maximum endpoint in this subtree
  left: IntervalNode<T> | null = null;
  right: IntervalNode<T> | null = null;
  height: number = 1;

  constructor(interval: IntervalData<T>) {
    this.interval = interval;
    this.max = interval.end;
  }
}

/**
 * Get height of a node (0 for null nodes)
 */
export function getHeight<T>(node: IntervalNode<T> | null): number {
  return node?.height ?? 0;
}

/**
 * Update max value for a node based on its interval and children
 */
export function updateMax<T>(node: IntervalNode<T>): void {
  node.max = Math.max(
    node.interval.end,
    node.left?.max ?? -Infinity,
    node.right?.max ?? -Infinity
  );
}

/**
 * Update height for a node based on its children
 */
export function updateHeight<T>(node: IntervalNode<T>): void {
  node.height = 1 + Math.max(getHeight(node.left), getHeight(node.right));
}

/**
 * Find minimum node in a subtree (leftmost node)
 */
export function findMinNode<T>(
  node: IntervalNode<T> | null
): IntervalNode<T> | null {
  if (node === null) return null;
  while (node.left !== null) {
    node = node.left;
  }
  return node;
}
