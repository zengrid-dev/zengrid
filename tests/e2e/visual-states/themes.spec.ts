import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';
import { expectDarkTheme, takeSnapshot } from '../../fixtures/helpers';

test.describe('Themes', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should apply light theme by default', async ({ page }) => {
    test.skip();
  });

  test.skip('should apply dark theme', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    await expectDarkTheme(page);
  });

  test.skip('should support custom theme colors', async ({ page }) => {
    test.skip();
  });

  test.skip('should respect system dark mode preference', async ({ page }) => {
    test.skip();
  });

  test.skip('should toggle between light and dark themes', async ({ page }) => {
    test.skip();
  });

  test.skip('should apply theme to all grid elements', async ({ page }) => {
    test.skip();
  });

  test.skip('should render theme visual snapshot', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 10, cols: 5 }));

    await takeSnapshot(page, 'theme-dark');
  });
});
