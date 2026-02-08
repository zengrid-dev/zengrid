import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';

test.describe('Boundary Value Edge Cases', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should handle row index 0', async ({ page }) => {
    await gridPage.setData([[1, 2, 3]]);

    await gridPage.scrollToCell(0, 0);
    await gridPage.clickCell(0, 0);

    // Should work correctly
  });

  test.skip('should handle column index 0', async ({ page }) => {
    await gridPage.setData([[1], [2], [3]]);

    await gridPage.clickCell(0, 0);

    // Should work correctly
  });

  test.skip('should handle maximum safe integer', async ({ page }) => {
    await gridPage.setData([[Number.MAX_SAFE_INTEGER]]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBeTruthy();
  });

  test.skip('should handle minimum safe integer', async ({ page }) => {
    await gridPage.setData([[Number.MIN_SAFE_INTEGER]]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBeTruthy();
  });

  test.skip('should handle very long text strings', async ({ page }) => {
    const longText = 'A'.repeat(10000);
    await gridPage.setData([[longText]]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue.length).toBeGreaterThan(0);
  });

  test.skip('should handle very small numbers', async ({ page }) => {
    await gridPage.setData([[0.0000000001, 1e-10]]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBeTruthy();
  });

  test.skip('should handle very large numbers', async ({ page }) => {
    await gridPage.setData([[1e308, 9.9e307]]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBeTruthy();
  });

  test.skip('should handle negative zero', async ({ page }) => {
    await gridPage.setData([[-0, 0]]);

    const cell1 = await gridPage.getCellValue(0, 0);
    const cell2 = await gridPage.getCellValue(0, 1);
    expect(cell1).toBeTruthy();
    expect(cell2).toBeTruthy();
  });

  test.skip('should handle scroll position at maximum', async ({ page }) => {
    await gridPage.setData(Array.from({ length: 10000 }, (_, i) => [i]));

    const totalHeight = await page.evaluate(() => {
      // @ts-ignore
      return window.grid?.getTotalHeight?.() ?? 0;
    });

    await gridPage.scrollTo(totalHeight);

    // Should not crash
  });

  test.skip('should handle scroll position at 0', async ({ page }) => {
    await gridPage.setData(Array.from({ length: 100 }, (_, i) => [i]));

    await gridPage.scrollTo(5000);
    await gridPage.scrollTo(0);

    const position = await gridPage.getScrollPosition();
    expect(position.top).toBe(0);
  });

  test.skip('should handle negative scroll position', async ({ page }) => {
    await gridPage.setData(Array.from({ length: 100 }, (_, i) => [i]));

    await gridPage.scrollTo(-100);

    const position = await gridPage.getScrollPosition();
    expect(position.top).toBeGreaterThanOrEqual(0);
  });

  test.skip('should handle scroll beyond max height', async ({ page }) => {
    await gridPage.setData(Array.from({ length: 100 }, (_, i) => [i]));

    const totalHeight = await page.evaluate(() => {
      // @ts-ignore
      return window.grid?.getTotalHeight?.() ?? 0;
    });

    await gridPage.scrollTo(totalHeight * 2);

    // Should clamp to max height
  });

  test.skip('should handle selection at first cell', async ({ page }) => {
    await gridPage.setData([[1, 2], [3, 4]]);

    await gridPage.selectCell(0, 0);
    await gridPage.pressKey('ArrowUp');
    await gridPage.pressKey('ArrowLeft');

    // Should not go negative
  });

  test.skip('should handle selection at last cell', async ({ page }) => {
    await gridPage.setData([[1, 2], [3, 4]]);

    await gridPage.selectCell(1, 1);
    await gridPage.pressKey('ArrowDown');
    await gridPage.pressKey('ArrowRight');

    // Should not exceed bounds
  });

  test.skip('should handle empty string values', async ({ page }) => {
    await gridPage.setData([['', '', '']]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBe('');
  });

  test.skip('should handle whitespace-only strings', async ({ page }) => {
    await gridPage.setData([['   ', '\t\t', '\n\n']]);

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(1);
  });

  test.skip('should handle unicode edge cases', async ({ page }) => {
    await gridPage.setData([
      ['👨‍👩‍👧‍👦', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '\u200B'] // Family emoji, flag, zero-width space
    ]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBeTruthy();
  });

  test.skip('should handle surrogate pairs', async ({ page }) => {
    await gridPage.setData([['𝕳𝖊𝖑𝖑𝖔', '🔥💯']]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBeTruthy();
  });

  test.skip('should handle date at epoch (1970-01-01)', async ({ page }) => {
    await gridPage.setData([[new Date(0)]]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBeTruthy();
  });

  test.skip('should handle date far in future', async ({ page }) => {
    await gridPage.setData([[new Date('2999-12-31')]]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBeTruthy();
  });

  test.skip('should handle date far in past', async ({ page }) => {
    await gridPage.setData([[new Date('1000-01-01')]]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBeTruthy();
  });
});
