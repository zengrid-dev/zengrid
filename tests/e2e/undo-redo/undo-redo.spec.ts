import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';

test.describe('Undo & Redo', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should undo cell edit with Ctrl+Z', async ({ page }) => {
    await gridPage.setData([['Original']]);

    await gridPage.editCell(0, 0, 'Modified');
    await gridPage.undo();

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBe('Original');
  });

  test.skip('should redo with Ctrl+Y', async ({ page }) => {
    await gridPage.setData([['Original']]);

    await gridPage.editCell(0, 0, 'Modified');
    await gridPage.undo();
    await gridPage.redo();

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBe('Modified');
  });

  test.skip('should redo with Ctrl+Shift+Z', async ({ page }) => {
    test.skip();
  });

  test.skip('should undo sort operation', async ({ page }) => {
    test.skip();
  });

  test.skip('should undo filter operation', async ({ page }) => {
    test.skip();
  });

  test.skip('should undo column resize', async ({ page }) => {
    test.skip();
  });

  test.skip('should undo column reorder', async ({ page }) => {
    test.skip();
  });

  test.skip('should batch multiple edits into single undo', async ({ page }) => {
    test.skip();
  });

  test.skip('should maintain undo stack limit', async ({ page }) => {
    test.skip();
  });

  test.skip('should clear redo stack after new action', async ({ page }) => {
    test.skip();
  });

  test.skip('should disable undo button when stack empty', async ({ page }) => {
    test.skip();
  });

  test.skip('should disable redo button when stack empty', async ({ page }) => {
    test.skip();
  });
});
