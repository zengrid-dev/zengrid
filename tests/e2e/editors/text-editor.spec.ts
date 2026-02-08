import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateTextData } from '../../fixtures/test-data';
import { expectCellEditing } from '../../fixtures/helpers';

test.describe('Text Editor', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should open editor on double-click', async ({ page }) => {
    await gridPage.setData(generateTextData({ rows: 10, cols: 5 }));

    await gridPage.doubleClickCell(2, 2);

    await expectCellEditing(page, 2, 2);
  });

  test.skip('should open editor on Enter key', async ({ page }) => {
    await gridPage.setData(generateTextData({ rows: 10, cols: 5 }));

    await gridPage.clickCell(2, 2);
    await gridPage.pressKey('Enter');

    await expectCellEditing(page, 2, 2);
  });

  test.skip('should display current cell value in editor', async ({ page }) => {
    await gridPage.setData([['Initial Value']]);

    await gridPage.startEdit(0, 0);

    const cell = await gridPage.getCell(0, 0);
    const input = cell.locator('input, textarea').first();
    const value = await input.inputValue();

    expect(value).toBe('Initial Value');
  });

  test.skip('should commit edit on Enter key', async ({ page }) => {
    await gridPage.setData([['Old Value']]);

    await gridPage.editCell(0, 0, 'New Value');

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBe('New Value');
  });

  test.skip('should cancel edit on Escape key', async ({ page }) => {
    await gridPage.setData([['Original']]);

    await gridPage.startEdit(0, 0);

    const cell = await gridPage.getCell(0, 0);
    const input = cell.locator('input, textarea').first();
    await input.fill('Modified');

    await gridPage.cancelEdit();

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBe('Original');
  });

  test.skip('should commit edit on Tab key and move to next cell', async ({ page }) => {
    await gridPage.setData(generateTextData({ rows: 2, cols: 3 }));

    await gridPage.startEdit(0, 0);

    const cell = await gridPage.getCell(0, 0);
    const input = cell.locator('input, textarea').first();
    await input.fill('Updated');

    await gridPage.pressKey('Tab');

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBe('Updated');

    await expectCellEditing(page, 0, 1);
  });

  test.skip('should commit edit on click outside', async ({ page }) => {
    await gridPage.setData(generateTextData({ rows: 5, cols: 5 }));

    await gridPage.startEdit(1, 1);

    const cell = await gridPage.getCell(1, 1);
    const input = cell.locator('input, textarea').first();
    await input.fill('Changed');

    await gridPage.clickCell(3, 3);

    const cellValue = await gridPage.getCellValue(1, 1);
    expect(cellValue).toBe('Changed');
  });

  test.skip('should fire edit:start event when editing begins', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire edit:commit event when edit is saved', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire edit:cancel event when edit is cancelled', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire cell:beforeChange event before value changes', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire cell:change event after value changes', async ({ page }) => {
    test.skip();
  });

  test.skip('should allow cell:beforeChange to cancel edit', async ({ page }) => {
    test.skip();
  });

  test.skip('should support multiline text with textarea', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle special characters in edit', async ({ page }) => {
    await gridPage.setData([['test']]);

    await gridPage.editCell(0, 0, '<div>&nbsp;"quotes"</div>');

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toContain('<div>');
  });

  test.skip('should focus input when editor opens', async ({ page }) => {
    await gridPage.setData([['test']]);

    await gridPage.startEdit(0, 0);

    const cell = await gridPage.getCell(0, 0);
    const input = cell.locator('input, textarea').first();
    await expect(input).toBeFocused();
  });

  test.skip('should select all text when editor opens', async ({ page }) => {
    test.skip();
  });

  test.skip('should apply custom validation if configured', async ({ page }) => {
    test.skip();
  });

  test.skip('should show validation error for invalid input', async ({ page }) => {
    test.skip();
  });

  test.skip('should not commit invalid values', async ({ page }) => {
    test.skip();
  });
});
