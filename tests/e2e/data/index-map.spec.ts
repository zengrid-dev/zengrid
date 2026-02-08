import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';

test.describe('Index Map', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should not modify original data when sorting', async ({ page }) => {
    const originalData = generateNumericData({ rows: 10, cols: 5 });
    await gridPage.setData(originalData);

    await gridPage.sortByColumn(0);

    const data = await gridPage.getData();
    // Data should be transformed via index map, not modified
    test.skip();
  });

  test.skip('should not modify original data when filtering', async ({ page }) => {
    test.skip();
  });

  test.skip('should combine sort and filter transformations', async ({ page }) => {
    test.skip();
  });

  test.skip('should maintain original indices', async ({ page }) => {
    test.skip();
  });

  test.skip('should map visual index to data index', async ({ page }) => {
    test.skip();
  });

  test.skip('should map data index to visual index', async ({ page }) => {
    test.skip();
  });
});
