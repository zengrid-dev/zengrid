import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for ZenGrid
 *
 * Provides reusable methods for interacting with the grid in tests.
 */
export class GridPage {
  readonly page: Page;
  readonly grid: Locator;
  readonly viewport: Locator;
  readonly cells: Locator;
  readonly rows: Locator;
  readonly headers: Locator;

  constructor(page: Page) {
    this.page = page;
    this.grid = page.locator('.zg-grid');
    this.viewport = page.locator('.zg-viewport');
    this.cells = page.locator('.zg-cell');
    this.rows = page.locator('.zg-row');
    this.headers = page.locator('.zg-header-cell');
  }

  // Navigation
  async goto(path = '/') {
    await this.page.goto(path);
    await this.waitForGridReady();
  }

  async waitForGridReady() {
    await this.grid.waitFor({ state: 'visible' });
    // Wait for at least one cell to be rendered
    await this.cells.first().waitFor({ state: 'visible' });
  }

  // Cell interactions
  async getCell(row: number, col: number): Promise<Locator> {
    return this.cells.nth(row * await this.getColumnCount() + col);
  }

  async getCellValue(row: number, col: number): Promise<string> {
    const cell = await this.getCell(row, col);
    return cell.textContent() || '';
  }

  async clickCell(row: number, col: number) {
    const cell = await this.getCell(row, col);
    await cell.click();
  }

  async doubleClickCell(row: number, col: number) {
    const cell = await this.getCell(row, col);
    await cell.dblclick();
  }

  async rightClickCell(row: number, col: number) {
    const cell = await this.getCell(row, col);
    await cell.click({ button: 'right' });
  }

  // Scrolling
  async scrollTo(scrollTop: number, scrollLeft = 0) {
    await this.viewport.evaluate((el, { top, left }) => {
      el.scrollTop = top;
      el.scrollLeft = left;
    }, { top: scrollTop, left: scrollLeft });
    // Wait for render
    await this.page.waitForTimeout(100);
  }

  async getScrollPosition(): Promise<{ top: number; left: number }> {
    return this.viewport.evaluate((el) => ({
      top: el.scrollTop,
      left: el.scrollLeft,
    }));
  }

  async scrollToCell(row: number, col: number) {
    await this.page.evaluate(({ r, c }) => {
      // @ts-ignore
      window.grid?.scrollToCell?.(r, c);
    }, { r: row, c: col });
    await this.page.waitForTimeout(100);
  }

  // Grid dimensions
  async getRowCount(): Promise<number> {
    return this.page.evaluate(() => {
      // @ts-ignore
      return window.grid?.rowCount ?? 0;
    });
  }

  async getColumnCount(): Promise<number> {
    return this.page.evaluate(() => {
      // @ts-ignore
      return window.grid?.colCount ?? 0;
    });
  }

  async getVisibleRange() {
    return this.page.evaluate(() => {
      // @ts-ignore
      return window.grid?.getVisibleRange?.();
    });
  }

  async getVisibleCellCount(): Promise<number> {
    return this.cells.count();
  }

  // Selection
  async selectCell(row: number, col: number) {
    await this.clickCell(row, col);
  }

  async selectRange(startRow: number, startCol: number, endRow: number, endCol: number) {
    await this.clickCell(startRow, startCol);
    await this.page.keyboard.down('Shift');
    await this.clickCell(endRow, endCol);
    await this.page.keyboard.up('Shift');
  }

  async selectMultiple(cells: Array<{ row: number; col: number }>) {
    await this.page.keyboard.down('Control');
    for (const { row, col } of cells) {
      await this.clickCell(row, col);
    }
    await this.page.keyboard.up('Control');
  }

  // Editing
  async startEdit(row: number, col: number) {
    await this.doubleClickCell(row, col);
    await this.page.waitForTimeout(50);
  }

  async editCell(row: number, col: number, value: string) {
    await this.startEdit(row, col);
    const cell = await this.getCell(row, col);
    const input = cell.locator('input, textarea').first();
    await input.fill(value);
    await input.press('Enter');
    await this.page.waitForTimeout(50);
  }

  async cancelEdit() {
    await this.page.keyboard.press('Escape');
  }

  // Headers
  async getHeader(col: number): Promise<Locator> {
    return this.headers.nth(col);
  }

  async clickHeader(col: number) {
    const header = await this.getHeader(col);
    await header.click();
  }

