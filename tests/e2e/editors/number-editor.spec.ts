import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';

test.describe('Number Editor', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should open number editor on double-click', async ({ page }) => {
    await gridPage.setData([[1, 2, 3]]);

    await gridPage.doubleClickCell(0, 0);

    const cell = await gridPage.getCell(0, 0);
    const input = cell.locator('input[type="number"]');
    await expect(input).toBeVisible();
  });

  test.skip('should accept valid integer input', async ({ page }) => {
    await gridPage.setData([[10]]);

    await gridPage.editCell(0, 0, '42');

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBe('42');
  });

  test.skip('should accept valid decimal input', async ({ page }) => {
    await gridPage.setData([[1.5]]);

    await gridPage.editCell(0, 0, '3.14');

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toContain('3.14');
  });

  test.skip('should accept negative numbers', async ({ page }) => {
    await gridPage.setData([[5]]);

    await gridPage.editCell(0, 0, '-10');

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toContain('-10');
  });

  test.skip('should reject non-numeric input', async ({ page }) => {
    await gridPage.setData([[10]]);

    await gridPage.startEdit(0, 0);

    const cell = await gridPage.getCell(0, 0);
    const input = cell.locator('input[type="number"]');
    await input.fill('abc');
    await input.press('Enter');

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBe('10');
  });

  test.skip('should enforce min value constraint', async ({ page }) => {
    test.skip();
  });

  test.skip('should enforce max value constraint', async ({ page }) => {
    test.skip();
  });

  test.skip('should enforce step constraint', async ({ page }) => {
    test.skip();
  });

  test.skip('should support increment/decrement with arrow keys', async ({ page }) => {
    test.skip();
  });

  test.skip('should format number on commit', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle empty input as null or 0', async ({ page }) => {
    test.skip();
  });

  test.skip('should show validation error for invalid numbers', async ({ page }) => {
    test.skip();
  });
});
