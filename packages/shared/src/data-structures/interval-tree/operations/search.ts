/**
 * Search Operations
 * Handles various search queries on the interval tree
 */

import type { Interval, IntervalData } from '../interval-tree.interface';
import { IntervalUtils } from '../interval-tree.interface';
import { IntervalNode } from '../node';

/**
 * Find all intervals that overlap with the given interval
 *
 * @param node - Root of the subtree
 * @param interval - Query interval
 * @param result - Array to collect results
 */
export function searchOverlap<T>(
  node: IntervalNode<T> | null,
  interval: Interval,
  result: IntervalData<T>[]
): void {
  if (node === null) {
    return;
  }

  // If left subtree exists and its max >= interval.start, search left
  if (node.left && node.left.max >= interval.start) {
    searchOverlap(node.left, interval, result);
  }

  // Check current node
  if (IntervalUtils.overlaps(node.interval, interval)) {
    result.push(node.interval);
  }

  // If current node's start <= interval.end, search right
  if (node.interval.start <= interval.end) {
    searchOverlap(node.right, interval, result);
  }
}

/**
 * Check if any interval overlaps with the given interval
 *
 * @param node - Root of the subtree
 * @param interval - Query interval
 * @returns true if any overlap exists
 */
export function hasOverlap<T>(
  node: IntervalNode<T> | null,
  interval: Interval
): boolean {
  if (node === null) return false;

  // Check left subtree
  if (node.left && node.left.max >= interval.start) {
    if (hasOverlap(node.left, interval)) {
      return true;
    }
  }

  // Check current node
  if (IntervalUtils.overlaps(node.interval, interval)) {
    return true;
  }

  // Check right subtree
  if (node.interval.start <= interval.end) {
    return hasOverlap(node.right, interval);
  }

  return false;
}

/**
 * Find all intervals completely contained within the given interval
 *
 * @param node - Root of the subtree
 * @param interval - Containing interval
 * @param result - Array to collect results
 */
export function searchContained<T>(
  node: IntervalNode<T> | null,
  interval: Interval,
  result: IntervalData<T>[]
): void {
  if (node === null) return;

  // Search left
  if (node.left) {
    searchContained(node.left, interval, result);
  }

  // Check current node
  if (IntervalUtils.containsInterval(interval, node.interval)) {
    result.push(node.interval);
  }

  // Search right
  if (node.right) {
    searchContained(node.right, interval, result);
  }
}

/**
 * Find all intervals that completely contain the given interval
 *
 * @param node - Root of the subtree
 * @param interval - Interval to be contained
 * @param result - Array to collect results
 */
export function searchContaining<T>(
  node: IntervalNode<T> | null,
  interval: Interval,
  result: IntervalData<T>[]
): void {
  if (node === null) return;

  // Search left
  if (node.left) {
    searchContaining(node.left, interval, result);
  }

  // Check current node
  if (IntervalUtils.containsInterval(node.interval, interval)) {
    result.push(node.interval);
  }

  // Search right
  if (node.right) {
    searchContaining(node.right, interval, result);
  }
}

/**
 * Find the interval with the maximum endpoint
 *
 * @param node - Root of the subtree
 * @returns Interval with the maximum endpoint
 */
export function findMaxEndpoint<T>(node: IntervalNode<T>): IntervalData<T> {
  // Find the interval with the maximum endpoint
  let maxInterval = node.interval;

  if (node.left) {
    const leftMax = findMaxEndpoint(node.left);
    if (leftMax.end > maxInterval.end) {
      maxInterval = leftMax;
    }
  }

  if (node.right) {
    const rightMax = findMaxEndpoint(node.right);
    if (rightMax.end > maxInterval.end) {
      maxInterval = rightMax;
    }
  }

  return maxInterval;
}
