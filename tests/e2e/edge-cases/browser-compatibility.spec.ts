import { test, expect } from '@playwright/test';
import { GridPage } from '../../fixtures/grid-page';
import { generateNumericData } from '../../fixtures/test-data';

test.describe('Browser Compatibility Edge Cases', () => {
  let gridPage: GridPage;

  test.beforeEach(async ({ page }) => {
    gridPage = new GridPage(page);
    await gridPage.goto('/');
  });

  test.skip('should work without ResizeObserver', async ({ page }) => {
    await page.evaluate(() => {
      // @ts-ignore
      window.ResizeObserver = undefined;
    });

    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    // Should have fallback
  });

  test.skip('should work without IntersectionObserver', async ({ page }) => {
    await page.evaluate(() => {
      // @ts-ignore
      window.IntersectionObserver = undefined;
    });

    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    // Should have fallback
  });

  test.skip('should work without requestAnimationFrame', async ({ page }) => {
    await page.evaluate(() => {
      // @ts-ignore
      window.requestAnimationFrame = undefined;
    });

    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    // Should have fallback
  });

  test.skip('should work without Clipboard API', async ({ page }) => {
    await page.evaluate(() => {
      // @ts-ignore
      navigator.clipboard = undefined;
    });

    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    await gridPage.selectCell(0, 0);
    await gridPage.copy();

    // Should have fallback (execCommand)
  });

  test.skip('should handle missing CSS Grid support', async ({ page }) => {
    // Test with older layout fallbacks
    test.skip();
  });

  test.skip('should handle missing Proxy support', async ({ page }) => {
    await page.evaluate(() => {
      // @ts-ignore
      window.Proxy = undefined;
    });

    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    // Should work without reactive proxies
  });

  test.skip('should handle missing WeakMap support', async ({ page }) => {
    await page.evaluate(() => {
      // @ts-ignore
      window.WeakMap = undefined;
    });

    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    // Should have fallback
  });

  test.skip('should work with disabled JavaScript features', async ({ page }) => {
    // Test graceful degradation
    test.skip();
  });

  test.skip('should handle localStorage unavailable', async ({ page }) => {
    await page.evaluate(() => {
      // @ts-ignore
      window.localStorage = undefined;
    });

    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    // Should work without localStorage caching
  });

  test.skip('should handle sessionStorage unavailable', async ({ page }) => {
    await page.evaluate(() => {
      // @ts-ignore
      window.sessionStorage = undefined;
    });

    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    // Should work without sessionStorage
  });

  test.skip('should work in iframe', async ({ page }) => {
    await page.setContent(`
      <iframe id="testFrame" style="width: 800px; height: 600px;"></iframe>
    `);

    const frame = page.frame({ name: 'testFrame' });
    if (frame) {
      await frame.goto(page.url());
      const frameGridPage = new GridPage(page);
      await frameGridPage.setData(generateNumericData({ rows: 100, cols: 5 }));
    }

    // Should work in iframe context
  });

  test.skip('should handle print media query', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    await page.emulateMedia({ media: 'print' });

    // Should apply print styles
  });

  test.skip('should work with forced colors mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });

    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    // Should respect forced colors
  });

  test.skip('should handle reduced motion preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    // Should disable animations
  });

  test.skip('should work with high contrast mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark', contrast: 'more' });

    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    // Should apply high contrast styles
  });

  test.skip('should handle touch events on desktop', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    // Simulate touch events
    await page.touchscreen.tap(100, 100);

    // Should handle touch fallback
  });

  test.skip('should work with different zoom levels', async ({ page }) => {
    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    // Test various zoom levels
    await page.evaluate(() => {
      document.body.style.zoom = '150%';
    });

    await gridPage.scrollTo(1000);

    // Should calculate positions correctly
  });

  test.skip('should handle right-to-left (RTL) layout', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.dir = 'rtl';
    });

    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    await gridPage.scrollTo(0, 500);

    // Should handle RTL scrolling
  });

  test.skip('should work with CSS containment', async ({ page }) => {
    await page.evaluate(() => {
      const grid = document.querySelector('.zen-grid');
      if (grid instanceof HTMLElement) {
        grid.style.contain = 'layout size style paint';
      }
    });

    await gridPage.setData(generateNumericData({ rows: 100, cols: 5 }));

    // Should work with containment
  });
});
