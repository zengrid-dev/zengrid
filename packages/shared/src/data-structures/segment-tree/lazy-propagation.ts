import type { AggregateFunction } from './segment-tree.interface';
import { SegmentTreeUtils, AggregationType } from './segment-tree.interface';

export function pushDown<T>(
  tree: T[],
  lazy: T[],
  aggregate: AggregateFunction<T>,
  identityValue: T,
  type: AggregationType,
  node: number,
  start: number,
  end: number
): void {
  if (lazy[node] === identityValue) {
    return;
  }

  tree[node] = applyUpdate(
    tree[node],
    lazy[node],
    end - start + 1,
    aggregate,
    type
  );

  if (start !== end) {
    const leftChild = SegmentTreeUtils.leftChild(node);
    const rightChild = SegmentTreeUtils.rightChild(node);

    lazy[leftChild] = aggregate(lazy[leftChild], lazy[node]);
    lazy[rightChild] = aggregate(lazy[rightChild], lazy[node]);
  }

  lazy[node] = identityValue;
}

export function applyUpdate<T>(
  nodeValue: T,
  updateValue: T,
  rangeSize: number,
  aggregate: AggregateFunction<T>,
  type: AggregationType
): T {
  if (type === AggregationType.SUM) {
    const update = (updateValue as unknown as number) * rangeSize;
    return aggregate(nodeValue, update as unknown as T);
  }
  return aggregate(nodeValue, updateValue);
}
