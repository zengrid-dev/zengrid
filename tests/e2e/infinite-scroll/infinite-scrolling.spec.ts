import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';

test.describe('Infinite Scrolling', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should fire onLoadMoreRows when near bottom', async ({ page }) => {
    test.skip();
  });

  test.skip('should respect threshold option for trigger point', async ({ page }) => {
    test.skip();
  });

  test.skip('should append new rows without scroll jump', async ({ page }) => {
    test.skip();
  });

  test.skip('should show loading indicator while loading', async ({ page }) => {
    test.skip();
  });

  test.skip('should prevent duplicate load requests', async ({ page }) => {
    test.skip();
  });

  test.skip('should reset with resetInfiniteScrolling()', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle load errors gracefully', async ({ page }) => {
    test.skip();
  });

  test.skip('should support bidirectional infinite scroll', async ({ page }) => {
    test.skip();
  });
});
