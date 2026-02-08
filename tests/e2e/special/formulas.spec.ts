import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateFormulaData } from '../../fixtures/test-data';

test.describe('Formulas', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should evaluate basic arithmetic formula', async ({ page }) => {
    test.skip();
  });

  test.skip('should support cell references (=A1+B1)', async ({ page }) => {
    test.skip();
  });

  test.skip('should support range functions (=SUM(A1:A10))', async ({ page }) => {
    test.skip();
  });

  test.skip('should recalculate when referenced cell changes', async ({ page }) => {
    test.skip();
  });

  test.skip('should handle circular references', async ({ page }) => {
    test.skip();
  });

  test.skip('should support built-in functions (SUM, AVG, MAX, MIN)', async ({ page }) => {
    test.skip();
  });

  test.skip('should support conditional formulas (IF)', async ({ page }) => {
    test.skip();
  });

  test.skip('should display formula in editor, result in cell', async ({ page }) => {
    test.skip();
  });
});
