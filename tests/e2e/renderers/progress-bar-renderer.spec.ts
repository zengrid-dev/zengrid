import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';

test.describe('Progress Bar Renderer', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should render progress bar for values 0-1', async ({ page }) => {
    await gridPage.setData([[0, 0.5, 1.0]]);

    const cell = await gridPage.getCell(0, 1);
    const progressBar = cell.locator('.zg-progress-bar, [role="progressbar"]');
    await expect(progressBar).toBeVisible();
  });

  test.skip('should render 0% for value 0', async ({ page }) => {
    await gridPage.setData([[0]]);

    test.skip();
  });

  test.skip('should render 100% for value 1', async ({ page }) => {
    await gridPage.setData([[1]]);

    test.skip();
  });

  test.skip('should render 50% for value 0.5', async ({ page }) => {
    await gridPage.setData([[0.5]]);

    test.skip();
  });

  test.skip('should clamp values outside 0-1 range', async ({ page }) => {
    await gridPage.setData([[-0.5, 1.5]]);

    test.skip();
  });

  test.skip('should show percentage text if configured', async ({ page }) => {
    test.skip();
  });

  test.skip('should apply custom color for progress bar', async ({ page }) => {
    test.skip();
  });

  test.skip('should animate progress bar changes', async ({ page }) => {
    await gridPage.setData([[0.3]]);
    await gridPage.setData([[0.8]]);

    test.skip();
  });

  test.skip('should have accessible ARIA attributes', async ({ page }) => {
    await gridPage.setData([[0.75]]);

    const cell = await gridPage.getCell(0, 0);
    const progressBar = cell.locator('[role="progressbar"]');

    const ariaValueNow = await progressBar.getAttribute('aria-valuenow');
    expect(ariaValueNow).toBeTruthy();
  });
});
