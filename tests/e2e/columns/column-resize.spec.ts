import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';
import { expectColumnWidth } from '../../fixtures/helpers';

test.describe('Column Resize', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should resize column by dragging resize handle', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    await gridPage.resizeColumn(0, 50);

    test.skip();
  });

  test.skip('should show resize cursor on hover over resize handle', async ({ page }) => {
    test.skip();
  });

  test.skip('should show visual preview during resize', async ({ page }) => {
    test.skip();
  });

  test.skip('should enforce min width constraint', async ({ page }) => {
    test.skip();
  });

  test.skip('should enforce max width constraint', async ({ page }) => {
    test.skip();
  });

  test.skip('should auto-fit column width on double-click', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire column:resize event after resize', async ({ page }) => {
    test.skip();
  });

  test.skip('should update adjacent column positions after resize', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    const initialWidth = await page.evaluate(() => {
      const header = document.querySelector('.zen-grid-header-cell:nth-child(2)');
      return header?.getBoundingClientRect().x;
    });

    await gridPage.resizeColumn(0, 50);

    const newWidth = await page.evaluate(() => {
      const header = document.querySelector('.zen-grid-header-cell:nth-child(2)');
      return header?.getBoundingClientRect().x;
    });

    expect(newWidth).toBeGreaterThan(initialWidth!);
  });

  test.skip('should support keyboard-based resizing', async ({ page }) => {
    test.skip();
  });

  test.skip('should maintain resize proportions with multiple columns', async ({ page }) => {
    test.skip();
  });
});
