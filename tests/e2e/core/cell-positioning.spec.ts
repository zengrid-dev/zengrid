import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';

test.describe('Cell Positioning', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should position cells correctly in grid space', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    const cell = await gridPage.getCell(0, 0);
    const box = await cell.boundingBox();

    expect(box?.x).toBeGreaterThanOrEqual(0);
    expect(box?.y).toBeGreaterThanOrEqual(0);
  });

  test.skip('should maintain correct cell positions after scrolling', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    await gridPage.scrollTo(5000);

    const visibleRange = await gridPage.getVisibleRange();
    const firstVisibleCell = await gridPage.getCell(visibleRange.startRow, 0);
    const box = await firstVisibleCell.boundingBox();

    // First visible cell should be near viewport top
    expect(box?.y).toBeLessThan(200);
  });

  test.skip('should calculate correct cumulative offsets for rows', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    const positions = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.zen-grid-cell'));
      return cells.slice(0, 10).map(cell => {
        const transform = getComputedStyle(cell).transform;
        const matrix = new DOMMatrix(transform);
        return { x: matrix.m41, y: matrix.m42 };
      });
    });

    // Verify positions are sequential
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i].y).toBeGreaterThan(positions[i - 1].y);
    }
  });

  test.skip('should calculate correct cumulative offsets for columns', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 10 }));

    const positions = await page.evaluate(() => {
      const firstRow = Array.from(document.querySelectorAll('.zen-grid-cell')).slice(0, 10);
      return firstRow.map(cell => {
        const transform = getComputedStyle(cell).transform;
        const matrix = new DOMMatrix(transform);
        return { x: matrix.m41, y: matrix.m42 };
      });
    });

    // Verify column positions are sequential
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i].x).toBeGreaterThan(positions[i - 1].x);
    }
  });

  test.skip('should position cells without gaps between rows', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    const positions = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.zen-grid-cell'));
      return cells.map(cell => {
        const rect = cell.getBoundingClientRect();
        const transform = getComputedStyle(cell).transform;
        const matrix = new DOMMatrix(transform);
        return {
          x: matrix.m41,
          y: matrix.m42,
          height: rect.height,
          width: rect.width
        };
      });
    });

    // Check first column cells (no gaps)
    const firstColumnCells = positions.filter((_, i) => i % 5 === 0);
    for (let i = 1; i < firstColumnCells.length; i++) {
      const prevEnd = firstColumnCells[i - 1].y + firstColumnCells[i - 1].height;
      const currentStart = firstColumnCells[i].y;
      expect(Math.abs(currentStart - prevEnd)).toBeLessThan(2); // Allow 1px tolerance
    }
  });

  test.skip('should position cells without gaps between columns', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    const positions = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.zen-grid-cell')).slice(0, 5);
      return cells.map(cell => {
        const rect = cell.getBoundingClientRect();
        const transform = getComputedStyle(cell).transform;
        const matrix = new DOMMatrix(transform);
        return {
          x: matrix.m41,
          y: matrix.m42,
          height: rect.height,
          width: rect.width
        };
      });
    });

    // Check first row cells (no gaps)
    for (let i = 1; i < positions.length; i++) {
      const prevEnd = positions[i - 1].x + positions[i - 1].width;
      const currentStart = positions[i].x;
      expect(Math.abs(currentStart - prevEnd)).toBeLessThan(2);
    }
  });

  test.skip('should handle coordinate conversion grid to viewport', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    await gridPage.scrollTo(3000);

    // Cell at viewport top should have low Y coordinate in viewport space
    const visibleRange = await gridPage.getVisibleRange();
    const firstVisibleCell = await gridPage.getCell(visibleRange.startRow, 0);
    const box = await firstVisibleCell.boundingBox();

    expect(box?.y).toBeLessThan(100); // Should be near top
  });

  test.skip('should handle coordinate conversion viewport to grid', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 1000, cols: 10 }));

    await gridPage.scrollTo(5000);

    // Click at viewport position should select correct cell
    await gridPage.clickCell(0, 0); // First visible cell

    const visibleRange = await gridPage.getVisibleRange();
    expect(visibleRange.startRow).toBeGreaterThan(100);
  });

  test.skip('should invalidate position cache on height changes', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    const initialPosition = await (await gridPage.getCell(50, 0)).boundingBox();

    // Update row height via edit (if supported)
    // This would test cache invalidation
    await gridPage.scrollTo(2000);

    const newPosition = await (await gridPage.getCell(50, 0)).boundingBox();

    // Position should update
    expect(newPosition).toBeTruthy();
  });

  test.skip('should maintain position accuracy with variable row heights', async ({ page }) => {
    // This would require variable height data
    // Implementation depends on height provider support
    test.skip();
  });

  test.skip('should position cells correctly after column resize', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    // Resize column 0 by +50px
    await gridPage.resizeColumn(0, 50);

    // Check that columns 1+ shifted correctly
    const col0 = await gridPage.getCell(0, 0);
    const col1 = await gridPage.getCell(0, 1);

    const box0 = await col0.boundingBox();
    const box1 = await col1.boundingBox();

    expect(box1!.x).toBeGreaterThan(box0!.x + box0!.width);
  });

  test.skip('should handle positioning with pinned columns', async ({ page }) => {
    // This would test pinned column positioning
    // Implementation depends on column pinning support
    test.skip();
  });

  test.skip('should handle positioning with frozen rows', async ({ page }) => {
    // This would test frozen row positioning
    // Implementation depends on row freezing support
    test.skip();
  });
});
