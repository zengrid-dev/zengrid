import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateFilterableData } from '../../fixtures/test-data';

test.describe('Filter Exports', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should export filters as queryString format', async ({ page }) => {
    await gridPage.setData(generateFilterableData(100));

    await gridPage.setFilter(0, 'contains', 'Item');

    const exports = await page.evaluate(() => {
      // @ts-ignore
      return window.grid?.getFilterExports?.();
    });

    expect(exports?.queryString).toBeTruthy();
  });

  test.skip('should export filters as GraphQL where format', async ({ page }) => {
    test.skip();
  });

  test.skip('should export filters as SQL WHERE clause', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle multiple filters in exports', async ({ page }) => {
    test.skip();
  });

  test.skip('should escape special characters in exports', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle complex operators in exports', async ({ page }) => {
    test.skip();
  });
});
