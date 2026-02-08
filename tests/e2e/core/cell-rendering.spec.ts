import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateMixedData, generateNumericData } from '../../fixtures/test-data';
import { expectCellValue, expectCellHasClass, takeSnapshot } from '../../fixtures/helpers';

test.describe('Cell Rendering', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should render cells with correct text content', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    await expectCellValue(page, 0, 0, '0');
    await expectCellValue(page, 0, 1, '1');
    await expectCellValue(page, 1, 0, '5');
  });

  test.skip('should render cells with correct positioning', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 10 }));

    const cell = await gridPage.getCell(5, 3);
    const transform = await cell.evaluate(el => getComputedStyle(el).transform);

    // Should use transform for positioning (not top/left)
    expect(transform).not.toBe('none');
  });

  test.skip('should use transform-based positioning (not top/left)', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    const cell = await gridPage.getCell(0, 0);
    const styles = await cell.evaluate(el => ({
      top: getComputedStyle(el).top,
      left: getComputedStyle(el).left,
      transform: getComputedStyle(el).transform,
    }));

    // Should use transform, with top/left at 0 or initial
    expect(styles.transform).not.toBe('none');
  });

  test.skip('should render cells with correct dimensions', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    const cell = await gridPage.getCell(0, 0);
    const box = await cell.boundingBox();

    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);
  });

  test.skip('should apply correct cell CSS classes', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    const cell = await gridPage.getCell(0, 0);
    await expect(cell).toHaveClass(/zen-grid-cell/);
  });

  test.skip('should render different data types correctly', async ({ page }) => {
    await gridPage.setData(generateMixedData(10));

    // Number
    const numberCell = await gridPage.getCellValue(0, 0);
    expect(numberCell).toBeTruthy();

    // Text
    const textCell = await gridPage.getCellValue(0, 1);
    expect(textCell).toContain('Row');

    // Boolean
    const boolCell = await gridPage.getCellValue(0, 2);
    expect(boolCell).toBeTruthy();
  });

  test.skip('should render null/undefined as empty cells', async ({ page }) => {
    await gridPage.setData([[null, undefined, '', 'value']]);

    const nullCell = await gridPage.getCellValue(0, 0);
    const undefinedCell = await gridPage.getCellValue(0, 1);
    const emptyCell = await gridPage.getCellValue(0, 2);
    const valueCell = await gridPage.getCellValue(0, 3);

    expect(nullCell).toBe('');
    expect(undefinedCell).toBe('');
    expect(emptyCell).toBe('');
    expect(valueCell).toBe('value');
  });

  test.skip('should update cells when data changes', async ({ page }) => {
    await gridPage.setData([[1, 2, 3]]);

    await expectCellValue(page, 0, 0, '1');

    // Update data
    await gridPage.setData([[10, 20, 30]]);

    await expectCellValue(page, 0, 0, '10');
  });

  test.skip('should render cells in correct grid layout', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 3, cols: 3 }));

    // Visual snapshot to verify grid layout
    await takeSnapshot(page, 'cell-rendering-grid-layout');
  });

  test.skip('should apply hover state on cell hover', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    const cell = await gridPage.getCell(2, 2);
    await cell.hover();

    await expect(cell).toHaveClass(/hover|zg-cell:hover/);
  });

  test.skip('should render cells with correct z-index stacking', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    const cell1 = await gridPage.getCell(0, 0);
    const cell2 = await gridPage.getCell(1, 1);

    const zIndex1 = await cell1.evaluate(el => getComputedStyle(el).zIndex);
    const zIndex2 = await cell2.evaluate(el => getComputedStyle(el).zIndex);

    // Z-index should be consistent
    expect(zIndex1).toBe(zIndex2);
  });

  test.skip('should render cells with accessibility attributes', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    const cell = await gridPage.getCell(0, 0);

    // Check for ARIA attributes
    const role = await cell.getAttribute('role');
    expect(role).toBeTruthy();
  });

  test.skip('should render long text with overflow handling', async ({ page }) => {
    const longText = 'This is a very long text that should be handled with overflow';
    await gridPage.setData([[longText]]);

    const cell = await gridPage.getCell(0, 0);
    const overflow = await cell.evaluate(el => getComputedStyle(el).overflow);

    // Should have overflow handling (ellipsis, hidden, etc.)
    expect(['hidden', 'ellipsis', 'clip']).toContain(overflow);
  });

  test.skip('should maintain cell rendering during rapid data updates', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    // Rapid updates
    for (let i = 0; i < 5; i++) {
      await gridPage.setData(generateNumericData({ rows: 10, cols: 5, startRow: i }));
    }

    // Cells should still render correctly
    const cellCount = await page.locator('.zen-grid-cell').count();
    expect(cellCount).toBeGreaterThan(0);
  });

  test.skip('should render cells with custom CSS classes from column config', async ({ page }) => {
    // This would test custom cell classes if configured
    // Implementation depends on grid configuration
    test.skip();
  });
});
