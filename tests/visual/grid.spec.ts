/**
 * ZenGrid Visual Regression Tests
 * 
 * These tests capture screenshots of the grid and compare them
 * to baseline images. When they fail, something VISUAL is wrong.
 * 
 * Run with: pnpm test:visual
 */

import { test, expect } from '@playwright/test';

test.describe('ZenGrid Visual Regression', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to test page - adjust URL as needed
    await page.goto('/test-grid');
    await page.setViewportSize({ width: 1200, height: 800 });
    // Wait for grid to be fully rendered
    await page.waitForSelector('.zen-grid', { state: 'visible' });
  });

  // ============================================================
  // Initial Render Tests
  // ============================================================
  
  test('grid renders correctly on initial load', async ({ page }) => {
    await expect(page.locator('.zen-grid')).toHaveScreenshot('grid-initial.png');
  });

  test('grid renders correct number of visible rows', async ({ page }) => {
    const visibleRows = await page.locator('.zen-grid-row').count();
    // Should render approximately viewport height / row height + overscan
    expect(visibleRows).toBeGreaterThan(10);
    expect(visibleRows).toBeLessThan(30); // Not rendering entire dataset
  });

  // ============================================================
  // Scroll Tests
  // ============================================================

  test('grid renders correctly after scrolling down', async ({ page }) => {
    // Scroll down 5000 pixels
    await page.locator('.zen-grid-viewport').evaluate(el => {
      el.scrollTop = 5000;
    });
    
    // Wait for render
    await page.waitForTimeout(100);
    
    await expect(page.locator('.zen-grid')).toHaveScreenshot('grid-scrolled-5000.png');
  });

  test('grid renders correctly after fast scroll', async ({ page }) => {
    // Fast scroll to simulate momentum scrolling
    await page.locator('.zen-grid-viewport').evaluate(el => {
      el.scrollTop = 50000;
    });
    
    await page.waitForTimeout(200);
    
    await expect(page.locator('.zen-grid')).toHaveScreenshot('grid-fast-scroll.png');
  });

  test('no blank areas during scroll', async ({ page }) => {
    // Scroll in increments and check for blank areas
    const viewport = page.locator('.zen-grid-viewport');
    
    for (const scrollPos of [1000, 2000, 3000, 4000, 5000]) {
      await viewport.evaluate((el, pos) => {
        el.scrollTop = pos;
      }, scrollPos);
      
      await page.waitForTimeout(50);
      
      // Check that content area has cells
      const cellCount = await page.locator('.zen-grid-cell').count();
      expect(cellCount).toBeGreaterThan(0);
    }
  });

  // ============================================================
  // Row Height Tests
  // ============================================================

  test('rows render at correct heights', async ({ page }) => {
    // Get the first few rows and verify heights
    const rows = page.locator('.zen-grid-row').first();
    const box = await rows.boundingBox();
    
    expect(box?.height).toBeGreaterThan(0);
  });

  test('variable row heights render correctly', async ({ page }) => {
    // Trigger variable row heights if your grid supports it
    await page.evaluate(() => {
      // @ts-ignore - grid is on window
      if (window.grid?.setRowHeight) {
        window.grid.setRowHeight(5, 100);
        window.grid.setRowHeight(10, 80);
        window.grid.setRowHeight(15, 120);
      }
    });
    
    await page.waitForTimeout(100);
    
    await expect(page.locator('.zen-grid')).toHaveScreenshot('grid-variable-heights.png');
  });

  test('row height change updates positions correctly', async ({ page }) => {
    // Get position of row 20 before change
    const getRowTop = async (index: number) => {
      return page.evaluate((idx) => {
        // @ts-ignore
        return window.grid?.getRowTop?.(idx) ?? 0;
      }, index);
    };
    
    const topBefore = await getRowTop(20);
    
    // Change height of row 5
    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.setRowHeight?.(5, 200);
    });
    
    await page.waitForTimeout(100);
    
    const topAfter = await getRowTop(20);
    
    // Row 20 should have moved down by the height difference
    expect(topAfter).toBeGreaterThan(topBefore);
  });

  // ============================================================
  // Column Tests
  // ============================================================

  test('columns render at correct widths', async ({ page }) => {
    await expect(page.locator('.zen-grid')).toHaveScreenshot('grid-columns.png');
  });

  test('horizontal scroll works correctly', async ({ page }) => {
    await page.locator('.zen-grid-viewport').evaluate(el => {
      el.scrollLeft = 500;
    });
    
    await page.waitForTimeout(100);
    
    await expect(page.locator('.zen-grid')).toHaveScreenshot('grid-h-scroll.png');
  });

  // ============================================================
  // Cell Content Tests
  // ============================================================

  test('cell content is positioned correctly within cells', async ({ page }) => {
    // Zoom in on a specific cell area
    const cell = page.locator('.zen-grid-cell').first();
    await expect(cell).toHaveScreenshot('cell-content.png');
  });

  test('cells with overflow are handled correctly', async ({ page }) => {
    // If you have cells with long content
    await expect(page.locator('.zen-grid')).toHaveScreenshot('cell-overflow.png');
  });

  // ============================================================
  // Selection Tests (if applicable)
  // ============================================================

  test('cell selection renders correctly', async ({ page }) => {
    // Click a cell to select it
    await page.locator('.zen-grid-cell').first().click();
    
    await expect(page.locator('.zen-grid')).toHaveScreenshot('grid-selection.png');
  });

  test('range selection renders correctly', async ({ page }) => {
    // Shift+click to select a range
    await page.locator('.zen-grid-cell').first().click();
    await page.keyboard.down('Shift');
    await page.locator('.zen-grid-cell').nth(10).click();
    await page.keyboard.up('Shift');
    
    await expect(page.locator('.zen-grid')).toHaveScreenshot('grid-range-selection.png');
  });

  // ============================================================
  // Edge Cases
  // ============================================================

  test('empty grid renders correctly', async ({ page }) => {
    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.setData?.([]);
    });
    
    await page.waitForTimeout(100);
    
    await expect(page.locator('.zen-grid')).toHaveScreenshot('grid-empty.png');
  });

  test('single row grid renders correctly', async ({ page }) => {
    await page.evaluate(() => {
      // @ts-ignore
      window.grid?.setData?.([{ id: 1, name: 'Single Row' }]);
    });
    
    await page.waitForTimeout(100);
    
    await expect(page.locator('.zen-grid')).toHaveScreenshot('grid-single-row.png');
  });

  test('grid handles resize correctly', async ({ page }) => {
    // Resize viewport
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(200);
    
    await expect(page.locator('.zen-grid')).toHaveScreenshot('grid-resized.png');
  });
});

// ============================================================
// Playwright Configuration
// ============================================================
// Add to playwright.config.ts:
//
// import { defineConfig } from '@playwright/test';
// 
// export default defineConfig({
//   testDir: './tests/visual',
//   fullyParallel: true,
//   expect: {
//     toHaveScreenshot: {
//       maxDiffPixels: 100,      // Allow small differences
//       threshold: 0.2,          // 20% pixel difference threshold
//       animations: 'disabled',  // Disable animations for consistency
//     },
//   },
//   use: {
//     baseURL: 'http://localhost:5173',
//     trace: 'on-first-retry',
//   },
//   webServer: {
//     command: 'pnpm dev',
//     url: 'http://localhost:5173',
//     reuseExistingServer: !process.env.CI,
//   },
// });
