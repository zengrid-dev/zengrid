import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';
import { EventListener } from '../../fixtures/event-helpers';

test.describe('Selection Events', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should fire selection:change event when selection changes', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire selection:start event when selection begins', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire selection:end event when selection ends', async ({ page }) => {
    test.skip();
  });

  test.skip('should pass selection range in event data', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire events in correct order', async ({ page }) => {
    test.skip();
  });
});
