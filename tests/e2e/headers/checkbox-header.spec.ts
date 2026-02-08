import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';

test.describe('Checkbox Header', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should render checkbox in header', async ({ page }) => {
    test.skip();
  });

  test.skip('should select all rows when checked', async ({ page }) => {
    test.skip();
  });

  test.skip('should deselect all rows when unchecked', async ({ page }) => {
    test.skip();
  });

  test.skip('should show indeterminate state when some rows selected', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire header:checkbox:change event', async ({ page }) => {
    test.skip();
  });

  test.skip('should support keyboard toggle with Space', async ({ page }) => {
    test.skip();
  });
});
