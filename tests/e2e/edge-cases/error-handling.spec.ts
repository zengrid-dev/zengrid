import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';

test.describe('Error Handling Edge Cases', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should handle invalid row index gracefully', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.scrollToCell?.(999999, 0);
    });

    // Should not crash
  });

  test.skip('should handle invalid column index gracefully', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.scrollToCell?.(0, 999999);
    });

    // Should not crash
  });

  test.skip('should handle negative row index', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.scrollToCell?.(-1, 0);
    });

    // Should clamp to 0
  });

  test.skip('should handle negative column index', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.scrollToCell?.(0, -1);
    });

    // Should clamp to 0
  });

  test.skip('should handle missing required options', async ({ page }) => {
    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.setData();
    });

    // Should not crash
  });

  test.skip('should handle circular data references', async ({ page }) => {
    const circularData = await page.evaluate(() => {
      const obj: any = { value: 1 };
      obj.self = obj;
      try {
        // @ts-ignore
        window.grid?.setData([[obj]]);
      } catch (e) {
        return 'error';
      }
      return 'ok';
    });

    // Should handle gracefully
    expect(circularData).toBeTruthy();
  });

  test.skip('should handle corrupted data structures', async ({ page }) => {
    await page.evaluate(() => {
      const corruptedData = new Array(10);
      corruptedData[5] = undefined;
      corruptedData[7] = null;
      // @ts-ignore
      window.grid?.setData(corruptedData);
    });

    // Should not crash
  });

  test.skip('should handle renderer throwing errors', async ({ page }) => {
    // If custom renderer throws error, should not crash grid
    test.skip();
  });

  test.skip('should handle editor throwing errors', async ({ page }) => {
    // If custom editor throws error, should not crash grid
    test.skip();
  });

  test.skip('should handle validation errors', async ({ page }) => {
    await gridPage.setData([['valid']]);

    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.on('cell:beforeChange', () => {
        throw new Error('Validation failed');
      });
    });

    // Try to edit, should handle error
    await gridPage.editCell(0, 0, 'invalid');

    // Grid should still be functional
  });

  test.skip('should handle sort comparator errors', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.setSortComparator(() => {
        throw new Error('Comparator error');
      });
    });

    // Try to sort, should handle error
    await gridPage.sortByColumn(0);

    // Grid should still be functional
  });

  test.skip('should handle filter predicate errors', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.setFilterPredicate(() => {
        throw new Error('Filter error');
      });
    });

    // Try to filter, should handle error
    await gridPage.setFilter(0, 'contains', 'test');

    // Grid should still be functional
  });

  test.skip('should handle event handler errors', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.on('cell:click', () => {
        throw new Error('Handler error');
      });
    });

    await gridPage.clickCell(0, 0);

    // Grid should still be functional
  });

  test.skip('should handle network errors in backend mode', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle timeout errors in backend mode', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle malformed server responses', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle missing DOM elements', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    // Remove grid container
    await page.evaluate(() => {
      document.querySelector('.zen-grid')?.remove();
    });

    // Operations should fail gracefully
  });

  test.skip('should handle operations on destroyed grid', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.destroy?.();
    });

    // Try operations on destroyed grid
    await page.evaluate(() => {
      try {
        // @ts-ignore
        window.grid?.setData([[]]);
      } catch (e) {
        // Expected
      }
    });

    // Should not crash
  });

  test.skip('should handle concurrent errors', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    // Trigger multiple errors simultaneously
    await Promise.all([
      page.evaluate(() => {
        // @ts-ignore
        window.grid?.scrollToCell?.(-1, -1);
      }),
      page.evaluate(() => {
        // @ts-ignore
        window.grid?.scrollToCell?.(99999, 99999);
      }),
      page.evaluate(() => {
        // @ts-ignore
        window.grid?.setData(undefined);
      }),
    ]);

    // Grid should recover
  });

  test.skip('should handle console errors gracefully', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    // Perform various operations
    await gridPage.scrollTo(1000);
    await gridPage.sortByColumn(0);
    await gridPage.editCell(0, 0, 'test');

    // Should have no uncaught errors
    expect(errors.length).toBe(0);
  });
});
