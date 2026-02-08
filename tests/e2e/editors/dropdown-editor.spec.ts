import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';

test.describe('Dropdown Editor', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should open dropdown on double-click', async ({ page }) => {
    await gridPage.setData([['Item A']]);

    await gridPage.doubleClickCell(0, 0);

    test.skip();
  });

  test.skip('should display current value', async ({ page }) => {
    test.skip();
  });

  test.skip('should list all available options', async ({ page }) => {
    test.skip();
  });

  test.skip('should filter options on typing', async ({ page }) => {
    test.skip();
  });

  test.skip('should support keyboard navigation', async ({ page }) => {
    test.skip();
  });

  test.skip('should commit on Enter key', async ({ page }) => {
    test.skip();
  });

  test.skip('should cancel on Escape key', async ({ page }) => {
    test.skip();
  });

  test.skip('should support custom option rendering', async ({ page }) => {
    test.skip();
  });

  test.skip('should support option grouping', async ({ page }) => {
    test.skip();
  });
});
