import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';

test.describe('Link Renderer', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should render URL as clickable link', async ({ page }) => {
    await gridPage.setData([['https://example.com', 'https://google.com']]);

    const cell = await gridPage.getCell(0, 0);
    const link = cell.locator('a');
    await expect(link).toBeVisible();
  });

  test.skip('should set correct href attribute', async ({ page }) => {
    await gridPage.setData([['https://example.com']]);

    const cell = await gridPage.getCell(0, 0);
    const link = cell.locator('a');
    const href = await link.getAttribute('href');

    expect(href).toBe('https://example.com');
  });

  test.skip('should open link in new tab by default', async ({ page }) => {
    await gridPage.setData([['https://example.com']]);

    const cell = await gridPage.getCell(0, 0);
    const link = cell.locator('a');
    const target = await link.getAttribute('target');

    expect(target).toBe('_blank');
  });

  test.skip('should have rel="noopener noreferrer" for security', async ({ page }) => {
    await gridPage.setData([['https://example.com']]);

    const cell = await gridPage.getCell(0, 0);
    const link = cell.locator('a');
    const rel = await link.getAttribute('rel');

    expect(rel).toContain('noopener');
  });

  test.skip('should display custom text if configured', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle mailto: links', async ({ page }) => {
    await gridPage.setData([['mailto:test@example.com']]);

    const cell = await gridPage.getCell(0, 0);
    const link = cell.locator('a');
    const href = await link.getAttribute('href');

    expect(href).toContain('mailto:');
  });

  test.skip('should handle tel: links', async ({ page }) => {
    await gridPage.setData([['tel:+1234567890']]);

    test.skip();
  });

  test.skip('should apply link styling', async ({ page }) => {
    await gridPage.setData([['https://example.com']]);

    const cell = await gridPage.getCell(0, 0);
    const link = cell.locator('a');
    const color = await link.evaluate(el => getComputedStyle(el).color);

    expect(color).toBeTruthy();
  });

  test.skip('should show hover state', async ({ page }) => {
    await gridPage.setData([['https://example.com']]);

    const cell = await gridPage.getCell(0, 0);
    const link = cell.locator('a');

    await link.hover();

    test.skip();
  });

  test.skip('should be keyboard navigable', async ({ page }) => {
    await gridPage.setData([['https://example.com']]);

    await gridPage.clickCell(0, 0);
    await gridPage.pressKey('Tab');

    const cell = await gridPage.getCell(0, 0);
    const link = cell.locator('a');
    await expect(link).toBeFocused();
  });
});
