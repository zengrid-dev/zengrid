import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';

test.describe('Image Renderer', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should render image from URL', async ({ page }) => {
    await gridPage.setData([['https://via.placeholder.com/50']]);

    const cell = await gridPage.getCell(0, 0);
    const img = cell.locator('img');
    await expect(img).toBeVisible();
  });

  test.skip('should set correct src attribute', async ({ page }) => {
    const url = 'https://via.placeholder.com/50';
    await gridPage.setData([[url]]);

    const cell = await gridPage.getCell(0, 0);
    const img = cell.locator('img');
    const src = await img.getAttribute('src');

    expect(src).toBe(url);
  });

  test.skip('should set alt text', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle image load errors', async ({ page }) => {
    await gridPage.setData([['https://invalid-url.com/image.png']]);

    test.skip();
  });

  test.skip('should display placeholder while loading', async ({ page }) => {
    test.skip();
  });

  test.skip('should constrain image to cell size', async ({ page }) => {
    await gridPage.setData([['https://via.placeholder.com/200']]);

    const cell = await gridPage.getCell(0, 0);
    const img = cell.locator('img');
    const imgBox = await img.boundingBox();
    const cellBox = await cell.boundingBox();

    expect(imgBox!.width).toBeLessThanOrEqual(cellBox!.width);
  });

  test.skip('should support custom image sizing', async ({ page }) => {
    test.skip();
  });

  test.skip('should support lazy loading', async ({ page }) => {
    test.skip();
  });

  test.skip('should support thumbnail with full-size preview on click', async ({ page }) => {
    test.skip();
  });
});
