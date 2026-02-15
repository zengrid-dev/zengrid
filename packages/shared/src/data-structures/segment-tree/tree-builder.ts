import type { AggregateFunction } from './segment-tree.interface';
import { SegmentTreeUtils } from './segment-tree.interface';

export function buildTree<T>(
  tree: T[],
  arr: T[],
  aggregate: AggregateFunction<T>,
  node: number,
  start: number,
  end: number
): void {
  if (start === end) {
    tree[node] = arr[start];
    return;
  }

  const mid = SegmentTreeUtils.mid(start, end);
  const leftChild = SegmentTreeUtils.leftChild(node);
  const rightChild = SegmentTreeUtils.rightChild(node);

  buildTree(tree, arr, aggregate, leftChild, start, mid);
  buildTree(tree, arr, aggregate, rightChild, mid + 1, end);

  tree[node] = aggregate(tree[leftChild], tree[rightChild]);
}
