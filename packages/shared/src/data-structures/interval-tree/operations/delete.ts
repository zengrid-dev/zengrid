/**
 * Delete Operations
 * Handles deletion of intervals from the tree
 */

import type { Interval, IntervalData } from '../interval-tree.interface';
import { IntervalNode, findMinNode, updateMax, updateHeight } from '../node';
import { balance } from './balance';

/**
 * Delete an interval from the tree
 *
 * @param node - Root of the subtree
 * @param interval - Interval to delete
 * @param comparator - Comparator function for intervals
 * @param balanced - Whether to balance the tree
 * @param onDelete - Callback when a node is deleted
 * @returns New root of the subtree (null if deleted)
 */
export function deleteNode<T>(
  node: IntervalNode<T> | null,
  interval: IntervalData<T>,
  comparator: (a: Interval, b: Interval) => number,
  balanced: boolean,
  onDelete?: () => void
): IntervalNode<T> | null {
  if (node === null) {
    return null;
  }

  // Check if this is the node to delete
  if (node.interval.id === interval.id) {
    onDelete?.();

    // Case 1: Leaf node
    if (node.left === null && node.right === null) {
      return null;
    }

    // Case 2: One child
    if (node.left === null) {
      return node.right;
    }
    if (node.right === null) {
      return node.left;
    }

    // Case 3: Two children
    // Find inorder successor (min in right subtree)
    const successor = findMinNode(node.right);
    if (successor) {
      node.interval = successor.interval;
      node.right = deleteNode(node.right, successor.interval, comparator, balanced, onDelete);
    }
  } else {
    const cmp = comparator(interval, node.interval);

    if (cmp < 0) {
      node.left = deleteNode(node.left, interval, comparator, balanced, onDelete);
    } else {
      node.right = deleteNode(node.right, interval, comparator, balanced, onDelete);
    }
  }

  // Update max
  updateMax(node);

  if (balanced) {
    // Update height
    updateHeight(node);

    // Balance the tree
    return balance(node);
  }

  return node;
}

/**
 * Find an interval by ID in the tree
 *
 * @param node - Root of the subtree
 * @param id - ID to search for
 * @returns The interval data if found, null otherwise
 */
export function findById<T>(
  node: IntervalNode<T> | null,
  id: string | number
): IntervalData<T> | null {
  if (node === null) return null;
  if (node.interval.id === id) return node.interval;

  const left = findById(node.left, id);
  if (left) return left;

  return findById(node.right, id);
}
