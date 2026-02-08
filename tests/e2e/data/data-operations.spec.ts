import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';

test.describe('Data Operations', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should set data with setData()', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(10);
  });

  test.skip('should get data with getData()', async ({ page }) => {
    const testData = generateNumericData({ rows: 5, cols: 3 });
    await gridPage.setData(testData);

    const retrievedData = await gridPage.getData();
    expect(retrievedData).toBeTruthy();
  });

  test.skip('should update specific cells with updateCells()', async ({ page }) => {
    test.skip();
  });

  test.skip('should refresh grid with refresh()', async ({ page }) => {
    test.skip();
  });

  test.skip('should clear cache with clearCache()', async ({ page }) => {
    test.skip();
  });

  test.skip('should add rows dynamically', async ({ page }) => {
    test.skip();
  });

  test.skip('should remove rows dynamically', async ({ page }) => {
    test.skip();
  });

  test.skip('should update row data', async ({ page }) => {
    test.skip();
  });
});
