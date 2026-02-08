import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';

test.describe('Button Renderer', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should render button in cell', async ({ page }) => {
    await gridPage.setData([['Click Me', 'Action', 'Submit']]);

    const cell = await gridPage.getCell(0, 0);
    const button = cell.locator('button');
    await expect(button).toBeVisible();
  });

  test.skip('should display button text', async ({ page }) => {
    await gridPage.setData([['Click Me']]);

    const cell = await gridPage.getCell(0, 0);
    const button = cell.locator('button');
    await expect(button).toHaveText('Click Me');
  });

  test.skip('should trigger onClick handler when clicked', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire button:click event', async ({ page }) => {
    test.skip();
  });

  test.skip('should apply custom button styles', async ({ page }) => {
    test.skip();
  });

  test.skip('should support disabled state', async ({ page }) => {
    test.skip();
  });

  test.skip('should show hover state', async ({ page }) => {
    await gridPage.setData([['Hover Me']]);

    const cell = await gridPage.getCell(0, 0);
    const button = cell.locator('button');
    await button.hover();

    test.skip();
  });

  test.skip('should be keyboard accessible', async ({ page }) => {
    await gridPage.setData([['Press Me']]);

    await gridPage.clickCell(0, 0);
    await gridPage.pressKey('Tab');

    const cell = await gridPage.getCell(0, 0);
    const button = cell.locator('button');
    await expect(button).toBeFocused();
  });

  test.skip('should support Enter key activation', async ({ page }) => {
    test.skip();
  });

  test.skip('should support Space key activation', async ({ page }) => {
    test.skip();
  });

  test.skip('should render icon button if configured', async ({ page }) => {
    test.skip();
  });
});
