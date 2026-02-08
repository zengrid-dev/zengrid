import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';

test.describe('Checkbox Editor', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should toggle checkbox on click', async ({ page }) => {
    await gridPage.setData([[false]]);

    const cell = await gridPage.getCell(0, 0);
    const checkbox = cell.locator('input[type="checkbox"]');

    await checkbox.click();

    await expect(checkbox).toBeChecked();
  });

  test.skip('should toggle on Space key', async ({ page }) => {
    await gridPage.setData([[false]]);

    await gridPage.clickCell(0, 0);
    await gridPage.pressKey('Space');

    const cell = await gridPage.getCell(0, 0);
    const checkbox = cell.locator('input[type="checkbox"]');
    await expect(checkbox).toBeChecked();
  });

  test.skip('should update data when toggled', async ({ page }) => {
    await gridPage.setData([[false]]);

    const cell = await gridPage.getCell(0, 0);
    const checkbox = cell.locator('input[type="checkbox"]');
    await checkbox.click();

    const data = await gridPage.getData();
    expect(data[0][0]).toBe(true);
  });

  test.skip('should fire change event on toggle', async ({ page }) => {
    test.skip();
  });

  test.skip('should support readonly state', async ({ page }) => {
    test.skip();
  });

  test.skip('should support indeterminate state', async ({ page }) => {
    test.skip();
  });
});
