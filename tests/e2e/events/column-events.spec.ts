import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';
import { EventListener } from '../../fixtures/event-helpers';

test.describe('Column Events', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should fire column:resize event after resize', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire column:move event after reorder', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire column:hide event when column hidden', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire column:show event when column shown', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire column:dragStart event', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire column:drag event during drag', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire column:dragEnd event', async ({ page }) => {
    test.skip();
  });

  test.skip('should pass column index in event data', async ({ page }) => {
    test.skip();
  });
});
