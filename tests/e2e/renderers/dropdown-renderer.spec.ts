import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';

test.describe('Dropdown Renderer', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should render selected value', async ({ page }) => {
    await gridPage.setData([['Item A', 'Item B']]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBe('Item A');
  });

  test.skip('should show dropdown icon', async ({ page }) => {
    test.skip();
  });

  test.skip('should open dropdown menu on click', async ({ page }) => {
    test.skip();
  });

  test.skip('should list all available options in dropdown', async ({ page }) => {
    test.skip();
  });

  test.skip('should update value on option selection', async ({ page }) => {
    test.skip();
  });

  test.skip('should close dropdown after selection', async ({ page }) => {
    test.skip();
  });

  test.skip('should support search/autocomplete in dropdown', async ({ page }) => {
    test.skip();
  });

  test.skip('should support keyboard navigation', async ({ page }) => {
    test.skip();
  });

  test.skip('should support option grouping', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle empty selection', async ({ page }) => {
    await gridPage.setData([[null]]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBe('');
  });
});
