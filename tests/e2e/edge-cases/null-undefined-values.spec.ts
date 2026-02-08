import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNullData } from '../../fixtures/test-data';

test.describe('Null and Undefined Values', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should render null values as empty cells', async ({ page }) => {
    await gridPage.setData([[null, 'text', null]]);

    const nullCell = await gridPage.getCellValue(0, 0);
    expect(nullCell).toBe('');
  });

  test.skip('should render undefined values as empty cells', async ({ page }) => {
    await gridPage.setData([[undefined, 'text', undefined]]);

    const undefinedCell = await gridPage.getCellValue(0, 0);
    expect(undefinedCell).toBe('');
  });

  test.skip('should handle mixed null/undefined/values', async ({ page }) => {
    await gridPage.setData(generateNullData(10, 5, 0.5));

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(10);
  });

  test.skip('should handle row of all nulls', async ({ page }) => {
    await gridPage.setData([[null, null, null]]);

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(1);
  });

  test.skip('should handle editing null cell', async ({ page }) => {
    await gridPage.setData([[null]]);

    await gridPage.editCell(0, 0, 'new value');

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBe('new value');
  });

  test.skip('should handle sorting with null values', async ({ page }) => {
    await gridPage.setData([[3], [null], [1], [null], [2]]);

    await gridPage.sortByColumn(0);

    // Nulls should go to end
  });

  test.skip('should handle filtering with null values', async ({ page }) => {
    await gridPage.setData([[null], ['text'], [null], ['more']]);

    await gridPage.setFilter(0, 'notBlank', '');

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(2);
  });

  test.skip('should handle copy/paste of null cells', async ({ page }) => {
    await gridPage.setData([[null, 'text']]);

    await gridPage.selectCell(0, 0);
    await gridPage.copy();

    // Should not crash
  });

  test.skip('should allow setting cell to null', async ({ page }) => {
    await gridPage.setData([['value']]);

    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.updateCells([{ row: 0, col: 0, value: null }]);
    });

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBe('');
  });

  test.skip('should handle null in different renderers', async ({ page }) => {
    await gridPage.setData([
      [null, null, null, null]
    ]);

    // Number renderer
    const numberCell = await gridPage.getCellValue(0, 0);
    expect(numberCell).toBe('');
  });
});
