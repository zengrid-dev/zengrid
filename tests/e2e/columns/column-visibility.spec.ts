import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';

test.describe('Column Visibility', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should hide column', async ({ page }) => {
    test.skip();
  });

  test.skip('should show hidden column', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire column:hide event', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire column:show event', async ({ page }) => {
    test.skip();
  });

  test.skip('should preserve data for hidden columns', async ({ page }) => {
    test.skip();
  });

  test.skip('should adjust visible column positions after hide', async ({ page }) => {
    test.skip();
  });

  test.skip('should support toggling column visibility', async ({ page }) => {
    test.skip();
  });
});