  async doubleClickHeader(col: number) {
    const header = await this.getHeader(col);
    await header.dblclick();
  }

  // Sorting
  async sortByColumn(col: number) {
    await this.clickHeader(col);
    await this.page.waitForTimeout(100);
  }

  async toggleSort(col: number) {
    await this.clickHeader(col);
    await this.page.waitForTimeout(100);
  }

  // Column operations
  async resizeColumn(col: number, deltaX: number) {
    const header = await this.getHeader(col);
    const box = await header.boundingBox();
    if (!box) throw new Error('Header not visible');

    // Hover near right edge to show resize handle
    await this.page.mouse.move(box.x + box.width - 3, box.y + box.height / 2);
    await this.page.waitForTimeout(100);

    // Drag to resize
    await this.page.mouse.down();
    await this.page.mouse.move(box.x + box.width + deltaX, box.y + box.height / 2);
    await this.page.mouse.up();
    await this.page.waitForTimeout(100);
  }

  async dragColumn(fromCol: number, toCol: number) {
    const fromHeader = await this.getHeader(fromCol);
    const toHeader = await this.getHeader(toCol);

    const fromBox = await fromHeader.boundingBox();
    const toBox = await toHeader.boundingBox();

    if (!fromBox || !toBox) throw new Error('Headers not visible');

    await this.page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(toBox.x + toBox.width / 2, toBox.y + toBox.height / 2);
    await this.page.mouse.up();
    await this.page.waitForTimeout(100);
  }

  // Keyboard shortcuts
  async pressKey(key: string) {
    await this.page.keyboard.press(key);
    await this.page.waitForTimeout(50);
  }

  async copy() {
    await this.page.keyboard.press('Control+C');
    await this.page.waitForTimeout(50);
  }

  async paste() {
    await this.page.keyboard.press('Control+V');
    await this.page.waitForTimeout(50);
  }

  async undo() {
    await this.page.keyboard.press('Control+Z');
    await this.page.waitForTimeout(100);
  }

  async redo() {
    await this.page.keyboard.press('Control+Y');
    await this.page.waitForTimeout(100);
  }

  async selectAll() {
    await this.page.keyboard.press('Control+A');
    await this.page.waitForTimeout(50);
  }

  // Event helpers
  async waitForEvent(eventName: string, timeout = 1000): Promise<any> {
    return this.page.evaluate((name) => {
      return new Promise((resolve) => {
        // @ts-ignore
        const handler = (event: any) => {
          // @ts-ignore
          window.grid?.off(name, handler);
          resolve(event);
        };
        // @ts-ignore
        window.grid?.on(name, handler);
      });
    }, eventName);
  }

  // Data operations
  async setData(data: any[][]) {
    await this.page.evaluate((d) => {
      // @ts-ignore
      window.grid?.setData(d);
    }, data);
    await this.page.waitForTimeout(100);
  }

  async getData(): Promise<any[][]> {
    return this.page.evaluate(() => {
      // @ts-ignore
      return window.grid?.getData?.() ?? [];
    });
  }

  // Filtering
  async setFilter(column: number, operator: string, value: any) {
    await this.page.evaluate(({ col, op, val }) => {
      // @ts-ignore
      window.grid?.setFilter(col, op, val);
    }, { col: column, op: operator, val: value });
    await this.page.waitForTimeout(100);
  }

  async clearFilters() {
    await this.page.evaluate(() => {
      // @ts-ignore
      window.grid?.clearFilters();
    });
    await this.page.waitForTimeout(100);
  }

  // Pagination
  async goToPage(page: number) {
    await this.page.evaluate((p) => {
      // @ts-ignore
      window.grid?.goToPage(p);
    }, page);
    await this.page.waitForTimeout(100);
  }

  async nextPage() {
    await this.page.evaluate(() => {
      // @ts-ignore
      window.grid?.nextPage();
    });
    await this.page.waitForTimeout(100);
  }

  async previousPage() {
    await this.page.evaluate(() => {
      // @ts-ignore
      window.grid?.previousPage();
    });
    await this.page.waitForTimeout(100);
  }

  // Visual regression
  async takeScreenshot(name: string) {
    return this.grid.screenshot({ path: `screenshots/${name}.png` });
  }

  async compareScreenshot(name: string) {
    const screenshot = await this.grid.screenshot();
    return screenshot;
  }
}
