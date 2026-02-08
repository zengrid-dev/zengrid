import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';

test.describe('Cell Overflow Modes', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should clip overflow with overflow-clip mode', async ({ page }) => {
    test.skip();
  });

  test.skip('should show ellipsis with overflow-ellipsis mode', async ({ page }) => {
    test.skip();
  });

  test.skip('should wrap text with overflow-wrap mode', async ({ page }) => {
    test.skip();
  });

  test.skip('should enable scrolling with overflow-scroll mode', async ({ page }) => {
    test.skip();
  });

  test.skip('should apply overflow mode per column', async ({ page }) => {
    test.skip();
  });
});
