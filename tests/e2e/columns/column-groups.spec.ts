import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';

test.describe('Column Groups', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should render column group header', async ({ page }) => {
    test.skip();
  });

  test.skip('should span group header across child columns', async ({ page }) => {
    test.skip();
  });

  test.skip('should collapse column group', async ({ page }) => {
    test.skip();
  });

  test.skip('should expand column group', async ({ page }) => {
    test.skip();
  });

  test.skip('should hide child columns when group collapsed', async ({ page }) => {
    test.skip();
  });

  test.skip('should show child columns when group expanded', async ({ page }) => {
    test.skip();
  });

  test.skip('should support nested column groups', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire group:collapse event', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire group:expand event', async ({ page }) => {
    test.skip();
  });
});
