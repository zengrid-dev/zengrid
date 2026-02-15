import { Aggregations, AggregationType } from './segment-tree.interface';

export function getAggregationConfig(type: AggregationType): {
  fn: (a: number, b: number) => number;
  identity: number;
} {
  switch (type) {
    case AggregationType.SUM:
      return Aggregations.sum;
    case AggregationType.MIN:
      return Aggregations.min;
    case AggregationType.MAX:
      return Aggregations.max;
    case AggregationType.GCD:
      return Aggregations.gcd;
    case AggregationType.LCM:
      return Aggregations.lcm;
    case AggregationType.PRODUCT:
      return Aggregations.product;
    default:
      throw new Error(`Unknown aggregation type: ${type}`);
  }
}
