/**
 * Insert Operations
 * Handles insertion of intervals into the tree
 */

import type { Interval, IntervalData } from '../interval-tree.interface';
import { IntervalNode, updateMax, updateHeight } from '../node';
import { balance } from './balance';

/**
 * Insert an interval into the tree
 *
 * @param node - Root of the subtree
 * @param interval - Interval to insert
 * @param comparator - Comparator function for intervals
 * @param allowDuplicates - Whether to allow duplicate intervals
 * @param balanced - Whether to balance the tree
 * @param onInsert - Callback called when a new node is inserted
 * @returns New root of the subtree
 */
export function insertNode<T>(
  node: IntervalNode<T> | null,
  interval: IntervalData<T>,
  comparator: (a: Interval, b: Interval) => number,
  allowDuplicates: boolean,
  balanced: boolean,
  onInsert?: () => void
): IntervalNode<T> {
  // Standard BST insert
  if (node === null) {
    onInsert?.();
    return new IntervalNode(interval);
  }

  const cmp = comparator(interval, node.interval);

  if (cmp < 0) {
    node.left = insertNode(
      node.left,
      interval,
      comparator,
      allowDuplicates,
      balanced,
      onInsert
    );
  } else if (cmp > 0) {
    node.right = insertNode(
      node.right,
      interval,
      comparator,
      allowDuplicates,
      balanced,
      onInsert
    );
  } else {
    // cmp === 0: equal intervals
    if (allowDuplicates) {
      // Insert duplicates to the right
      node.right = insertNode(
        node.right,
        interval,
        comparator,
        allowDuplicates,
        balanced,
        onInsert
      );
    } else {
      // Duplicate not allowed
      return node;
    }
  }

  // Update max for this node
  updateMax(node);

  if (balanced) {
    // Update height
    updateHeight(node);

    // Balance the tree
    return balance(node);
  }

  return node;
}
