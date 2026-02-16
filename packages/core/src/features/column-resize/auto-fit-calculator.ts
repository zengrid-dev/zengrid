/**
 * Options for auto-fit calculation
 */
export interface AutoFitCalculatorOptions {
  /** Get cell value */
  getValue: (row: number, col: number) => any;
  /** Total row count */
  rowCount: number;
  /** Get header text for a column (for including header width) */
  getHeaderText?: (col: number) => string | undefined;
  /** Get full header width including icons and indicators */
  getFullHeaderWidth?: (col: number) => number | undefined;
  /** Maximum rows to sample (default: 100) */
  sampleSize?: number;
  /** Padding to add to calculated width (default: 16) */
  padding?: number;
  /** Skip header width when calculating (default: false) */
  skipHeaderOnAutoSize?: boolean;
}

/**
 * AutoFitCalculator - Calculates optimal column width based on content
 *
 * Uses a sample of rows to estimate the maximum content width.
 * Creates a temporary off-screen element to measure text width.
 */
export class AutoFitCalculator {
  private getValue: (row: number, col: number) => any;
  private rowCount: number;
  private getHeaderText?: (col: number) => string | undefined;
  private getFullHeaderWidth?: (col: number) => number | undefined;
  private sampleSize: number;
  private padding: number;
  private skipHeaderOnAutoSize: boolean;

  // Reusable measurement element
  private measureElement: HTMLElement | null = null;
  // Separate element for header measurement (may have different font-weight)
  private headerMeasureElement: HTMLElement | null = null;

  constructor(options: AutoFitCalculatorOptions) {
    this.getValue = options.getValue;
    this.rowCount = options.rowCount;
    this.getHeaderText = options.getHeaderText;
    this.getFullHeaderWidth = options.getFullHeaderWidth;
    this.sampleSize = options.sampleSize ?? 100;
    this.padding = options.padding ?? 16;
    this.skipHeaderOnAutoSize = options.skipHeaderOnAutoSize ?? false;
  }

  /**
   * Calculate optimal width for a column
   * @param col Column index
   * @param options Override options for this calculation
   */
  calculateOptimalWidth(
    col: number,
    options?: { skipHeader?: boolean }
  ): number {
    const element = this.getMeasureElement();
    let maxWidth = 0;

    // 1. Measure header width (unless skipped)
    const skipHeader = options?.skipHeader ?? this.skipHeaderOnAutoSize;
    let headerIncludesPadding = false;

    if (!skipHeader) {
      // Prefer getFullHeaderWidth (includes icons, indicators, AND padding) over text-only
      if (this.getFullHeaderWidth) {
        const fullWidth = this.getFullHeaderWidth(col);
        if (fullWidth !== undefined) {
          maxWidth = fullWidth;
          headerIncludesPadding = true; // Full width already includes padding
        }
      } else if (this.getHeaderText) {
        // Fallback: measure text only (needs padding added later)
        const headerText = this.getHeaderText(col);
        if (headerText) {
          const headerElement = this.getHeaderMeasureElement();
          const headerWidth = this.measureTextWidth(headerElement, headerText);
          maxWidth = headerWidth;
        }
      }
    }

    // 2. Sample rows evenly distributed for content width
    const sampleIndices = this.getSampleIndices();

    for (const row of sampleIndices) {
      const value = this.getValue(row, col);
      const textWidth = this.measureTextWidth(element, value);
      // Content cells need padding, so compare text + padding
      const contentWidth = textWidth + this.padding;
      maxWidth = Math.max(maxWidth, contentWidth);
    }

    // If header already includes padding (from getFullHeaderWidth), don't add more
    // Otherwise add padding for text-only measurement
    if (headerIncludesPadding) {
      return maxWidth;
    }
    return maxWidth + this.padding;
  }

  /**
   * Get evenly distributed sample indices
   */
  private getSampleIndices(): number[] {
    if (this.rowCount <= this.sampleSize) {
      // Sample all rows
      return Array.from({ length: this.rowCount }, (_, i) => i);
    }

    // Evenly distributed sampling
    const step = this.rowCount / this.sampleSize;
    const indices: number[] = [];

    for (let i = 0; i < this.sampleSize; i++) {
      indices.push(Math.floor(i * step));
    }

    return indices;
  }

  /**
   * Measure text width using DOM element
   */
  private measureTextWidth(element: HTMLElement, value: any): number {
    const text = value == null ? '' : String(value);
    element.textContent = text;
    return element.offsetWidth;
  }

  /**
   * Get or create measurement element for cell content
   */
  private getMeasureElement(): HTMLElement {
    if (!this.measureElement) {
      this.measureElement = document.createElement('div');
      this.measureElement.style.cssText = `
        position: absolute;
        visibility: hidden;
        white-space: nowrap;
        font-family: inherit;
        font-size: inherit;
        font-weight: inherit;
      `;
      document.body.appendChild(this.measureElement);
    }
    return this.measureElement;
  }

  /**
   * Get or create measurement element for header text
   * Headers typically have bold font-weight
   */
  private getHeaderMeasureElement(): HTMLElement {
    if (!this.headerMeasureElement) {
      this.headerMeasureElement = document.createElement('div');
      this.headerMeasureElement.style.cssText = `
        position: absolute;
        visibility: hidden;
        white-space: nowrap;
        font-family: inherit;
        font-size: inherit;
        font-weight: 600;
      `;
      document.body.appendChild(this.headerMeasureElement);
    }
    return this.headerMeasureElement;
  }

  /**
   * Update row count
   */
  updateRowCount(rowCount: number): void {
    this.rowCount = rowCount;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.measureElement && this.measureElement.parentNode) {
      this.measureElement.parentNode.removeChild(this.measureElement);
      this.measureElement = null;
    }
    if (this.headerMeasureElement && this.headerMeasureElement.parentNode) {
      this.headerMeasureElement.parentNode.removeChild(this.headerMeasureElement);
      this.headerMeasureElement = null;
    }
  }
}
