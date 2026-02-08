import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';
import { expectCellSelected, expectCellNotSelected } from '../../fixtures/helpers';

test.describe('Selection', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should select single cell on click', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    await gridPage.selectCell(2, 2);

    await expectCellSelected(page, 2, 2);
  });

  test.skip('should deselect previous cell when selecting new cell', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    await gridPage.selectCell(1, 1);
    await gridPage.selectCell(3, 3);

    await expectCellNotSelected(page, 1, 1);
    await expectCellSelected(page, 3, 3);
  });

  test.skip('should select range with Shift+click', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    await gridPage.selectRange(1, 1, 3, 3);

    test.skip();
  });

  test.skip('should add to selection with Ctrl+click', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    await gridPage.selectMultiple([
      { row: 1, col: 1 },
      { row: 3, col: 3 },
      { row: 5, col: 5 }
    ]);

    test.skip();
  });

  test.skip('should select range by dragging', async ({ page }) => {
    test.skip();
  });

  test.skip('should move selection with arrow keys', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    await gridPage.selectCell(2, 2);
    await gridPage.pressKey('ArrowRight');

    await expectCellSelected(page, 2, 3);
  });

  test.skip('should select all with Ctrl+A', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    await gridPage.selectAll();

    test.skip();
  });

  test.skip('should deselect with Escape', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    await gridPage.selectCell(2, 2);
    await gridPage.pressKey('Escape');

    await expectCellNotSelected(page, 2, 2);
  });

  test.skip('should fire selection:change event', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire selection:start event', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire selection:end event', async ({ page }) => {
    test.skip();
  });

  test.skip('should display selection overlay', async ({ page }) => {
    test.skip();
  });

  test.skip('should support row selection mode', async ({ page }) => {
    test.skip();
  });

  test.skip('should support column selection mode', async ({ page }) => {
    test.skip();
  });

  test.skip('should maintain selection during scroll', async ({ page }) => {
    test.skip();
  });
});
