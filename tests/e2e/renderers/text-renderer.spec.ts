import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateTextData } from '../../fixtures/test-data';
import { expectCellValue, takeSnapshot } from '../../fixtures/helpers';

test.describe('Text Renderer', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should render text content correctly', async ({ page }) => {
    await gridPage.setData(generateTextData({ rows: 10, cols: 5 }));

    await expectCellValue(page, 0, 0, 'Cell 0,0');
    await expectCellValue(page, 5, 2, 'Cell 5,2');
  });

  test.skip('should render empty strings as blank cells', async ({ page }) => {
    await gridPage.setData([['', 'text', '']]);

    const emptyCell1 = await gridPage.getCellValue(0, 0);
    const textCell = await gridPage.getCellValue(0, 1);
    const emptyCell2 = await gridPage.getCellValue(0, 2);

    expect(emptyCell1).toBe('');
    expect(textCell).toBe('text');
    expect(emptyCell2).toBe('');
  });

  test.skip('should handle long text with ellipsis overflow', async ({ page }) => {
    const longText = 'This is a very long text that should be truncated with ellipsis';
    await gridPage.setData([[longText]]);

    const cell = await gridPage.getCell(0, 0);
    const overflow = await cell.evaluate(el => getComputedStyle(el).textOverflow);

    expect(overflow).toBe('ellipsis');
  });

  test.skip('should handle multi-line text if wrap enabled', async ({ page }) => {
    const multiLineText = 'Line 1\nLine 2\nLine 3';
    await gridPage.setData([[multiLineText]]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toContain('Line');
  });

  test.skip('should render special characters correctly', async ({ page }) => {
    await gridPage.setData([['<div>', '&nbsp;', '"quote"', "'apostrophe'"]]);

    await expectCellValue(page, 0, 0, '<div>');
    await expectCellValue(page, 0, 2, '"quote"');
  });

  test.skip('should render unicode characters correctly', async ({ page }) => {
    await gridPage.setData([['Hello 世界', '🚀 Rocket', 'Émojis 😀']]);

    const cell1 = await gridPage.getCellValue(0, 0);
    const cell2 = await gridPage.getCellValue(0, 1);
    const cell3 = await gridPage.getCellValue(0, 2);

    expect(cell1).toContain('世界');
    expect(cell2).toContain('🚀');
    expect(cell3).toContain('😀');
  });

  test.skip('should apply text alignment from column config', async ({ page }) => {
    // This would test text-align CSS property
    test.skip();
  });

  test.skip('should apply custom text color from column config', async ({ page }) => {
    // This would test color CSS property
    test.skip();
  });

  test.skip('should render with correct font family and size', async ({ page }) => {
    await gridPage.setData(generateTextData({ rows: 5, cols: 3 }));

    const cell = await gridPage.getCell(0, 0);
    const fontSize = await cell.evaluate(el => getComputedStyle(el).fontSize);
    const fontFamily = await cell.evaluate(el => getComputedStyle(el).fontFamily);

    expect(fontSize).toBeTruthy();
    expect(fontFamily).toBeTruthy();
  });

  test.skip('should handle text selection within cell', async ({ page }) => {
    await gridPage.setData([['Selectable text']]);

    const cell = await gridPage.getCell(0, 0);
    await cell.click();

    // Text should be selectable
    await page.keyboard.down('Shift');
    await page.keyboard.press('End');
    await page.keyboard.up('Shift');
  });

  test.skip('should render whitespace correctly', async ({ page }) => {
    await gridPage.setData([['  spaces  ', '\ttabs\t', '  mixed \t ']]);

    // Verify whitespace is rendered
    const cell1Value = await gridPage.getCellValue(0, 0);
    expect(cell1Value).toBeTruthy();
  });

  test.skip('should update text when data changes', async ({ page }) => {
    await gridPage.setData([['Initial text']]);

    await expectCellValue(page, 0, 0, 'Initial text');

    await gridPage.setData([['Updated text']]);

    await expectCellValue(page, 0, 0, 'Updated text');
  });

  test.skip('should render text with visual snapshot', async ({ page }) => {
    await gridPage.setData(generateTextData({ rows: 5, cols: 5 }));

    await takeSnapshot(page, 'text-renderer');
  });
});
