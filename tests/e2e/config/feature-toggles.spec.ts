import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';

test.describe('Feature Toggles', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should enable/disable selection with enableSelection', async ({ page }) => {
    test.skip();
  });

  test.skip('should enable/disable multi-selection with enableMultiSelection', async ({ page }) => {
    test.skip();
  });

  test.skip('should enable/disable keyboard navigation with enableKeyboardNavigation', async ({ page }) => {
    test.skip();
  });

  test.skip('should enable/disable accessibility with enableA11y', async ({ page }) => {
    test.skip();
  });

  test.skip('should enable/disable cell pooling with enableCellPooling', async ({ page }) => {
    test.skip();
  });

  test.skip('should enable/disable column resize with enableColumnResize', async ({ page }) => {
    test.skip();
  });

  test.skip('should enable/disable column drag with enableColumnDrag', async ({ page }) => {
    test.skip();
  });

  test.skip('should enable/disable auto-resize with autoResize', async ({ page }) => {
    test.skip();
  });

  test.skip('should configure overscan rows', async ({ page }) => {
    test.skip();
  });

  test.skip('should configure overscan columns', async ({ page }) => {
    test.skip();
  });
});
