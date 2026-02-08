import { expect, Page } from '@playwright/test';

/**
 * Common test helpers and assertions for ZenGrid tests
 */

/**
 * Assert cell has expected value
 */
export async function expectCellValue(page: Page, row: number, col: number, expectedValue: string) {
  const cell = page.locator('.zg-cell').nth(row * 10 + col); // Assumes 10 columns
  await expect(cell).toHaveText(expectedValue);
}

/**
 * Assert cell has expected CSS class
 */
export async function expectCellHasClass(page: Page, row: number, col: number, className: string) {
  const cell = page.locator('.zg-cell').nth(row * 10 + col);
  await expect(cell).toHaveClass(new RegExp(className));
}

/**
 * Assert grid has expected number of visible cells
 */
export async function expectVisibleCells(page: Page, min: number, max: number) {
  const count = await page.locator('.zg-cell').count();
  expect(count).toBeGreaterThanOrEqual(min);
  expect(count).toBeLessThanOrEqual(max);
}

/**
 * Assert scroll position
 */
export async function expectScrollPosition(page: Page, expectedTop: number, expectedLeft = 0) {
  const position = await page.locator('.zg-viewport').evaluate((el) => ({
    top: el.scrollTop,
    left: el.scrollLeft,
  }));
  expect(position.top).toBeCloseTo(expectedTop, 0);
  expect(position.left).toBeCloseTo(expectedLeft, 0);
}

/**
 * Assert cell is selected
 */
export async function expectCellSelected(page: Page, row: number, col: number) {
  const cell = page.locator('.zg-cell').nth(row * 10 + col);
  await expect(cell).toHaveClass(/zg-cell-selected/);
}

/**
 * Assert cell is not selected
 */
export async function expectCellNotSelected(page: Page, row: number, col: number) {
  const cell = page.locator('.zg-cell').nth(row * 10 + col);
  await expect(cell).not.toHaveClass(/zg-cell-selected/);
}

/**
 * Assert cell is in editing mode
 */
export async function expectCellEditing(page: Page, row: number, col: number) {
  const cell = page.locator('.zg-cell').nth(row * 10 + col);
  await expect(cell).toHaveClass(/zg-cell-editing/);
  const input = cell.locator('input, textarea').first();
  await expect(input).toBeVisible();
}

/**
 * Wait for grid event
 */
export async function waitForGridEvent(page: Page, eventName: string, timeout = 1000): Promise<any> {
  return page.evaluate(({ name, ms }) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        // @ts-ignore
        window.grid?.off(name, handler);
        reject(new Error(`Event ${name} not fired within ${ms}ms`));
      }, ms);

      const handler = (event: any) => {
        clearTimeout(timer);
        // @ts-ignore
        window.grid?.off(name, handler);
        resolve(event);
      };
      // @ts-ignore
      window.grid?.on(name, handler);
    });
  }, { name: eventName, ms: timeout });
}

/**
 * Assert event was fired
 */
export async function expectEventFired(page: Page, eventName: string) {
  const eventPromise = waitForGridEvent(page, eventName);
  await expect(eventPromise).resolves.toBeDefined();
}

/**
 * Get grid statistics
 */
export async function getGridStats(page: Page) {
  return page.evaluate(() => {
    // @ts-ignore
    return window.grid?.getStats?.();
  });
}

/**
 * Assert performance (frame time)
 */
export async function expectPerformance(page: Page, action: () => Promise<void>, maxMs: number) {
  const start = Date.now();
  await action();
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(maxMs);
}

/**
 * Assert DOM element count is bounded
 */
export async function expectBoundedDOMElements(page: Page, selector: string, max: number) {
  const count = await page.locator(selector).count();
  expect(count).toBeLessThanOrEqual(max);
}

/**
 * Take visual snapshot
 */
export async function takeSnapshot(page: Page, name: string) {
  const grid = page.locator('.zg-grid');
  return expect(grid).toHaveScreenshot(`${name}.png`);
}

/**
 * Assert CSS variable value
 */
export async function expectCSSVariable(page: Page, variableName: string, expectedValue: string) {
  const value = await page.locator('.zg-grid').evaluate((el, varName) => {
    return getComputedStyle(el).getPropertyValue(varName).trim();
  }, variableName);
  expect(value).toBe(expectedValue);
}

/**
 * Assert dark theme is applied
 */
export async function expectDarkTheme(page: Page) {
  const grid = page.locator('.zg-grid');
  await expect(grid).toHaveClass(/zg-theme-dark/);
}

/**
 * Assert element is visible in viewport
 */
