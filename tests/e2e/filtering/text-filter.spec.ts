import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateFilterableData } from '../../fixtures/test-data';
import { expectFilterActive } from '../../fixtures/helpers';

test.describe('Text Filter', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should filter rows containing text', async ({ page }) => {
    await gridPage.setData(generateFilterableData(100));

    await gridPage.setFilter(0, 'contains', 'Item 5');

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBeLessThan(100);
  });

  test.skip('should support equals operator', async ({ page }) => {
    test.skip();
  });

  test.skip('should support notEquals operator', async ({ page }) => {
    test.skip();
  });

  test.skip('should support contains operator', async ({ page }) => {
    test.skip();
  });

  test.skip('should support notContains operator', async ({ page }) => {
    test.skip();
  });

  test.skip('should support startsWith operator', async ({ page }) => {
    test.skip();
  });

  test.skip('should support endsWith operator', async ({ page }) => {
    test.skip();
  });

  test.skip('should support blank operator', async ({ page }) => {
    test.skip();
  });

  test.skip('should support notBlank operator', async ({ page }) => {
    test.skip();
  });

  test.skip('should be case-insensitive by default', async ({ page }) => {
    test.skip();
  });

  test.skip('should support case-sensitive filtering', async ({ page }) => {
    test.skip();
  });

  test.skip('should display filter indicator on filtered column', async ({ page }) => {
    await gridPage.setData(generateFilterableData(100));

    await gridPage.setFilter(0, 'contains', 'Item 5');

    await expectFilterActive(page, 0);
  });

  test.skip('should fire filter:change event', async ({ page }) => {
    test.skip();
  });

  test.skip('should clear filter', async ({ page }) => {
    await gridPage.setData(generateFilterableData(100));

    await gridPage.setFilter(0, 'contains', 'Item 5');
    await gridPage.clearFilters();

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(100);
  });
});
