import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';
import { EventListener } from '../../fixtures/event-helpers';

test.describe('Cell Events', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should fire cell:click event on cell click', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    const listener = new EventListener(page);
    await listener.start(['cell:click']);

    await gridPage.clickCell(2, 2);

    const fired = await listener.assertEventFired('cell:click');
    expect(fired).toBe(true);

    await listener.stop();
  });

  test.skip('should fire cell:doubleClick event on double-click', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire cell:contextMenu event on right-click', async ({ page }) => {
    test.skip();
  });

  test.skip('should pass cell coordinates in event data', async ({ page }) => {
    test.skip();
  });

  test.skip('should pass cell value in event data', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire cell:mouseEnter event', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire cell:mouseLeave event', async ({ page }) => {
    test.skip();
  });
});
