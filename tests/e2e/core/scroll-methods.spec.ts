import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';

test.describe('Scroll Methods', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should scroll to specific position with scrollTo()', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    await gridPage.scrollTo(5000, 200);

    const position = await gridPage.getScrollPosition();
    expect(position.top).toBeCloseTo(5000, 5);
    expect(position.left).toBeCloseTo(200, 5);
  });

  test.skip('should scroll to specific cell with scrollToCell()', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    await gridPage.scrollToCell(500, 5);

    const visibleRange = await gridPage.getVisibleRange();
    expect(visibleRange.startRow).toBeLessThanOrEqual(500);
    expect(visibleRange.endRow).toBeGreaterThanOrEqual(500);
  });

  test.skip('should scroll to top with scrollToCell(0, 0)', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    await gridPage.scrollTo(5000);
    await gridPage.scrollToCell(0, 0);

    const position = await gridPage.getScrollPosition();
    expect(position.top).toBeCloseTo(0, 5);
  });

  test.skip('should scroll to bottom with scrollToCell(lastRow, 0)', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 10 }));

    await gridPage.scrollToCell(99, 0);

    const visibleRange = await gridPage.getVisibleRange();
    expect(visibleRange.endRow).toBe(99);
  });

  test.skip('should animate scroll with scrollThroughCells()', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    // If animated scroll is supported
    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.scrollThroughCells?.(0, 500);
    });

    await page.waitForTimeout(1000); // Wait for animation

    const visibleRange = await gridPage.getVisibleRange();
    expect(visibleRange.startRow).toBeGreaterThan(400);
  });

  test.skip('should abort animated scroll when user scrolls', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    // Start animated scroll
    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.scrollThroughCells?.(0, 500);
    });

    // User scrolls manually
    await gridPage.scrollTo(1000);

    // Animation should abort
    await page.waitForTimeout(500);

    const position = await gridPage.getScrollPosition();
    expect(position.top).toBeCloseTo(1000, 100);
  });

  test.skip('should handle scrollToCell with out-of-bounds row', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 10 }));

    // Try to scroll to row 1000 (doesn't exist)
    await gridPage.scrollToCell(1000, 0);

    // Should clamp to last row
    const visibleRange = await gridPage.getVisibleRange();
    expect(visibleRange.endRow).toBeLessThanOrEqual(99);
  });

  test.skip('should handle scrollToCell with negative indices', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 10 }));

    await gridPage.scrollTo(5000);

    // Try to scroll to negative row
    await gridPage.scrollToCell(-1, 0);

    // Should clamp to first row (0)
    const visibleRange = await gridPage.getVisibleRange();
    expect(visibleRange.startRow).toBe(0);
  });

  test.skip('should handle horizontal scrollToCell', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 50 }));

    await gridPage.scrollToCell(0, 30);

    const visibleRange = await gridPage.getVisibleRange();
    expect(visibleRange.startCol).toBeLessThanOrEqual(30);
    expect(visibleRange.endCol).toBeGreaterThanOrEqual(30);
  });

  test.skip('should maintain scroll position during data updates', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    await gridPage.scrollTo(3000);

    const positionBefore = await gridPage.getScrollPosition();

    // Update data
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10, startRow: 100 }));

    const positionAfter = await gridPage.getScrollPosition();

    // Scroll position should be maintained
    expect(positionAfter.top).toBeCloseTo(positionBefore.top, 50);
  });

  test.skip('should fire scroll events during scrollTo()', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    const eventPromise = gridPage.waitForEvent('scroll');

    await gridPage.scrollTo(2000);

    await eventPromise;
  });

  test.skip('should support smooth scrolling option', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    // If smooth scroll is supported
    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.scrollTo?.({ top: 5000, behavior: 'smooth' });
    });

    await page.waitForTimeout(500);

    const position = await gridPage.getScrollPosition();
    expect(position.top).toBeGreaterThan(0);
  });

  test.skip('should scroll by delta with scrollBy() if supported', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    const initialPosition = await gridPage.getScrollPosition();

    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.scrollBy?.(0, 1000);
    });

    const newPosition = await gridPage.getScrollPosition();

    expect(newPosition.top).toBeCloseTo(initialPosition.top + 1000, 10);
  });

  test.skip('should handle programmatic scroll during user scroll', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    // User starts scrolling
    await gridPage.scrollTo(1000);

    // Programmatic scroll
    await gridPage.scrollToCell(500, 0);

    // Programmatic scroll should win
    const visibleRange = await gridPage.getVisibleRange();
    expect(visibleRange.startRow).toBeCloseTo(500, 10);
  });
});
