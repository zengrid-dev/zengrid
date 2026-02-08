import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';

test.describe('Sliding Window', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should limit rows in memory with windowSize', async ({ page }) => {
    test.skip();
  });

  test.skip('should prune old rows when threshold reached', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire onDataPruned callback', async ({ page }) => {
    test.skip();
  });

  test.skip('should return stats with getSlidingWindowStats()', async ({ page }) => {
    test.skip();
  });

  test.skip('should reload pruned data on scroll back', async ({ page }) => {
    test.skip();
  });

  test.skip('should maintain scroll position during pruning', async ({ page }) => {
    test.skip();
  });
});
