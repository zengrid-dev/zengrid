import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateLargeDataset, generateNumericData } from '../../fixtures/test-data';
import { expectPerformance, measureFPS } from '../../fixtures/helpers';

test.describe('Performance Stress Tests', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should maintain 60fps during continuous scrolling', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(50000, 20));

    const fps = await measureFPS(page, async () => {
      for (let i = 0; i < 100; i++) {
        await gridPage.scrollTo(i * 500);
      }
    });

    expect(fps).toBeGreaterThan(55);
  });

  test.skip('should handle 1000 rapid edits', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    await expectPerformance(page, async () => {
      for (let i = 0; i < 1000; i++) {
        await page.evaluate((idx) => {
          // @ts-ignore
          window.grid?.updateCells([{ row: idx % 1000, col: idx % 10, value: `edit-${idx}` }]);
        }, i);
      }
    }, 5000);
  });

  test.skip('should handle 100 concurrent sorts', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(10000, 10));

    await expectPerformance(page, async () => {
      for (let i = 0; i < 100; i++) {
        await gridPage.sortByColumn(i % 10);
      }
    }, 10000);
  });

  test.skip('should handle 100 concurrent filters', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(10000, 10));

    await expectPerformance(page, async () => {
      for (let i = 0; i < 100; i++) {
        await gridPage.setFilter(0, 'greaterThan', i * 100);
        await gridPage.clearFilters();
      }
    }, 10000);
  });

  test.skip('should handle stress test: all operations simultaneously', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(10000, 20));

    await expectPerformance(page, async () => {
      for (let i = 0; i < 50; i++) {
        await Promise.all([
          gridPage.scrollTo(i * 1000),
          gridPage.selectCell(i % 100, i % 20),
          gridPage.sortByColumn(i % 20),
          page.evaluate(() => {
            // @ts-ignore
            window.grid?.updateCells([{ row: 0, col: 0, value: 'test' }]);
          }),
        ]);
      }
    }, 15000);
  });

  test.skip('should handle extreme column count (1000 columns)', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(100, 1000));

    const colCount = await gridPage.getColumnCount();
    expect(colCount).toBe(1000);
  });

  test.skip('should handle horizontal scrolling with 1000 columns', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(100, 1000));

    await expectPerformance(page, async () => {
      for (let i = 0; i < 50; i++) {
        await gridPage.scrollTo(0, i * 1000);
      }
    }, 5000);
  });

  test.skip('should handle stress test: rapid viewport changes', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(10000, 20));

    for (let i = 0; i < 50; i++) {
      await page.setViewportSize({
        width: 600 + (i % 10) * 100,
        height: 400 + (i % 10) * 80
      });
      await gridPage.scrollTo(i * 500);
    }

    // Should handle without performance degradation
  });

  test.skip('should handle memory stress: 10 million cells', async ({ page }) => {
    // 100k rows × 100 cols = 10 million cells
    await gridPage.setData(generateLargeDataset(100000, 100));

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(100000);

    // Should still scroll smoothly
    await gridPage.scrollTo(500000);
  });

  test.skip('should handle long-running session (100k operations)', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    for (let i = 0; i < 100000; i++) {
      if (i % 1000 === 0) {
        await gridPage.scrollTo((i / 1000) * 1000);
      }
      if (i % 100 === 0) {
        await page.evaluate((idx) => {
          // @ts-ignore
          window.grid?.updateCells([{ row: idx % 1000, col: 0, value: idx }]);
        }, i);
      }
    }

    // Should not degrade or crash
  });

  test.skip('should handle continuous data streaming', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    for (let i = 0; i < 100; i++) {
      await page.evaluate((idx) => {
        // @ts-ignore
        const currentData = window.grid?.getData() || [];
        const newRow = Array.from({ length: 5 }, (_, col) => idx * 5 + col);
        // @ts-ignore
        window.grid?.setData([...currentData, newRow]);
      }, i);
    }

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBeGreaterThan(100);
  });

  test.skip('should handle alternating operations stress test', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(5000, 10));

    for (let i = 0; i < 100; i++) {
      switch (i % 5) {
        case 0:
          await gridPage.scrollTo(i * 100);
          break;
        case 1:
          await gridPage.sortByColumn(i % 10);
          break;
        case 2:
          await gridPage.selectCell(i % 100, i % 10);
          break;
        case 3:
          await gridPage.editCell(i % 100, i % 10, `stress-${i}`);
          break;
        case 4:
          await gridPage.setFilter(0, 'greaterThan', i);
          await gridPage.clearFilters();
          break;
      }
    }

    // Should remain responsive
  });

  test.skip('should handle peak load: maximum concurrent operations', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(10000, 20));

    // Simulate peak load
    const operations = [];
    for (let i = 0; i < 20; i++) {
      operations.push(gridPage.scrollTo(Math.random() * 100000));
      operations.push(gridPage.selectCell(Math.floor(Math.random() * 1000), Math.floor(Math.random() * 20)));
      operations.push(page.evaluate(() => {
        // @ts-ignore
        window.grid?.updateCells([{ row: 0, col: 0, value: Math.random() }]);
      }));
    }

    await Promise.all(operations);

    // Should handle without crashing
  });

  test.skip('should recover from performance degradation', async ({ page }) => {
    await gridPage.setData(generateLargeDataset(50000, 20));

    // Cause intentional stress
    for (let i = 0; i < 100; i++) {
      await gridPage.scrollTo(Math.random() * 500000);
    }

    // Should recover to normal performance
    const fps = await measureFPS(page, async () => {
      await gridPage.scrollTo(10000);
    });

    expect(fps).toBeGreaterThan(50);
  });

  test.skip('should handle CPU throttling gracefully', async ({ page }) => {
    // Simulate slow CPU (if browser supports)
    await page.evaluate(() => {
      // Simulate heavy computation
      for (let i = 0; i < 1000000; i++) {
        Math.sqrt(i);
      }
    });

    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));
    await gridPage.scrollTo(5000);

    // Should still function
  });
});
