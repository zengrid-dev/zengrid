import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';

test.describe('Select Editor', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should open select dropdown on double-click', async ({ page }) => {
    await gridPage.setData([['Option A']]);

    await gridPage.doubleClickCell(0, 0);

    const cell = await gridPage.getCell(0, 0);
    const select = cell.locator('select, [role="combobox"]');
    await expect(select).toBeVisible();
  });

  test.skip('should display current value as selected', async ({ page }) => {
    test.skip();
  });

  test.skip('should list all available options', async ({ page }) => {
    test.skip();
  });

  test.skip('should update value on option selection', async ({ page }) => {
    test.skip();
  });

  test.skip('should commit on Enter key', async ({ page }) => {
    test.skip();
  });

  test.skip('should cancel on Escape key', async ({ page }) => {
    test.skip();
  });

  test.skip('should support keyboard navigation through options', async ({ page }) => {
    test.skip();
  });

  test.skip('should support search/filter in dropdown', async ({ page }) => {
    test.skip();
  });

  test.skip('should support option groups', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle empty selection', async ({ page }) => {
    test.skip();
  });
});
