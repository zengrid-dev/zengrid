/**
 * AVL Tree Balancing Operations
 * Handles tree balancing through rotations
 */

import { IntervalNode, getHeight, updateHeight, updateMax } from '../node';

/**
 * Get balance factor of a node (left height - right height)
 */
export function getBalanceFactor<T>(node: IntervalNode<T>): number {
  return getHeight(node.left) - getHeight(node.right);
}

/**
 * Left rotation
 * Rotates the node to the left, making its right child the new root
 *
 * @param node - Node to rotate
 * @returns New root after rotation
 */
export function rotateLeft<T>(node: IntervalNode<T>): IntervalNode<T> {
  const newRoot = node.right!;
  node.right = newRoot.left;
  newRoot.left = node;

  // Update heights
  updateHeight(node);
  updateHeight(newRoot);

  // Update max values
  updateMax(node);
  updateMax(newRoot);

  return newRoot;
}

/**
 * Right rotation
 * Rotates the node to the right, making its left child the new root
 *
 * @param node - Node to rotate
 * @returns New root after rotation
 */
export function rotateRight<T>(node: IntervalNode<T>): IntervalNode<T> {
  const newRoot = node.left!;
  node.left = newRoot.right;
  newRoot.right = node;

  // Update heights
  updateHeight(node);
  updateHeight(newRoot);

  // Update max values
  updateMax(node);
  updateMax(newRoot);

  return newRoot;
}

/**
 * Balance a node using AVL rotations
 * Performs rotations based on balance factor to maintain AVL property
 *
 * @param node - Node to balance
 * @returns Balanced node (may be a different node after rotation)
 */
export function balance<T>(node: IntervalNode<T>): IntervalNode<T> {
  const balanceFactor = getBalanceFactor(node);

  // Left heavy
  if (balanceFactor > 1) {
    if (node.left && getBalanceFactor(node.left) < 0) {
      // Left-Right case: rotate left child left first
      node.left = rotateLeft(node.left);
    }
    // Left-Left case: rotate node right
    return rotateRight(node);
  }

  // Right heavy
  if (balanceFactor < -1) {
    if (node.right && getBalanceFactor(node.right) > 0) {
      // Right-Left case: rotate right child right first
      node.right = rotateRight(node.right);
    }
    // Right-Right case: rotate node left
    return rotateLeft(node);
  }

  return node;
}
