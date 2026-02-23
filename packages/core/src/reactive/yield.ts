/**
 * Yield to the main thread via setTimeout(0).
 * Allows the browser to process pending events/rendering between chunks.
 */
export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Process an array in chunks, yielding to the main thread between each chunk.
 *
 * @param items - Array to process
 * @param processFn - Called for each item
 * @param chunkSize - Items per chunk before yielding (default 10000)
 */
export async function processInChunks<T>(
  items: T[],
  processFn: (item: T, index: number) => void,
  chunkSize = 10000
): Promise<void> {
  for (let i = 0; i < items.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, items.length);
    for (let j = i; j < end; j++) {
      processFn(items[j], j);
    }
    if (end < items.length) {
      await yieldToMain();
    }
  }
}
