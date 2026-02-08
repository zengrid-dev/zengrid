import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateSortableData } from '../../fixtures/test-data';

test.describe('Multi-Column Sort', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should add secondary sort with Shift+click', async ({ page }) => {
    await gridPage.setData(generateSortableData(20));

    await gridPage.clickHeader(0);
    await page.keyboard.down('Shift');
    await gridPage.clickHeader(1);
    await page.keyboard.up('Shift');

    test.skip();
  });

  test.skip('should display sort priority indicators (1, 2, 3)', async ({ page }) => {
    test.skip();
  });

  test.skip('should sort by primary then secondary columns', async ({ page }) => {
    test.skip();
  });

  test.skip('should support up to N columns in sort', async ({ page }) => {
    test.skip();
  });

  test.skip('should remove column from multi-sort', async ({ page }) => {
    test.skip();
  });

  test.skip('should clear all sorts', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire sort:change event with all sort columns', async ({ page }) => {
    test.skip();
  });

  test.skip('should maintain multi-sort after data updates', async ({ page }) => {
    test.skip();
  });
});
