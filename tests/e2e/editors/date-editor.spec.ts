import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';

test.describe('Date Editor', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should open date picker on double-click', async ({ page }) => {
    await gridPage.setData([[new Date('2024-01-15')]]);

    await gridPage.doubleClickCell(0, 0);

    const cell = await gridPage.getCell(0, 0);
    const datePicker = cell.locator('input[type="date"], .date-picker');
    await expect(datePicker).toBeVisible();
  });

  test.skip('should display current date value', async ({ page }) => {
    test.skip();
  });

  test.skip('should allow date selection from calendar', async ({ page }) => {
    test.skip();
  });

  test.skip('should support keyboard input', async ({ page }) => {
    test.skip();
  });

  test.skip('should validate date format', async ({ page }) => {
    test.skip();
  });

  test.skip('should enforce min date constraint', async ({ page }) => {
    test.skip();
  });

  test.skip('should enforce max date constraint', async ({ page }) => {
    test.skip();
  });

  test.skip('should commit on date selection', async ({ page }) => {
    test.skip();
  });

  test.skip('should cancel on Escape key', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle empty/null dates', async ({ page }) => {
    test.skip();
  });
});
