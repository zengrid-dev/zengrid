import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';
import { expectClipboard, mockClipboard } from '../../fixtures/helpers';

test.describe('Copy & Paste', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should copy selected cell with Ctrl+C', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    await gridPage.selectCell(2, 2);
    await gridPage.copy();

    await expectClipboard(page, '12');
  });

  test.skip('should copy selected range with Ctrl+C', async ({ page }) => {
    test.skip();
  });

  test.skip('should paste with Ctrl+V', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    await mockClipboard(page, '999');

    await gridPage.selectCell(1, 1);
    await gridPage.paste();

    const cellValue = await gridPage.getCellValue(1, 1);
    expect(cellValue).toBe('999');
  });

  test.skip('should paste range data', async ({ page }) => {
    test.skip();
  });

  test.skip('should copy with tab-separated format', async ({ page }) => {
    test.skip();
  });

  test.skip('should include headers in copy if configured', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle empty cells in copy', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire copy event', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire paste event', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire cut event', async ({ page }) => {
    test.skip();
  });

  test.skip('should cut selection with Ctrl+X', async ({ page }) => {
    test.skip();
  });

  test.skip('should paste into selection range', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle paste with mismatched dimensions', async ({ page }) => {
    test.skip();
  });
});
