import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateFilterableData } from '../../fixtures/test-data';

test.describe('Number Filter', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should filter with equals operator', async ({ page }) => {
    test.skip();
  });

  test.skip('should filter with notEquals operator', async ({ page }) => {
    test.skip();
  });

  test.skip('should filter with greaterThan operator', async ({ page }) => {
    test.skip();
  });

  test.skip('should filter with lessThan operator', async ({ page }) => {
    test.skip();
  });

  test.skip('should filter with greaterThanOrEqual operator', async ({ page }) => {
    test.skip();
  });

  test.skip('should filter with lessThanOrEqual operator', async ({ page }) => {
    test.skip();
  });

  test.skip('should filter with between operator', async ({ page }) => {
    test.skip();
  });

  test.skip('should filter with in operator', async ({ page }) => {
    test.skip();
  });

  test.skip('should filter with notIn operator', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle decimal numbers in filter', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle negative numbers in filter', async ({ page }) => {
    test.skip();
  });
});
