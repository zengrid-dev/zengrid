/**
 * Traversal Operations
 * Handles traversal and iteration over the tree
 */

import type { IntervalData } from '../interval-tree.interface';
import { IntervalNode } from '../node';

/**
 * Inorder traversal of the tree
 *
 * @param node - Root of the subtree
 * @param result - Array to collect results
 */
export function inorder<T>(
  node: IntervalNode<T> | null,
  result: IntervalData<T>[]
): void {
  if (node === null) return;
  inorder(node.left, result);
  result.push(node.interval);
  inorder(node.right, result);
}

/**
 * Iterate over all intervals in the tree
 *
 * @param node - Root of the subtree
 * @param callback - Function to call for each interval
 */
export function forEach<T>(
  node: IntervalNode<T> | null,
  callback: (interval: IntervalData<T>) => void
): void {
  if (node === null) return;
  forEach(node.left, callback);
  callback(node.interval);
  forEach(node.right, callback);
}

/**
 * Validate tree structure
 *
 * @param node - Root of the subtree
 * @param comparator - Comparator function for intervals
 * @returns true if valid
 */
export function validateNode<T>(
  node: IntervalNode<T> | null,
  comparator: (a: IntervalData<T>, b: IntervalData<T>) => number
): boolean {
  if (node === null) return true;

  // Check max value
  const expectedMax = Math.max(
    node.interval.end,
    node.left?.max ?? -Infinity,
    node.right?.max ?? -Infinity
  );
  if (node.max !== expectedMax) {
    return false;
  }

  // Check BST property
  if (node.left && comparator(node.left.interval, node.interval) > 0) {
    return false;
  }
  if (node.right && comparator(node.right.interval, node.interval) < 0) {
    return false;
  }

  // Recursively validate children
  return validateNode(node.left, comparator) && validateNode(node.right, comparator);
}
