import { RingBuffer } from './ring-buffer';

describe('RingBuffer', () => {
  it('should create buffer with correct capacity', () => {
    const buffer = new RingBuffer<number>(5);
    expect(buffer.getCapacity()).toBe(5);
    expect(buffer.size()).toBe(0);
    expect(buffer.isEmpty()).toBe(true);
  });

  it('should throw error for invalid capacity', () => {
    expect(() => new RingBuffer<number>(0)).toThrow('RingBuffer capacity must be > 0');
    expect(() => new RingBuffer<number>(-1)).toThrow('RingBuffer capacity must be > 0');
  });

  it('should push items and maintain size', () => {
    const buffer = new RingBuffer<number>(3);

    buffer.push(1);
    expect(buffer.size()).toBe(1);
    expect(buffer.get(0)).toBe(1);

    buffer.push(2);
    expect(buffer.size()).toBe(2);
    expect(buffer.get(0)).toBe(1);
    expect(buffer.get(1)).toBe(2);

    buffer.push(3);
    expect(buffer.size()).toBe(3);
    expect(buffer.get(0)).toBe(1);
    expect(buffer.get(1)).toBe(2);
    expect(buffer.get(2)).toBe(3);
  });

  it('should evict oldest items when full', () => {
    const buffer = new RingBuffer<number>(3);

    buffer.push(1);
    buffer.push(2);
    buffer.push(3);
    buffer.push(4); // This should evict 1

    expect(buffer.size()).toBe(3);
    expect(buffer.get(0)).toBe(2); // 2 is now oldest
    expect(buffer.get(1)).toBe(3);
    expect(buffer.get(2)).toBe(4);
  });

  it('should handle newest/oldest getters', () => {
    const buffer = new RingBuffer<number>(3);

    buffer.push(1);
    buffer.push(2);
    buffer.push(3);

    expect(buffer.oldest()).toBe(1);
    expect(buffer.newest()).toBe(3);

    buffer.push(4);
    expect(buffer.oldest()).toBe(2); // 2 is now oldest
    expect(buffer.newest()).toBe(4);
  });

  it('should convert to array correctly', () => {
    const buffer = new RingBuffer<number>(4);

    buffer.push(1);
    buffer.push(2);
    buffer.push(3);

    expect(buffer.toArray()).toEqual([1, 2, 3]);

    buffer.push(4);
    expect(buffer.toArray()).toEqual([1, 2, 3, 4]);

    // Now push 5th item - should evict oldest (1)
    buffer.push(5);
    expect(buffer.toArray()).toEqual([2, 3, 4, 5]);
  });

  it('should handle empty buffer operations', () => {
    const buffer = new RingBuffer<number>(3);

    expect(buffer.isEmpty()).toBe(true);
    expect(buffer.isFull()).toBe(false);
    expect(buffer.get(0)).toBeUndefined();
    expect(buffer.oldest()).toBeUndefined();
    expect(buffer.newest()).toBeUndefined();
    expect(buffer.toArray()).toEqual([]);
  });

  it('should handle single item buffer', () => {
    const buffer = new RingBuffer<number>(1);

    buffer.push(1);
    expect(buffer.size()).toBe(1);
    expect(buffer.get(0)).toBe(1);
    expect(buffer.oldest()).toBe(1);
    expect(buffer.newest()).toBe(1);

    buffer.push(2); // Should evict 1
    expect(buffer.size()).toBe(1);
    expect(buffer.get(0)).toBe(2);
    expect(buffer.oldest()).toBe(2);
    expect(buffer.newest()).toBe(2);
  });

  it('should handle full buffer', () => {
    const buffer = new RingBuffer<number>(2);

    buffer.push(1);
    buffer.push(2);

    expect(buffer.isFull()).toBe(true);
    expect(buffer.isEmpty()).toBe(false);

    buffer.push(3);
    expect(buffer.isFull()).toBe(true);
    expect(buffer.size()).toBe(2);
  });

  it('should handle clear', () => {
    const buffer = new RingBuffer<number>(3);

    buffer.push(1);
    buffer.push(2);
    buffer.push(3);

    expect(buffer.size()).toBe(3);

    buffer.clear();
    expect(buffer.size()).toBe(0);
    expect(buffer.isEmpty()).toBe(true);
    expect(buffer.isFull()).toBe(false);
  });

  it('should handle forEach iteration', () => {
    const buffer = new RingBuffer<number>(3);

    buffer.push(1);
    buffer.push(2);
    buffer.push(3);

    const results: number[] = [];
    buffer.forEach((item) => {
      results.push(item);
    });

    expect(results).toEqual([1, 2, 3]);
  });

  it('should handle at() method with bounds checking', () => {
    const buffer = new RingBuffer<number>(3);

    buffer.push(1);
    buffer.push(2);
    buffer.push(3);

    expect(buffer.at(0)).toBe(1);
    expect(buffer.at(1)).toBe(2);
    expect(buffer.at(2)).toBe(3);

    expect(() => buffer.at(3)).toThrow('Index 3 out of bounds for RingBuffer of size 3');
    expect(() => buffer.at(-1)).toThrow('Index -1 out of bounds for RingBuffer of size 3');
  });

  it('should handle set() method', () => {
    const buffer = new RingBuffer<number>(3);

    buffer.push(1);
    buffer.push(2);
    buffer.push(3);

    buffer.set(1, 99);
    expect(buffer.get(1)).toBe(99);

    expect(() => buffer.set(3, 99)).toThrow('Index 3 out of bounds for RingBuffer of size 3');
  });
});
