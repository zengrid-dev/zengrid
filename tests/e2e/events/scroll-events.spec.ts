import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';
import { EventListener } from '../../fixtures/event-helpers';

test.describe('Scroll Events', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should fire scroll event during scroll', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire scroll:start event when scroll begins', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire scroll:end event when scroll ends', async ({ page }) => {
    test.skip();
  });

  test.skip('should pass scroll position in event data', async ({ page }) => {
    test.skip();
  });

  test.skip('should throttle scroll events', async ({ page }) => {
    test.skip();
  });
});
