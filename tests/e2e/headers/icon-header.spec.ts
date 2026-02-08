import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';

test.describe('Icon Header', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should render leading icon', async ({ page }) => {
    test.skip();
  });

  test.skip('should render trailing icon', async ({ page }) => {
    test.skip();
  });

  test.skip('should render icon-only header', async ({ page }) => {
    test.skip();
  });

  test.skip('should support custom icon components', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire icon:click event', async ({ page }) => {
    test.skip();
  });
});
