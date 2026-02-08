import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';

test.describe('Date Range Editor', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should open date range picker on double-click', async ({ page }) => {
    const dateRange = { start: new Date('2024-01-01'), end: new Date('2024-01-31') };
    await gridPage.setData([[dateRange]]);

    await gridPage.doubleClickCell(0, 0);

    test.skip();
  });

  test.skip('should display current date range', async ({ page }) => {
    test.skip();
  });

  test.skip('should allow start date selection', async ({ page }) => {
    test.skip();
  });

  test.skip('should allow end date selection', async ({ page }) => {
    test.skip();
  });

  test.skip('should validate end date is after start date', async ({ page }) => {
    test.skip();
  });

  test.skip('should support quick date range presets', async ({ page }) => {
    test.skip();
  });

  test.skip('should commit on date range selection', async ({ page }) => {
    test.skip();
  });

  test.skip('should cancel on Escape key', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle partial date ranges', async ({ page }) => {
    test.skip();
  });
});
