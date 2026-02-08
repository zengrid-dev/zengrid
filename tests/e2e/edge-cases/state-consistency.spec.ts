import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';

test.describe('State Consistency Edge Cases', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should maintain state after data reload', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    await gridPage.selectCell(10, 2);
    await gridPage.sortByColumn(0);

    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    // Selection and sort state should be handled appropriately
  });

  test.skip('should maintain scroll position after resize', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    await gridPage.scrollTo(5000);
    const positionBefore = await gridPage.getScrollPosition();

    await page.setViewportSize({ width: 1024, height: 768 });

    const positionAfter = await gridPage.getScrollPosition();
    expect(positionAfter.top).toBeCloseTo(positionBefore.top, 100);
  });

  test.skip('should maintain selection during sort', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    await gridPage.selectCell(10, 2);
    const valueBefore = await gridPage.getCellValue(10, 2);

    await gridPage.sortByColumn(0);

    // Selection should follow the data or clear appropriately
  });

  test.skip('should maintain selection during filter', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    await gridPage.selectCell(10, 2);

    await gridPage.setFilter(0, 'greaterThan', 50);

    // Selection should be handled appropriately
  });

  test.skip('should sync visible range with scroll position', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    await gridPage.scrollTo(3000);

    const range = await gridPage.getVisibleRange();
    const position = await gridPage.getScrollPosition();

    // Range should match scroll position
    expect(range.startRow).toBeGreaterThan(0);
  });

  test.skip('should maintain edit state during scroll', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    await gridPage.startEdit(10, 2);

    await gridPage.scrollTo(5000);

    // Edit should be committed or maintained
  });

  test.skip('should maintain filter state across data updates', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    await gridPage.setFilter(0, 'greaterThan', 50);

    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.updateCells([{ row: 0, col: 0, value: 999 }]);
    });

    // Filter should still be active
  });

  test.skip('should maintain sort state across data updates', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    await gridPage.sortByColumn(0);

    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.updateCells([{ row: 0, col: 0, value: 999 }]);
    });

    // Sort should still be active
  });

  test.skip('should maintain undo/redo stack consistency', async ({ page }) => {
    await gridPage.setData([['original']]);

    await gridPage.editCell(0, 0, 'edit1');
    await gridPage.editCell(0, 0, 'edit2');
    await gridPage.undo();

    const value = await gridPage.getCellValue(0, 0);
    expect(value).toBe('edit1');

    await gridPage.redo();
    const value2 = await gridPage.getCellValue(0, 0);
    expect(value2).toBe('edit2');
  });

  test.skip('should maintain column widths after data change', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    await gridPage.resizeColumn(0, 100);

    await gridPage.setData(generateNumericData({ rows: 200, cols: 5 }));

    // Column width should be maintained
  });

  test.skip('should maintain column order after data change', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    await gridPage.dragColumn(0, 2);

    await gridPage.setData(generateNumericData({ rows: 200, cols: 5 }));

    // Column order should be maintained
  });

  test.skip('should clear selection on data replacement', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    await gridPage.selectRange(10, 0, 20, 4);

    await gridPage.setData(generateNumericData({ rows: 50, cols: 3 }));

    // Selection should be cleared or adjusted
  });

  test.skip('should handle state after grid destroy and recreate', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.destroy?.();
    });

    await gridPage.goto('/');
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    // Should start with clean state
  });

  test.skip('should maintain pagination state', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 5 }));

    await gridPage.goToPage(5);

    await gridPage.sortByColumn(0);

    // Should stay on page 5 or handle appropriately
  });

  test.skip('should sync index map with data changes', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    await gridPage.sortByColumn(0);
    await gridPage.setFilter(1, 'greaterThan', 50);

    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.updateCells([{ row: 0, col: 0, value: 999 }]);
    });

    // Index map should be updated
  });
});
