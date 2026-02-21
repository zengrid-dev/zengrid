import { SegmentTreeUtils } from './segment-tree.interface';

export function findIndexAtSumRecursive<T>(
  tree: T[],
  lazy: T[],
  useLazy: boolean,
  pushDownFn: (node: number, start: number, end: number) => void,
  node: number,
  start: number,
  end: number,
  targetSum: number
): number {
  if (useLazy) {
    pushDownFn(node, start, end);
  }

  if (start === end) {
    return start;
  }

  const mid = SegmentTreeUtils.mid(start, end);
  const leftChild = SegmentTreeUtils.leftChild(node);
  const rightChild = SegmentTreeUtils.rightChild(node);

  if (useLazy) {
    pushDownFn(leftChild, start, mid);
    pushDownFn(rightChild, mid + 1, end);
  }

  const leftSum = tree[leftChild] as unknown as number;

  if (targetSum < leftSum) {
    return findIndexAtSumRecursive(
      tree,
      lazy,
      useLazy,
      pushDownFn,
      leftChild,
      start,
      mid,
      targetSum
    );
  } else {
    return findIndexAtSumRecursive(
      tree,
      lazy,
      useLazy,
      pushDownFn,
      rightChild,
      mid + 1,
      end,
      targetSum - leftSum
    );
  }
}
