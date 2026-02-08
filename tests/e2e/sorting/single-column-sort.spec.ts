import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateSortableData } from '../../fixtures/test-data';
import { expectHeaderSorted } from '../../fixtures/helpers';

test.describe('Single Column Sort', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should sort ascending on first header click', async ({ page }) => {
    await gridPage.setData(generateSortableData(20));

    await gridPage.sortByColumn(0);

    await expectHeaderSorted(page, 0, 'asc');
  });

  test.skip('should sort descending on second header click', async ({ page }) => {
    await gridPage.setData(generateSortableData(20));

    await gridPage.sortByColumn(0);
    await gridPage.sortByColumn(0);

    await expectHeaderSorted(page, 0, 'desc');
  });

  test.skip('should remove sort on third header click', async ({ page }) => {
    await gridPage.setData(generateSortableData(20));

    await gridPage.sortByColumn(0);
    await gridPage.sortByColumn(0);
    await gridPage.sortByColumn(0);

    test.skip();
  });

  test.skip('should display sort indicator with direction', async ({ page }) => {
    test.skip();
  });

  test.skip('should sort strings alphabetically', async ({ page }) => {
    test.skip();
  });

  test.skip('should sort numbers numerically', async ({ page }) => {
    test.skip();
  });

  test.skip('should sort dates chronologically', async ({ page }) => {
    test.skip();
  });

  test.skip('should sort booleans correctly', async ({ page }) => {
    test.skip();
  });

  test.skip('should sort null/undefined values to end', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire sort:beforeSort event', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire sort:change event', async ({ page }) => {
    test.skip();
  });

  test.skip('should fire sort:afterSort event', async ({ page }) => {
    test.skip();
  });

  test.skip('should maintain sort after data updates', async ({ page }) => {
    test.skip();
  });

  test.skip('should support custom comparator functions', async ({ page }) => {
    test.skip();
  });
});
