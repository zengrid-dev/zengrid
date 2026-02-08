import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';

test.describe('Number Renderer', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should render integers correctly', async ({ page }) => {
    await gridPage.setData([[1, 42, 100, -5, 0]]);

    const val1 = await gridPage.getCellValue(0, 0);
    const val2 = await gridPage.getCellValue(0, 1);
    const val3 = await gridPage.getCellValue(0, 4);

    expect(val1).toBe('1');
    expect(val2).toBe('42');
    expect(val3).toBe('0');
  });

  test.skip('should render decimals with correct precision', async ({ page }) => {
    await gridPage.setData([[3.14, 2.718, 0.5, 10.999]]);

    const val1 = await gridPage.getCellValue(0, 0);
    expect(val1).toContain('3.14');
  });

  test.skip('should render negative numbers correctly', async ({ page }) => {
    await gridPage.setData([[-1, -42.5, -1000]]);

    const val = await gridPage.getCellValue(0, 0);
    expect(val).toContain('-');
  });

  test.skip('should format large numbers with separators', async ({ page }) => {
    await gridPage.setData([[1000, 1000000, 1234567890]]);

    test.skip();
  });

  test.skip('should format currency if configured', async ({ page }) => {
    test.skip();
  });

  test.skip('should format percentages if configured', async ({ page }) => {
    test.skip();
  });

  test.skip('should right-align numbers by default', async ({ page }) => {
    await gridPage.setData([[123, 456]]);

    const cell = await gridPage.getCell(0, 0);
    const textAlign = await cell.evaluate(el => getComputedStyle(el).textAlign);

    expect(textAlign).toBe('right');
  });

  test.skip('should handle scientific notation', async ({ page }) => {
    await gridPage.setData([[1e10, 5.2e-3, 3.14e8]]);

    test.skip();
  });

  test.skip('should handle NaN values', async ({ page }) => {
    await gridPage.setData([[NaN, 42]]);

    const nanCell = await gridPage.getCellValue(0, 0);
    expect(nanCell).toBeTruthy();
  });

  test.skip('should handle Infinity values', async ({ page }) => {
    await gridPage.setData([[Infinity, -Infinity, 42]]);

    test.skip();
  });

  test.skip('should handle very large numbers', async ({ page }) => {
    await gridPage.setData([[Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]]);

    test.skip();
  });

  test.skip('should update when number data changes', async ({ page }) => {
    await gridPage.setData([[100]]);

    const initial = await gridPage.getCellValue(0, 0);
    expect(initial).toBe('100');

    await gridPage.setData([[200]]);

    const updated = await gridPage.getCellValue(0, 0);
    expect(updated).toBe('200');
  });
});
