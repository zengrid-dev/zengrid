import type { ISegmentTree, SegmentTreeOptions, AggregateFunction } from './segment-tree.interface';
import { SegmentTreeUtils, AggregationType } from './segment-tree.interface';
import { getAggregationConfig } from './aggregation-config';
import { buildTree } from './tree-builder';
import { pushDown } from './lazy-propagation';
import { queryTree } from './tree-query';
import { updateTree, rangeUpdateLazy } from './tree-update';
import { findIndexAtSumRecursive } from './tree-search';
import { validateNode } from './tree-validation';

export class SegmentTree<T> implements ISegmentTree<T> {
  private tree: T[];
  private lazy: T[];
  private arr: T[];
  private n: number;
  private aggregate: AggregateFunction<T>;
  private identityValue: T;
  private useLazy: boolean;
  private _type: AggregationType;

  constructor(options: SegmentTreeOptions<T>) {
    this.arr = options.values ? [...options.values] : [];
    this.n = this.arr.length;
    this._type = options.type ?? AggregationType.CUSTOM;
    this.useLazy = options.lazy ?? true;

    if (this._type === AggregationType.CUSTOM) {
      if (!options.customAggregate || options.identity === undefined) {
        throw new Error(
          'CUSTOM aggregation type requires customAggregate function and identity value'
        );
      }
      this.aggregate = options.customAggregate;
      this.identityValue = options.identity;
    } else {
      const aggConfig = getAggregationConfig(this._type);
      this.aggregate = aggConfig.fn as unknown as AggregateFunction<T>;
      this.identityValue = aggConfig.identity as unknown as T;
    }

    const treeSize = SegmentTreeUtils.getTreeSize(this.n);
    this.tree = new Array(treeSize).fill(this.identityValue);
    this.lazy = new Array(treeSize).fill(this.identityValue);

    if (this.n > 0) {
      buildTree(this.tree, this.arr, this.aggregate, 0, 0, this.n - 1);
    }
  }

  private pushDown(node: number, start: number, end: number): void {
    if (!this.useLazy) return;
    pushDown(
      this.tree,
      this.lazy,
      this.aggregate,
      this.identityValue,
      this._type,
      node,
      start,
      end
    );
  }

  query(left: number, right: number): T {
    if (!SegmentTreeUtils.isValidRange(left, right, this.n)) {
      throw new RangeError(`Invalid range [${left}, ${right}] for array of size ${this.n}`);
    }

    if (this.n === 0) {
      return this.identityValue;
    }

    return queryTree(
      this.tree,
      this.lazy,
      this.aggregate,
      this.identityValue,
      this.useLazy,
      this.pushDown.bind(this),
      0,
      0,
      this.n - 1,
      left,
      right
    );
  }

  update(index: number, value: T): void {
    if (!SegmentTreeUtils.isValidIndex(index, this.n)) {
      throw new RangeError(`Index ${index} out of bounds [0, ${this.n - 1}]`);
    }

    this.arr[index] = value;
    updateTree(
      this.tree,
      this.lazy,
      this.aggregate,
      this.useLazy,
      this.pushDown.bind(this),
      0,
      0,
      this.n - 1,
      index,
      value
    );
  }

  rangeUpdate(left: number, right: number, value: T): void {
    if (!SegmentTreeUtils.isValidRange(left, right, this.n)) {
      throw new RangeError(`Invalid range [${left}, ${right}] for array of size ${this.n}`);
    }

    if (this.useLazy) {
      rangeUpdateLazy(
        this.tree,
        this.lazy,
        this.aggregate,
        this.pushDown.bind(this),
        0,
        0,
        this.n - 1,
        left,
        right,
        value
      );
    } else {
      for (let i = left; i <= right; i++) {
        this.arr[i] = this.aggregate(this.arr[i], value);
        this.update(i, this.arr[i]);
      }
    }
  }

  get(index: number): T {
    if (!SegmentTreeUtils.isValidIndex(index, this.n)) {
      throw new RangeError(`Index ${index} out of bounds [0, ${this.n - 1}]`);
    }

    return this.query(index, index);
  }

  build(arr: T[]): void {
    this.arr = [...arr];
    this.n = this.arr.length;

    const treeSize = SegmentTreeUtils.getTreeSize(this.n);
    this.tree = new Array(treeSize).fill(this.identityValue);
    this.lazy = new Array(treeSize).fill(this.identityValue);

    if (this.n > 0) {
      buildTree(this.tree, this.arr, this.aggregate, 0, 0, this.n - 1);
    }
  }

  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.n; i++) {
      result.push(this.get(i));
    }
    return result;
  }

  findFirst(left: number, predicate: (value: T) => boolean): number {
    for (let i = left; i < this.n; i++) {
      const value = this.query(left, i);
      if (predicate(value)) {
        return i;
      }
    }
    return -1;
  }

  get size(): number {
    return this.n;
  }

  get total(): T {
    if (this.n === 0) {
      return this.identityValue;
    }
    return this.query(0, this.n - 1);
  }

  get aggregationType(): AggregationType {
    return this._type;
  }

  static from<T>(values: T[], type: AggregationType = AggregationType.SUM): SegmentTree<T> {
    return new SegmentTree<T>({ values, type });
  }

  static custom<T>(values: T[], aggregate: AggregateFunction<T>, identity: T): SegmentTree<T> {
    return new SegmentTree<T>({
      values,
      type: AggregationType.CUSTOM,
      customAggregate: aggregate,
      identity,
    });
  }

  findIndexAtSum(target: number): number {
    if (this._type !== AggregationType.SUM) {
      throw new Error('findIndexAtSum only works with SUM aggregation type');
    }

    if (this.n === 0 || target <= 0) {
      return 0;
    }

    const totalSum = this.total as unknown as number;
    if (target >= totalSum) {
      return this.n - 1;
    }

    return findIndexAtSumRecursive(
      this.tree,
      this.lazy,
      this.useLazy,
      this.pushDown.bind(this),
      0,
      0,
      this.n - 1,
      target
    );
  }

  toString(): string {
    return `SegmentTree(size: ${this.size}, type: ${this.aggregationType}, total: ${this.total})`;
  }

  validate(): boolean {
    return validateNode(this.tree, this.arr, this.aggregate, this.n, 0, 0, this.n - 1);
  }
}
