import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';
import { EventListener } from '../../fixtures/event-helpers';

test.describe('Clipboard Events', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should fire copy event on Ctrl+C', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire cut event on Ctrl+X', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire paste event on Ctrl+V', async ({ page }) => {
    test.skip();
  });

  test.skip('should pass clipboard data in event', async ({ page }) => {
    test.skip();
  });

  test.skip('should allow preventing default clipboard behavior', async ({ page }) => {
    test.skip();
  });
});
