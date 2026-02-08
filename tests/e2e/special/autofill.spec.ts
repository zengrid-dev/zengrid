import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateSequentialData } from '../../fixtures/test-data';

test.describe('Autofill', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should drag fill handle to copy values', async ({ page }) => {
    test.skip();
  });

  test.skip('should detect numeric sequence pattern (1, 2, 3)', async ({ page }) => {
    test.skip();
  });

  test.skip('should detect date sequence pattern', async ({ page }) => {
    test.skip();
  });

  test.skip('should detect text pattern (Day 1, Day 2)', async ({ page }) => {
    test.skip();
  });

  test.skip('should copy formula with relative references', async ({ page }) => {
    test.skip();
  });

  test.skip('should show fill handle on selection', async ({ page }) => {
    test.skip();
  });

  test.skip('should autofill horizontally', async ({ page }) => {
    test.skip();
  });

  test.skip('should autofill vertically', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire autofill event', async ({ page }) => {
    test.skip();
  });
});
