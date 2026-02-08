import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateEmptyData, generateSingleRowData } from '../../fixtures/test-data';

test.describe('Empty Data Edge Cases', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should render empty grid with no data', async ({ page }) => {
    await gridPage.setData(generateEmptyData());

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(0);
  });

  test.skip('should display empty state message', async ({ page }) => {
    await gridPage.setData(generateEmptyData());

    const emptyMessage = page.locator('.zg-empty-state, .empty-grid');
    await expect(emptyMessage).toBeVisible();
  });

  test.skip('should handle clicks on empty grid', async ({ page }) => {
    await gridPage.setData(generateEmptyData());

    // Click should not crash
    await page.locator('.zen-grid').click();
  });

  test.skip('should handle keyboard navigation on empty grid', async ({ page }) => {
    await gridPage.setData(generateEmptyData());

    await gridPage.pressKey('ArrowDown');
    await gridPage.pressKey('ArrowRight');
    // Should not crash
  });

  test.skip('should handle single row data', async ({ page }) => {
    await gridPage.setData(generateSingleRowData(5));

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(1);
  });

  test.skip('should handle single column data', async ({ page }) => {
    await gridPage.setData([[1], [2], [3]]);

    const colCount = await gridPage.getColumnCount();
    expect(colCount).toBe(1);
  });

  test.skip('should handle single cell data', async ({ page }) => {
    await gridPage.setData([['single']]);

    const rowCount = await gridPage.getRowCount();
    const colCount = await gridPage.getColumnCount();
    expect(rowCount).toBe(1);
    expect(colCount).toBe(1);
  });

  test.skip('should handle transition from empty to populated', async ({ page }) => {
    await gridPage.setData(generateEmptyData());
    await gridPage.setData([[1, 2, 3]]);

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(1);
  });

  test.skip('should handle transition from populated to empty', async ({ page }) => {
    await gridPage.setData([[1, 2, 3]]);
    await gridPage.setData(generateEmptyData());

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(0);
  });

  test.skip('should handle array of empty rows', async ({ page }) => {
    await gridPage.setData([[], [], []]);

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test.skip('should handle rows with different lengths', async ({ page }) => {
    await gridPage.setData([
      [1, 2, 3],
      [4, 5],
      [6]
    ]);

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(3);
  });

  test.skip('should handle undefined data', async ({ page }) => {
    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.setData(undefined);
    });

    // Should not crash
  });

  test.skip('should handle null data', async ({ page }) => {
    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.setData(null);
    });

    // Should not crash
  });

  test.skip('should handle non-array data gracefully', async ({ page }) => {
    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.setData('invalid');
    });

    // Should not crash
  });
});
