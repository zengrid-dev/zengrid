import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';

test.describe('Rapid Updates Edge Cases', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should handle rapid data updates', async ({ page }) => {
    for (let i = 0; i < 50; i++) {
      await gridPage.setData(generateNumericData({ rows: 10, cols: 5, startRow: i }));
    }

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test.skip('should handle rapid cell edits', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    for (let i = 0; i < 20; i++) {
      await gridPage.editCell(i % 10, i % 5, `value-${i}`);
    }

    // Should not crash
  });

  test.skip('should handle rapid scrolling', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10000, cols: 10 }));

    for (let i = 0; i < 100; i++) {
      await gridPage.scrollTo(Math.random() * 100000);
    }

    // Should not crash or show blank areas
  });

  test.skip('should handle rapid selection changes', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 10 }));

    for (let i = 0; i < 50; i++) {
      await gridPage.selectCell(i % 100, i % 10);
    }

    // Should not crash
  });

  test.skip('should handle rapid sort toggles', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 5 }));

    for (let i = 0; i < 20; i++) {
      await gridPage.sortByColumn(i % 5);
    }

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(1000);
  });

  test.skip('should handle rapid filter changes', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 5 }));

    for (let i = 0; i < 20; i++) {
      await gridPage.setFilter(0, 'greaterThan', i * 10);
      await gridPage.clearFilters();
    }

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(1000);
  });

  test.skip('should handle rapid column resize', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    for (let i = 0; i < 20; i++) {
      await gridPage.resizeColumn(0, i % 2 === 0 ? 50 : -50);
    }

    // Should not crash
  });

  test.skip('should handle rapid undo/redo', async ({ page }) => {
    await gridPage.setData([['original']]);

    for (let i = 0; i < 20; i++) {
      await gridPage.editCell(0, 0, `edit-${i}`);
      await gridPage.undo();
      await gridPage.redo();
    }

    // Should not crash
  });

  test.skip('should handle simultaneous user interactions', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 10 }));

    // Simulate multiple rapid actions
    await Promise.all([
      gridPage.scrollTo(1000),
      gridPage.selectCell(10, 5),
      gridPage.sortByColumn(0),
    ]);

    // Should handle gracefully
  });

  test.skip('should handle rapid copy/paste operations', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 10 }));

    for (let i = 0; i < 20; i++) {
      await gridPage.selectCell(i % 100, i % 10);
      await gridPage.copy();
      await gridPage.paste();
    }

    // Should not crash
  });

  test.skip('should handle rapid keyboard navigation', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 10 }));

    for (let i = 0; i < 100; i++) {
      await gridPage.pressKey('ArrowRight');
    }

    // Should not crash
  });

  test.skip('should handle rapid data append (infinite scroll)', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    for (let i = 0; i < 10; i++) {
      await page.evaluate((startRow) => {
        // @ts-ignore
        const currentData = window.grid?.getData() || [];
        const newRows = Array.from({ length: 100 }, (_, idx) =>
          Array.from({ length: 5 }, (_, col) => (startRow + idx) * 5 + col)
        );
        // @ts-ignore
        window.grid?.setData([...currentData, ...newRows]);
      }, (i + 1) * 100);
    }

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBeGreaterThan(100);
  });

  test.skip('should handle rapid viewport resize', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 10 }));

    for (let i = 0; i < 10; i++) {
      await page.setViewportSize({
        width: 800 + (i * 100),
        height: 600 + (i * 50)
      });
      await page.waitForTimeout(50);
    }

    // Should handle resize gracefully
  });

  test.skip('should handle concurrent edits and scrolling', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    for (let i = 0; i < 20; i++) {
      await gridPage.scrollTo(i * 1000);
      await gridPage.editCell(i % 100, i % 10, `value-${i}`);
    }

    // Should not crash
  });

  test.skip('should handle rapid event listener additions', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    for (let i = 0; i < 50; i++) {
      await page.evaluate(() => {
        // @ts-ignore
        window.grid?.on('cell:click', () => {});
      });
    }

    // Should not cause memory leak
  });
});
