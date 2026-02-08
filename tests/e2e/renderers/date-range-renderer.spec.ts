import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';

test.describe('Date Range Renderer', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should render date range with start and end dates', async ({ page }) => {
    const dateRange = { start: new Date('2024-01-01'), end: new Date('2024-01-31') };
    await gridPage.setData([[dateRange]]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toContain('2024');
  });

  test.skip('should render date range with separator', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle null start date', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle null end date', async ({ page }) => {
    test.skip();
  });

  test.skip('should render single-day range', async ({ page }) => {
    const dateRange = { start: new Date('2024-01-15'), end: new Date('2024-01-15') };
    await gridPage.setData([[dateRange]]);

    test.skip();
  });

  test.skip('should validate end date is after start date', async ({ page }) => {
    test.skip();
  });

  test.skip('should format dates according to locale', async ({ page }) => {
    test.skip();
  });

  test.skip('should display duration if configured', async ({ page }) => {
    test.skip();
  });

  test.skip('should update when date range changes', async ({ page }) => {
    const range1 = { start: new Date('2024-01-01'), end: new Date('2024-01-31') };
    await gridPage.setData([[range1]]);

    const range2 = { start: new Date('2024-02-01'), end: new Date('2024-02-28') };
    await gridPage.setData([[range2]]);

    test.skip();
  });
});
