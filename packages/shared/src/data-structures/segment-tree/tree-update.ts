import type { AggregateFunction } from './segment-tree.interface';
import { SegmentTreeUtils } from './segment-tree.interface';

export function updateTree<T>(
  tree: T[],
  lazy: T[],
  aggregate: AggregateFunction<T>,
  useLazy: boolean,
  pushDownFn: (node: number, start: number, end: number) => void,
  node: number,
  start: number,
  end: number,
  index: number,
  value: T
): void {
  if (useLazy) {
    pushDownFn(node, start, end);
  }

  if (start === end) {
    tree[node] = value;
    return;
  }

  const mid = SegmentTreeUtils.mid(start, end);
  const leftChild = SegmentTreeUtils.leftChild(node);
  const rightChild = SegmentTreeUtils.rightChild(node);

  if (index <= mid) {
    updateTree(tree, lazy, aggregate, useLazy, pushDownFn, leftChild, start, mid, index, value);
  } else {
    updateTree(tree, lazy, aggregate, useLazy, pushDownFn, rightChild, mid + 1, end, index, value);
  }

  tree[node] = aggregate(tree[leftChild], tree[rightChild]);
}

export function rangeUpdateLazy<T>(
  tree: T[],
  lazy: T[],
  aggregate: AggregateFunction<T>,
  pushDownFn: (node: number, start: number, end: number) => void,
  node: number,
  start: number,
  end: number,
  left: number,
  right: number,
  value: T
): void {
  pushDownFn(node, start, end);

  if (start > right || end < left) {
    return;
  }

  if (start >= left && end <= right) {
    lazy[node] = aggregate(lazy[node], value);
    pushDownFn(node, start, end);
    return;
  }

  const mid = SegmentTreeUtils.mid(start, end);
  const leftChild = SegmentTreeUtils.leftChild(node);
  const rightChild = SegmentTreeUtils.rightChild(node);

  rangeUpdateLazy(tree, lazy, aggregate, pushDownFn, leftChild, start, mid, left, right, value);
  rangeUpdateLazy(tree, lazy, aggregate, pushDownFn, rightChild, mid + 1, end, left, right, value);

  pushDownFn(leftChild, start, mid);
  pushDownFn(rightChild, mid + 1, end);
  tree[node] = aggregate(tree[leftChild], tree[rightChild]);
}
