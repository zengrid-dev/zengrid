import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';

test.describe('Select Renderer', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should render selected option text', async ({ page }) => {
    await gridPage.setData([['Option A', 'Option B', 'Option C']]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBe('Option A');
  });

  test.skip('should display dropdown on click', async ({ page }) => {
    test.skip();
  });

  test.skip('should list all available options', async ({ page }) => {
    test.skip();
  });

  test.skip('should update value when option selected', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle empty/null selection', async ({ page }) => {
    await gridPage.setData([[null]]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBe('');
  });

  test.skip('should support custom option labels', async ({ page }) => {
    test.skip();
  });

  test.skip('should support option grouping', async ({ page }) => {
    test.skip();
  });

  test.skip('should support search/filter in dropdown', async ({ page }) => {
    test.skip();
  });

  test.skip('should close dropdown on selection', async ({ page }) => {
    test.skip();
  });

  test.skip('should support keyboard navigation in dropdown', async ({ page }) => {
    test.skip();
  });
});
