import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';
import { EventListener } from '../../fixtures/event-helpers';

test.describe('Header Events', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should fire header:click event on header click', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire header:doubleClick event on double-click', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire header:contextMenu event on right-click', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire header:sort:click event on sort indicator click', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire header:filter:click event on filter indicator click', async ({ page }) => {
    test.skip();
  });

  test.skip('should pass column index in event data', async ({ page }) => {
    test.skip();
  });
});
