import type { AggregateFunction } from './segment-tree.interface';
import { SegmentTreeUtils } from './segment-tree.interface';

export function queryTree<T>(
  tree: T[],
  lazy: T[],
  aggregate: AggregateFunction<T>,
  identityValue: T,
  useLazy: boolean,
  pushDownFn: (node: number, start: number, end: number) => void,
  node: number,
  start: number,
  end: number,
  left: number,
  right: number
): T {
  if (useLazy) {
    pushDownFn(node, start, end);
  }

  if (start > right || end < left) {
    return identityValue;
  }

  if (start >= left && end <= right) {
    return tree[node];
  }

  const mid = SegmentTreeUtils.mid(start, end);
  const leftChild = SegmentTreeUtils.leftChild(node);
  const rightChild = SegmentTreeUtils.rightChild(node);

  const leftResult = queryTree(
    tree,
    lazy,
    aggregate,
    identityValue,
    useLazy,
    pushDownFn,
    leftChild,
    start,
    mid,
    left,
    right
  );
  const rightResult = queryTree(
    tree,
    lazy,
    aggregate,
    identityValue,
    useLazy,
    pushDownFn,
    rightChild,
    mid + 1,
    end,
    left,
    right
  );

  return aggregate(leftResult, rightResult);
}
