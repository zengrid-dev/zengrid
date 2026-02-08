import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';

test.describe('Keyboard Navigation', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should navigate right with Arrow Right', async ({ page }) => {
    test.skip();
  });

  test.skip('should navigate left with Arrow Left', async ({ page }) => {
    test.skip();
  });

  test.skip('should navigate down with Arrow Down', async ({ page }) => {
    test.skip();
  });

  test.skip('should navigate up with Arrow Up', async ({ page }) => {
    test.skip();
  });

  test.skip('should navigate to first cell with Home', async ({ page }) => {
    test.skip();
  });

  test.skip('should navigate to last cell with End', async ({ page }) => {
    test.skip();
  });

  test.skip('should navigate to top with Ctrl+Home', async ({ page }) => {
    test.skip();
  });

  test.skip('should navigate to bottom with Ctrl+End', async ({ page }) => {
    test.skip();
  });

  test.skip('should page down with Page Down', async ({ page }) => {
    test.skip();
  });

  test.skip('should page up with Page Up', async ({ page }) => {
    test.skip();
  });

  test.skip('should extend selection with Shift+Arrow keys', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire keyboard events', async ({ page }) => {
    test.skip();
  });
});
