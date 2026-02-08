import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';

test.describe('Backend Mode', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should use onDataRequest callback for data loading', async ({ page }) => {
    test.skip();
  });

  test.skip('should load data in pages/ranges', async ({ page }) => {
    test.skip();
  });

  test.skip('should cache loaded ranges', async ({ page }) => {
    test.skip();
  });

  test.skip('should not repeat identical requests', async ({ page }) => {
    test.skip();
  });

  test.skip('should deduplicate concurrent identical requests', async ({ page }) => {
    test.skip();
  });

  test.skip('should show loading state during fetch', async ({ page }) => {
    test.skip();
  });

  test.skip('should support server-side sorting', async ({ page }) => {
    test.skip();
  });

  test.skip('should support server-side filtering', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle fetch errors gracefully', async ({ page }) => {
    test.skip();
  });
});
