import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';

test.describe('Checkbox Renderer', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should render checked checkbox for true values', async ({ page }) => {
    await gridPage.setData([[true, false, true]]);

    const cell = await gridPage.getCell(0, 0);
    const checkbox = cell.locator('input[type="checkbox"]');
    await expect(checkbox).toBeChecked();
  });

  test.skip('should render unchecked checkbox for false values', async ({ page }) => {
    await gridPage.setData([[false]]);

    const cell = await gridPage.getCell(0, 0);
    const checkbox = cell.locator('input[type="checkbox"]');
    await expect(checkbox).not.toBeChecked();
  });

  test.skip('should toggle checkbox on click', async ({ page }) => {
    await gridPage.setData([[false]]);

    const cell = await gridPage.getCell(0, 0);
    const checkbox = cell.locator('input[type="checkbox"]');

    await checkbox.click();

    await expect(checkbox).toBeChecked();
  });

  test.skip('should render readonly checkbox if cell is readonly', async ({ page }) => {
    test.skip();
  });

  test.skip('should center-align checkbox by default', async ({ page }) => {
    await gridPage.setData([[true]]);

    const cell = await gridPage.getCell(0, 0);
    const textAlign = await cell.evaluate(el => getComputedStyle(el).textAlign);

    expect(textAlign).toBe('center');
  });

  test.skip('should handle null/undefined as unchecked', async ({ page }) => {
    await gridPage.setData([[null, undefined]]);

    const cell1 = await gridPage.getCell(0, 0);
    const checkbox1 = cell1.locator('input[type="checkbox"]');
    await expect(checkbox1).not.toBeChecked();
  });

  test.skip('should fire change event on toggle', async ({ page }) => {
    test.skip();
  });

  test.skip('should update data when checkbox toggled', async ({ page }) => {
    await gridPage.setData([[false]]);

    const cell = await gridPage.getCell(0, 0);
    const checkbox = cell.locator('input[type="checkbox"]');

    await checkbox.click();

    const data = await gridPage.getData();
    expect(data[0][0]).toBe(true);
  });

  test.skip('should support keyboard toggle with Space', async ({ page }) => {
    await gridPage.setData([[false]]);

    await gridPage.clickCell(0, 0);
    await gridPage.pressKey('Space');

    const cell = await gridPage.getCell(0, 0);
    const checkbox = cell.locator('input[type="checkbox"]');
    await expect(checkbox).toBeChecked();
  });

  test.skip('should have accessible ARIA attributes', async ({ page }) => {
    await gridPage.setData([[true]]);

    const cell = await gridPage.getCell(0, 0);
    const checkbox = cell.locator('input[type="checkbox"]');

    const role = await checkbox.getAttribute('role');
    expect(role).toBeTruthy();
  });
});
