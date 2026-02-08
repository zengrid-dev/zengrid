import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';

test.describe('Column Drag & Reorder', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should drag column header to reorder', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    await gridPage.dragColumn(0, 2);

    test.skip();
  });

  test.skip('should show visual feedback during drag', async ({ page }) => {
    test.skip();
  });

  test.skip('should show drop indicator at valid drop zones', async ({ page }) => {
    test.skip();
  });

  test.skip('should update column order after drop', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire column:dragStart event', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire column:drag event during drag', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire column:dragEnd event', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire column:move event after reorder', async ({ page }) => {
    test.skip();
  });

  test.skip('should support keyboard-based column reordering', async ({ page }) => {
    test.skip();
  });

  test.skip('should auto-scroll when dragging near viewport edge', async ({ page }) => {
    test.skip();
  });

  test.skip('should cancel drag on Escape key', async ({ page }) => {
    test.skip();
  });

  test.skip('should support touch-based drag on mobile', async ({ page }) => {
    test.skip();
  });

  test.skip('should prevent reordering if column is pinned', async ({ page }) => {
    test.skip();
  });
});
