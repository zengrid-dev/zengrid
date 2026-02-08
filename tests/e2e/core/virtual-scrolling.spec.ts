import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData, generateLargeDataset } from '../../fixtures/test-data';
import { expectScrollPosition, expectVisibleCells, expectPerformance, expectBoundedDOMElements } from '../../fixtures/helpers';

test.describe('Virtual Scrolling', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test('should render only visible rows at initial position', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    // Verify only visible cells rendered (visible + overscan)
    // With ~10-15 visible rows and 10 columns, expect 100-300 cells
    await expectVisibleCells(page, 50, 300);
  });

  test.skip('should update visible cells when scrolling down', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    // Scroll to middle
    await gridPage.scrollTo(5000);

    // Verify correct rows visible
    const visibleRange = await gridPage.getVisibleRange();
    expect(visibleRange.startRow).toBeGreaterThan(100);
  });

  test.skip('should update visible cells when scrolling up', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    // Scroll to middle then back up
    await gridPage.scrollTo(5000);
    await gridPage.scrollTo(1000);

    const visibleRange = await gridPage.getVisibleRange();
    expect(visibleRange.startRow).toBeLessThan(50);
  });

  test.skip('should maintain bounded DOM elements during fast scrolling', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10000, cols: 10 }));

    // Fast scroll through multiple ranges
    for (let scrollTop = 0; scrollTop < 50000; scrollTop += 5000) {
      await gridPage.scrollTo(scrollTop);
    }

    // DOM elements should stay bounded
    await expectBoundedDOMElements(page, '.zen-grid-cell', 100);
  });

  test.skip('should not show blank areas during fast scroll (overscan works)', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10000, cols: 10 }));

    // Very fast scroll
    await gridPage.scrollTo(50000);
    await page.waitForTimeout(50);

    // Check that cells are rendered (no blank areas)
    const cellCount = await page.locator('.zen-grid-cell').count();
    expect(cellCount).toBeGreaterThan(0);
  });

  test.skip('should maintain 60fps with 100k+ rows', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(100000, 10));

    await expectPerformance(page, async () => {
      // Scroll through significant portion
      for (let i = 0; i < 10; i++) {
        await gridPage.scrollTo(i * 10000);
      }
    }, 500); // Should complete in < 500ms (50ms per scroll)
  });

  test.skip('should call scrollToCell and scroll to specific cell', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    // Scroll to row 500, col 5
    await gridPage.scrollToCell(500, 5);

    const visibleRange = await gridPage.getVisibleRange();
    expect(visibleRange.startRow).toBeLessThanOrEqual(500);
    expect(visibleRange.endRow).toBeGreaterThanOrEqual(500);
  });

  test.skip('should return correct visible range via getVisibleRange()', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    await gridPage.scrollTo(3000);

    const range = await gridPage.getVisibleRange();

    // Verify range is reasonable for scrollTop=3000
    expect(range.startRow).toBeGreaterThan(0);
    expect(range.endRow).toBeLessThan(1000);
    expect(range.endRow).toBeGreaterThan(range.startRow);
  });

  test.skip('should return correct scroll position via getScrollPosition()', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    await gridPage.scrollTo(2500, 150);

    const position = await gridPage.getScrollPosition();
    expect(position.top).toBeCloseTo(2500, 5);
    expect(position.left).toBeCloseTo(150, 5);
  });

  test.skip('should handle scroll to bottom edge', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 10 }));

    // Scroll to very bottom
    const totalHeight = await page.evaluate(() => {
      // @ts-ignore
      return window.grid?.getTotalHeight?.() ?? 0;
    });

    await gridPage.scrollTo(totalHeight);

    const range = await gridPage.getVisibleRange();
    expect(range.endRow).toBe(99); // Last row
  });

  test.skip('should handle scroll to top edge', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    // Scroll down then back to top
    await gridPage.scrollTo(5000);
    await gridPage.scrollTo(0);

    const range = await gridPage.getVisibleRange();
    expect(range.startRow).toBe(0); // First row
  });

  test.skip('should recycle DOM elements when scrolling', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10000, cols: 10 }));

    const initialCellCount = await page.locator('.zen-grid-cell').count();

    // Scroll significantly
    await gridPage.scrollTo(50000);

    const afterScrollCellCount = await page.locator('.zen-grid-cell').count();

    // Cell count should be similar (recycling, not creating new)
    expect(Math.abs(afterScrollCellCount - initialCellCount)).toBeLessThan(10);
  });

  test.skip('should handle horizontal scrolling', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 50 }));

    // Scroll horizontally
    await gridPage.scrollTo(0, 500);

    const position = await gridPage.getScrollPosition();
    expect(position.left).toBeCloseTo(500, 5);
  });

  test.skip('should handle diagonal scrolling', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 50 }));

    // Scroll diagonally
    await gridPage.scrollTo(3000, 600);

    const position = await gridPage.getScrollPosition();
    expect(position.top).toBeCloseTo(3000, 5);
    expect(position.left).toBeCloseTo(600, 5);
  });
});
