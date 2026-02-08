import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';

test.describe('Concurrent Operations Edge Cases', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should handle concurrent scroll and edit', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    await Promise.all([
      gridPage.scrollTo(5000),
      gridPage.editCell(50, 5, 'concurrent edit')
    ]);

    // Should handle both operations
  });

  test.skip('should handle concurrent sort and filter', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    await Promise.all([
      gridPage.sortByColumn(0),
      gridPage.setFilter(1, 'greaterThan', 500)
    ]);

    // Both operations should complete
  });

  test.skip('should handle concurrent data update and scroll', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    await Promise.all([
      gridPage.setData(generateNumericData({ rows: 2000, cols: 10 })),
      gridPage.scrollTo(10000)
    ]);

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(2000);
  });

  test.skip('should handle concurrent selection and copy', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 10 }));

    await Promise.all([
      gridPage.selectRange(10, 0, 20, 5),
      gridPage.copy()
    ]);

    // Should handle gracefully
  });

  test.skip('should handle concurrent undo and redo', async ({ page }) => {
    await gridPage.setData([['test']]);

    for (let i = 0; i < 5; i++) {
      await gridPage.editCell(0, 0, `edit-${i}`);
    }

    await Promise.all([
      gridPage.undo(),
      gridPage.redo()
    ]);

    // Should handle state correctly
  });

  test.skip('should handle concurrent column resize and scroll', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 20 }));

    await Promise.all([
      gridPage.resizeColumn(0, 100),
      gridPage.scrollTo(0, 500)
    ]);

    // Should handle both operations
  });

  test.skip('should handle concurrent filter changes', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    await Promise.all([
      gridPage.setFilter(0, 'greaterThan', 500),
      gridPage.setFilter(1, 'lessThan', 300),
      gridPage.setFilter(2, 'equals', 100)
    ]);

    // All filters should be applied
  });

  test.skip('should handle concurrent cell updates at different positions', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 10 }));

    await Promise.all([
      page.evaluate(() => {
        // @ts-ignore
        window.grid?.updateCells([{ row: 0, col: 0, value: 'A' }]);
      }),
      page.evaluate(() => {
        // @ts-ignore
        window.grid?.updateCells([{ row: 50, col: 5, value: 'B' }]);
      }),
      page.evaluate(() => {
        // @ts-ignore
        window.grid?.updateCells([{ row: 99, col: 9, value: 'C' }]);
      })
    ]);

    // All updates should complete
  });

  test.skip('should handle concurrent event emissions', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 10 }));

    await Promise.all([
      gridPage.clickCell(10, 5),
      gridPage.clickCell(20, 7),
      gridPage.clickCell(30, 3)
    ]);

    // All events should be handled
  });

  test.skip('should handle read during write operations', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    const results = await Promise.all([
      gridPage.setData(generateNumericData({ rows: 2000, cols: 10 })),
      gridPage.getData(),
      gridPage.getRowCount()
    ]);

    // Should handle read/write concurrency
  });

  test.skip('should handle concurrent viewport model updates', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 20 }));

    await Promise.all([
      page.setViewportSize({ width: 1024, height: 768 }),
      gridPage.scrollTo(5000, 500),
      gridPage.resizeColumn(0, 50)
    ]);

    // Should recalculate viewport correctly
  });

  test.skip('should handle race condition: rapid data replacement', async ({ page }) => {
    const operations = [];
    for (let i = 0; i < 10; i++) {
      operations.push(
        gridPage.setData(generateNumericData({ rows: 100, cols: 5, startRow: i * 100 }))
      );
    }

    await Promise.all(operations);

    // Last data should win
    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(100);
  });

  test.skip('should handle concurrent destroy and operations', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    await Promise.all([
      page.evaluate(() => {
        // @ts-ignore
        window.grid?.destroy?.();
      }),
      gridPage.scrollTo(1000).catch(() => {}),
      gridPage.editCell(0, 0, 'test').catch(() => {})
    ]);

    // Should handle gracefully without crashes
  });

  test.skip('should handle concurrent cache invalidations', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    await Promise.all([
      page.evaluate(() => {
        // @ts-ignore
        window.grid?.clearCache?.();
      }),
      gridPage.scrollTo(5000),
      page.evaluate(() => {
        // @ts-ignore
        window.grid?.refresh?.();
      })
    ]);

    // Should handle cache consistency
  });

  test.skip('should handle concurrent height updates', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    await Promise.all([
      page.evaluate(() => {
        // @ts-ignore
        window.grid?.updateRowHeight?.(10, 100);
      }),
      page.evaluate(() => {
        // @ts-ignore
        window.grid?.updateRowHeight?.(20, 150);
      }),
      page.evaluate(() => {
        // @ts-ignore
        window.grid?.updateRowHeight?.(30, 200);
      })
    ]);

    // All height updates should complete
  });
});
