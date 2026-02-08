import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';

test.describe('Special Characters Edge Cases', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should handle HTML tags as text', async ({ page }) => {
    await gridPage.setData([
      ['<script>alert("xss")</script>', '<div>HTML</div>', '<img src=x onerror=alert(1)>']
    ]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toContain('<script>');
  });

  test.skip('should handle SQL injection characters', async ({ page }) => {
    await gridPage.setData([
      ["'; DROP TABLE users--", "1' OR '1'='1", "admin'--"]
    ]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBeTruthy();
  });

  test.skip('should handle special regex characters', async ({ page }) => {
    await gridPage.setData([
      ['.', '*', '+', '?', '^', '$', '(', ')', '[', ']', '{', '}', '|', '\\']
    ]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBe('.');
  });

  test.skip('should handle URL-encoded characters', async ({ page }) => {
    await gridPage.setData([
      ['%20', '%3C%3E', '%00', '%0A%0D']
    ]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBeTruthy();
  });

  test.skip('should handle control characters', async ({ page }) => {
    await gridPage.setData([
      ['\x00', '\x01', '\x02', '\x1F']
    ]);

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(1);
  });

  test.skip('should handle newlines and tabs', async ({ page }) => {
    await gridPage.setData([
      ['Line1\nLine2', 'Tab\tSeparated', 'CR\rLF\r\n']
    ]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBeTruthy();
  });

  test.skip('should handle zero-width characters', async ({ page }) => {
    await gridPage.setData([
      ['\u200B', '\u200C', '\u200D', '\uFEFF']
    ]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBeTruthy();
  });

  test.skip('should handle RTL marks', async ({ page }) => {
    await gridPage.setData([
      ['\u202E', 'ABC\u202EXYZ', '\u202D']
    ]);

    const cellValue = await gridPage.getCellValue(0, 1);
    expect(cellValue).toBeTruthy();
  });

  test.skip('should handle bidirectional text', async ({ page }) => {
    await gridPage.setData([
      ['English مع العربية', 'עברית with English', 'Mixed 日本語 text']
    ]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBeTruthy();
  });

  test.skip('should handle emoji sequences', async ({ page }) => {
    await gridPage.setData([
      ['👨‍👩‍👧‍👦', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '👍🏻👍🏿', '🇺🇸🇬🇧']
    ]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBeTruthy();
  });

  test.skip('should handle mathematical symbols', async ({ page }) => {
    await gridPage.setData([
      ['∑', '∫', '∂', '√', '∞', '≈', '≠', '≤', '≥']
    ]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBe('∑');
  });

  test.skip('should handle currency symbols', async ({ page }) => {
    await gridPage.setData([
      ['$', '€', '£', '¥', '₹', '₽', '฿', '₪']
    ]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBe('$');
  });

  test.skip('should handle quotes and apostrophes', async ({ page }) => {
    await gridPage.setData([
      ['"double"', "'single'", '`backtick`', '"curly"', ''curly'']
    ]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toContain('"');
  });

  test.skip('should handle escape sequences', async ({ page }) => {
    await gridPage.setData([
      ['\\n', '\\t', '\\r', '\\\\', '\\"', "\\'"]
    ]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBeTruthy();
  });

  test.skip('should handle mixed encoding', async ({ page }) => {
    await gridPage.setData([
      ['ASCII', 'UTF-8: 你好', 'Latin-1: café', 'Cyrillic: Привет']
    ]);

    const cellValue = await gridPage.getCellValue(0, 1);
    expect(cellValue).toContain('你好');
  });

  test.skip('should handle invisible characters', async ({ page }) => {
    await gridPage.setData([
      ['\u2800', '\u3164', '\uFFA0']
    ]);

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(1);
  });

  test.skip('should handle combining diacritics', async ({ page }) => {
    await gridPage.setData([
      ['e\u0301', 'n\u0303', 'a\u0308']
    ]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBeTruthy();
  });

  test.skip('should handle homoglyphs', async ({ page }) => {
    await gridPage.setData([
      ['а', 'а', 'o', 'о'] // Latin 'a', Cyrillic 'а', Latin 'o', Cyrillic 'о'
    ]);

    const rowCount = await gridPage.getRowCount();
    expect(rowCount).toBe(1);
  });

  test.skip('should handle ligatures', async ({ page }) => {
    await gridPage.setData([
      ['fi', 'fl', 'ffi', 'ﬂ']
    ]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toBeTruthy();
  });

  test.skip('should handle JSON special characters in text', async ({ page }) => {
    await gridPage.setData([
      ['{"key": "value"}', '[1, 2, 3]', 'null', 'true']
    ]);

    const cellValue = await gridPage.getCellValue(0, 0);
    expect(cellValue).toContain('{');
  });
});
