import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateLargeDataset } from '../../fixtures/test-data';
import { expectPerformance } from '../../fixtures/helpers';

test.describe('Large Dataset Edge Cases', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should handle 100k rows', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(100000, 10));

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(100000);
  });

  test.skip('should maintain 60fps with 100k rows', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(100000, 10));

    await expectPerformance(page, async () => {
      for (let i = 0; i < 10; i++) {
        await gridPage.scrollTo(i * 10000);
      }
    }, 500);
  });

  test.skip('should handle 1 million rows', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(1000000, 10));

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(1000000);
  });

  test.skip('should handle 100 columns', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(1000, 100));

    const colCount = await gridPage.getColumnCount();
    expect(colCount).toBe(100);
  });

  test.skip('should handle 500 columns', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(100, 500));

    const colCount = await gridPage.getColumnCount();
    expect(colCount).toBe(500);
  });

  test.skip('should scroll to bottom of 100k rows', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(100000, 10));

    await gridPage.scrollToCell(99999, 0);

    const visibleRange = await gridPage.getVisibleRange();
    expect(visibleRange.endRow).toBe(99999);
  });

  test.skip('should scroll to last column of 100 columns', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(100, 100));

    await gridPage.scrollToCell(0, 99);

    const visibleRange = await gridPage.getVisibleRange();
    expect(visibleRange.endCol).toBe(99);
  });

  test.skip('should handle rapid scrolling through 100k rows', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(100000, 10));

    for (let i = 0; i < 20; i++) {
      await gridPage.scrollTo(Math.random() * 1000000);
      await page.waitForTimeout(10);
    }

    // Should not crash or show blank areas
  });

  test.skip('should sort 100k rows efficiently', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(100000, 5));

    await expectPerformance(page, async () => {
      await gridPage.sortByColumn(0);
    }, 2000);
  });

  test.skip('should filter 100k rows efficiently', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(100000, 5));

    await expectPerformance(page, async () => {
      await gridPage.setFilter(0, 'greaterThan', 50000);
    }, 2000);
  });

  test.skip('should select range in large dataset', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(100000, 10));

    await gridPage.selectRange(1000, 0, 2000, 5);

    // Should not crash
  });

  test.skip('should edit cell in middle of 100k rows', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(100000, 10));

    await gridPage.scrollToCell(50000, 5);
    await gridPage.editCell(50000, 5, 'edited');

    const cellValue = await gridPage.getCellValue(50000, 5);
    expect(cellValue).toBe('edited');
  });

  test.skip('should handle copy/paste in large dataset', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(100000, 10));

    await gridPage.scrollToCell(10000, 0);
    await gridPage.selectRange(10000, 0, 10010, 5);
    await gridPage.copy();

    // Should not crash
  });

  test.skip('should maintain bounded DOM with large dataset', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(100000, 50));

    const cellCount = await page.locator('.zen-grid-cell').count();

    // Should stay under reasonable limit (visible + overscan)
    expect(cellCount).toBeLessThan(500);
  });

  test.skip('should handle loading 100k rows incrementally', async ({ page }) => {
    // Simulate loading in chunks
    for (let i = 0; i < 10; i++) {
      await gridPage.setData(generateLargeDataset((i + 1) * 10000, 10));
      await page.waitForTimeout(100);
    }

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(100000);
  });
});
