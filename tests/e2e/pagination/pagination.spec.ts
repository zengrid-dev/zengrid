import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';
import { expectPaginationState } from '../../fixtures/helpers';

test.describe('Pagination', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should navigate to next page', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    await gridPage.nextPage();

    await expectPaginationState(page, 2, 10, 10);
  });

  test.skip('should navigate to previous page', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    await gridPage.nextPage();
    await gridPage.previousPage();

    await expectPaginationState(page, 1, 10, 10);
  });

  test.skip('should navigate to specific page', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    await gridPage.goToPage(5);

    await expectPaginationState(page, 5, 10, 10);
  });

  test.skip('should change page size', async ({ page }) => {
    test.skip();
  });

  test.skip('should display page indicator (current/total)', async ({ page }) => {
    test.skip();
  });

  test.skip('should disable previous on first page', async ({ page }) => {
    test.skip();
  });

  test.skip('should disable next on last page', async ({ page }) => {
    test.skip();
  });

  test.skip('should navigate to first page', async ({ page }) => {
    test.skip();
  });

  test.skip('should navigate to last page', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle out-of-range page number', async ({ page }) => {
    test.skip();
  });

  test.skip('should maintain selection across pages', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire page:change event', async ({ page }) => {
    test.skip();
  });
});
