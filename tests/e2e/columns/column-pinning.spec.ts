import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';

test.describe('Column Pinning', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should pin column to left', async ({ page }) => {
    test.skip();
  });

  test.skip('should pin column to right', async ({ page }) => {
    test.skip();
  });

  test.skip('should unpin column', async ({ page }) => {
    test.skip();
  });

  test.skip('should keep pinned column fixed during horizontal scroll', async ({ page }) => {
    test.skip();
  });

  test.skip('should maintain pinned column order', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire column:pin event', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire column:unpin event', async ({ page }) => {
    test.skip();
  });
});