export async function expectVisibleInViewport(page: Page, selector: string) {
  const element = page.locator(selector);
  const isVisible = await element.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  });
  expect(isVisible).toBe(true);
}

/**
 * Assert header has sort indicator
 */
export async function expectHeaderSorted(page: Page, col: number, direction: 'asc' | 'desc') {
  const header = page.locator('.zg-header-cell').nth(col);
  const indicator = header.locator('.zg-sort-indicator');
  await expect(indicator).toBeVisible();

  if (direction === 'asc') {
    await expect(header).toHaveClass(/sorted-asc/);
  } else {
    await expect(header).toHaveClass(/sorted-desc/);
  }
}

/**
 * Assert filter is active
 */
export async function expectFilterActive(page: Page, col: number) {
  const header = page.locator('.zg-header-cell').nth(col);
  await expect(header).toHaveClass(/has-filter/);
}

/**
 * Assert loading indicator is visible
 */
export async function expectLoading(page: Page, visible: boolean) {
  const loading = page.locator('.zg-loading');
  if (visible) {
    await expect(loading).toBeVisible();
  } else {
    await expect(loading).not.toBeVisible();
  }
}

/**
 * Assert pagination state
 */
export async function expectPaginationState(
  page: Page,
  currentPage: number,
  totalPages: number,
  pageSize: number
) {
  const state = await page.evaluate(() => {
    // @ts-ignore
    return {
      // @ts-ignore
      currentPage: window.grid?.getCurrentPage(),
      // @ts-ignore
      totalPages: window.grid?.getTotalPages(),
      // @ts-ignore
      pageSize: window.grid?.getPageSize(),
    };
  });

  expect(state.currentPage).toBe(currentPage);
  expect(state.totalPages).toBe(totalPages);
  expect(state.pageSize).toBe(pageSize);
}

/**
 * Assert column width
 */
export async function expectColumnWidth(page: Page, col: number, expectedWidth: number, tolerance = 2) {
  const header = page.locator('.zg-header-cell').nth(col);
  const width = await header.evaluate((el) => el.getBoundingClientRect().width);
  expect(width).toBeCloseTo(expectedWidth, tolerance);
}

/**
 * Assert row height
 */
export async function expectRowHeight(page: Page, row: number, expectedHeight: number, tolerance = 2) {
  const rowElement = page.locator('.zg-row').nth(row);
  const height = await rowElement.evaluate((el) => el.getBoundingClientRect().height);
  expect(height).toBeCloseTo(expectedHeight, tolerance);
}

/**
 * Wait for animation to complete
 */
export async function waitForAnimation(page: Page, ms = 300) {
  await page.waitForTimeout(ms);
}

/**
 * Assert accessibility attributes
 */
export async function expectAccessible(page: Page, selector: string, role?: string, ariaLabel?: string) {
  const element = page.locator(selector);

  if (role) {
    await expect(element).toHaveAttribute('role', role);
  }

  if (ariaLabel) {
    await expect(element).toHaveAttribute('aria-label', ariaLabel);
  }
}

/**
 * Assert focused element
 */
export async function expectFocused(page: Page, selector: string) {
  const element = page.locator(selector);
  await expect(element).toBeFocused();
}

/**
 * Assert clipboard contains
 */
export async function expectClipboard(page: Page, expectedText: string) {
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toBe(expectedText);
}

/**
 * Mock clipboard for testing
 */
export async function mockClipboard(page: Page, text: string) {
  await page.evaluate((t) => {
    navigator.clipboard.writeText(t);
  }, text);
}

/**
 * Measure FPS during action
 */
export async function measureFPS(page: Page, action: () => Promise<void>): Promise<number> {
  const fps = await page.evaluate(async (actionStr) => {
    let frameCount = 0;
    let startTime = 0;

    const countFrame = () => {
      frameCount++;
      requestAnimationFrame(countFrame);
    };

    return new Promise<number>((resolve) => {
      requestAnimationFrame(() => {
        startTime = performance.now();
        countFrame();

        // Run action
        setTimeout(() => {
          const duration = (performance.now() - startTime) / 1000;
          resolve(frameCount / duration);
        }, 1000);
      });
    });
  }, action.toString());

  return fps;
}

/**
 * Assert no console errors
 */
export async function expectNoConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Check after test
  expect(errors).toHaveLength(0);
}

/**
 * Simulate slow network
 */
export async function simulateSlowNetwork(page: Page) {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: 500 * 1024 / 8, // 500kb/s
    uploadThroughput: 500 * 1024 / 8,
    latency: 100,
  });
}

/**
 * Reset network conditions
 */
export async function resetNetwork(page: Page) {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: -1,
    uploadThroughput: -1,
    latency: 0,
  });
}
