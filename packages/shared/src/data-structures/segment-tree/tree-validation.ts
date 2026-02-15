import type { AggregateFunction } from './segment-tree.interface';
import { SegmentTreeUtils } from './segment-tree.interface';

export function validateNode<T>(
  tree: T[],
  arr: T[],
  aggregate: AggregateFunction<T>,
  n: number,
  node: number,
  start: number,
  end: number
): boolean {
  if (n === 0) return true;

  if (start === end) {
    return tree[node] === arr[start];
  }

  const mid = SegmentTreeUtils.mid(start, end);
  const leftChild = SegmentTreeUtils.leftChild(node);
  const rightChild = SegmentTreeUtils.rightChild(node);

  const expectedValue = aggregate(tree[leftChild], tree[rightChild]);

  if (tree[node] !== expectedValue) {
    return false;
  }

  return (
    validateNode(tree, arr, aggregate, n, leftChild, start, mid) &&
    validateNode(tree, arr, aggregate, n, rightChild, mid + 1, end)
  );
}
