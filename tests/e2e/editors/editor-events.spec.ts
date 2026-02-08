import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { EventListener } from '../../fixtures/event-helpers';

test.describe('Editor Events', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should fire edit:start when editing begins', async ({ page }) => {
    await gridPage.setData([['test']]);

    const listener = new EventListener(page);
    await listener.start(['edit:start']);

    await gridPage.doubleClickCell(0, 0);

    const fired = await listener.assertEventFired('edit:start');
    expect(fired).toBe(true);

    await listener.stop();
  });

  test.skip('should fire edit:end when editing ends', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire edit:commit when edit is saved', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire edit:cancel when edit is cancelled', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire cell:beforeChange before value changes', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire cell:change after value changes', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire cell:afterChange after change completes', async ({ page }) => {
    test.skip();
  });

  test.skip('should allow cell:beforeChange to cancel edit', async ({ page }) => {
    test.skip();
  });

  test.skip('should pass correct event data for edit:start', async ({ page }) => {
    test.skip();
  });

  test.skip('should pass correct event data for edit:commit', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire events in correct order', async ({ page }) => {
    await gridPage.setData([['test']]);

    const listener = new EventListener(page);
    await listener.start(['edit:start', 'cell:beforeChange', 'cell:change', 'edit:commit', 'edit:end']);

    await gridPage.editCell(0, 0, 'updated');

    const order = await listener.assertEventOrder([
      'edit:start',
      'cell:beforeChange',
      'cell:change',
      'edit:commit',
      'edit:end'
    ]);

    expect(order).toBe(true);

    await listener.stop();
  });
});
