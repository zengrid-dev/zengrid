import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';

test.describe('Chip Renderer', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should render single chip', async ({ page }) => {
    await gridPage.setData([[['Tag1']]]);

    const cell = await gridPage.getCell(0, 0);
    const chip = cell.locator('.zg-chip, .chip');
    await expect(chip).toBeVisible();
  });

  test.skip('should render multiple chips', async ({ page }) => {
    await gridPage.setData([[['Tag1', 'Tag2', 'Tag3']]]);

    const cell = await gridPage.getCell(0, 0);
    const chips = cell.locator('.zg-chip, .chip');
    const count = await chips.count();

    expect(count).toBe(3);
  });

  test.skip('should display chip text', async ({ page }) => {
    await gridPage.setData([[['Tag1']]]);

    const cell = await gridPage.getCell(0, 0);
    const chip = cell.locator('.zg-chip, .chip').first();
    await expect(chip).toHaveText('Tag1');
  });

  test.skip('should support chip colors', async ({ page }) => {
    test.skip();
  });

  test.skip('should support chip removal', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle empty chip array', async ({ page }) => {
    await gridPage.setData([[[]]]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBe('');
  });

  test.skip('should truncate long chip lists', async ({ page }) => {
    test.skip();
  });

  test.skip('should show "+N more" for truncated chips', async ({ page }) => {
    test.skip();
  });

  test.skip('should support custom chip styling', async ({ page }) => {
    test.skip();
  });

  test.skip('should support chip icons', async ({ page }) => {
    test.skip();
  });
});
