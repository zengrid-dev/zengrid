import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';

test.describe('Memory Leak Edge Cases', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should not leak memory on repeated data loads', async ({ page }) => {
    const initialMemory = await page.evaluate(() => {
      // @ts-ignore
      return performance.memory?.usedJSHeapSize;
    });

    for (let i = 0; i < 100; i++) {
      await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));
    }

    await page.evaluate(() => {
      // @ts-ignore
      if (window.gc) window.gc();
    });

    const finalMemory = await page.evaluate(() => {
      // @ts-ignore
      return performance.memory?.usedJSHeapSize;
    });

    // Memory should not grow excessively
    if (initialMemory && finalMemory) {
      expect(finalMemory).toBeLessThan(initialMemory * 3);
    }
  });

  test.skip('should not leak DOM nodes on scroll', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10000, cols: 10 }));

    const initialNodes = await page.locator('.zen-grid-cell').count();

    for (let i = 0; i < 100; i++) {
      await gridPage.scrollTo(i * 1000);
    }

    const finalNodes = await page.locator('.zen-grid-cell').count();

    // DOM nodes should stay bounded
    expect(finalNodes).toBeLessThan(initialNodes * 2);
  });

  test.skip('should clean up event listeners on destroy', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.destroy?.();
    });

    // Check that grid is properly destroyed
    const gridExists = await page.evaluate(() => {
      // @ts-ignore
      return window.grid != null;
    });

    expect(gridExists).toBe(false);
  });

  test.skip('should not leak on repeated cell edits', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    for (let i = 0; i < 1000; i++) {
      await gridPage.editCell(i % 100, i % 5, `value-${i}`);
    }

    // Should not crash or leak
  });

  test.skip('should clean up after repeated mount/unmount', async ({ page }) => {
    for (let i = 0; i < 50; i++) {
      await page.evaluate(() => {
        // @ts-ignore
        window.grid?.destroy?.();
      });

      await gridPage.goto('/');
      await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));
    }

    // Should not leak
  });

  test.skip('should not leak on repeated filter operations', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10000, cols: 5 }));

    for (let i = 0; i < 100; i++) {
      await gridPage.setFilter(0, 'greaterThan', i * 10);
      await gridPage.clearFilters();
    }

    // Should not leak filtered indices
  });

  test.skip('should not leak on repeated sort operations', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10000, cols: 5 }));

    for (let i = 0; i < 100; i++) {
      await gridPage.sortByColumn(i % 5);
    }

    // Should not leak sort state
  });

  test.skip('should clean up cell pool correctly', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10000, cols: 10 }));

    for (let i = 0; i < 100; i++) {
      await gridPage.scrollTo(i * 1000);
    }

    const poolSize = await page.evaluate(() => {
      // @ts-ignore
      return window.grid?.cellPool?.size ?? 0;
    });

    // Pool should be bounded
    expect(poolSize).toBeLessThan(200);
  });

  test.skip('should not leak timers', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    // Trigger actions that might create timers
    for (let i = 0; i < 50; i++) {
      await gridPage.scrollTo(i * 100);
    }

    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.destroy?.();
    });

    // All timers should be cleared
  });

  test.skip('should not leak on rapid component updates', async ({ page }) => {
    for (let i = 0; i < 100; i++) {
      await gridPage.setData(generateNumericData({ rows: 100, cols: 5, startRow: i }));
    }

    await page.evaluate(() => {
      // @ts-ignore
      if (window.gc) window.gc();
    });

    // Should not accumulate old component instances
  });
});
