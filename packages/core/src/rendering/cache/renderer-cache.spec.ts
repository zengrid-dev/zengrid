import { RendererCache } from './renderer-cache';

describe('RendererCache.generateKey', () => {
  it('creates distinct keys for different object values', () => {
    const janRange = {
      start: new Date('2024-01-01T00:00:00.000Z'),
      end: new Date('2024-01-08T00:00:00.000Z'),
    };
    const febRange = {
      start: new Date('2024-02-01T00:00:00.000Z'),
      end: new Date('2024-02-08T00:00:00.000Z'),
    };

    const janKey = RendererCache.generateKey(0, 8, janRange, 'date-range');
    const febKey = RendererCache.generateKey(1, 8, febRange, 'date-range');

    expect(janKey).not.toBe(febKey);
  });

  it('updates key when object content changes', () => {
    const range = {
      start: new Date('2024-01-01T00:00:00.000Z'),
      end: new Date('2024-01-08T00:00:00.000Z'),
    };

    const before = RendererCache.generateKey(0, 8, range, 'date-range');
    range.end = new Date('2024-01-16T00:00:00.000Z');
    const after = RendererCache.generateKey(0, 8, range, 'date-range');

    expect(before).not.toBe(after);
  });

  it('handles circular values without throwing and keeps object identity stable', () => {
    const first: any = { label: 'first' };
    first.self = first;
    const second: any = { label: 'second' };
    second.self = second;

    const firstKey = RendererCache.generateKey(0, 3, first, 'text');
    const firstKeyAgain = RendererCache.generateKey(1, 3, first, 'text');
    const secondKey = RendererCache.generateKey(2, 3, second, 'text');

    expect(firstKey).toBe(firstKeyAgain);
    expect(firstKey).not.toBe(secondKey);
  });
});
