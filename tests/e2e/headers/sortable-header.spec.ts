import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateSortableData } from '../../fixtures/test-data';

test.describe('Sortable Header', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should display sort indicator', async ({ page }) => {
    test.skip();
  });

  test.skip('should show sort direction (asc/desc)', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire header:sort:click event', async ({ page }) => {
    test.skip();
  });

  test.skip('should toggle sort on header click', async ({ page }) => {
    test.skip();
  });

  test.skip('should display sort priority in multi-sort', async ({ page }) => {
    test.skip();
  });

  test.skip('should show hover state on sortable header', async ({ page }) => {
    test.skip();
  });
});
