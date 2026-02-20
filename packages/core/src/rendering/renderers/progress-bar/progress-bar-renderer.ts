import type { CellRenderer, RenderParams } from '../renderer.interface';

/**
 * Color threshold configuration for progress bar
 */
export interface ProgressColorThreshold {
  /** Threshold value (0-100) */
  value: number;
  /** Color to use when progress >= threshold */
  color: string;
}

/**
 * Configuration options for ProgressBarRenderer
 */
export interface ProgressBarRendererOptions {
  /** Minimum value (default: 0) */
  min?: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Whether to show percentage text (default: true) */
  showValue?: boolean;
  /** Custom format function for displayed value */
  valueFormatter?: (value: number, percentage: number) => string;
  /** Single color for progress bar */
  color?: string;
  /** Color thresholds for dynamic coloring (e.g., red < 30, yellow < 70, green >= 70) */
  colorThresholds?: ProgressColorThreshold[];
  /** Background color for empty portion */
  backgroundColor?: string;
  /** Height of progress bar in pixels (default: 20) */
  height?: number;
  /** Border radius in pixels (default: 4) */
  borderRadius?: number;
  /** Whether to animate progress bar (default: false) */
  animated?: boolean;
  /** Custom CSS class for the progress bar */
  className?: string;
  /** Callback when progress bar is clicked */
  onClick?: (value: number, params: RenderParams) => void;
}

/**
 * ProgressBarRenderer - Renders a visual progress bar (0-100%)
 *
 * Features:
 * - Visual progress bar with customizable colors
 * - Percentage text display (optional)
 * - Color thresholds (e.g., red/yellow/green based on value)
 * - Min/max value support for custom ranges
 * - Custom value formatting
 * - Smooth animations (optional)
 * - ARIA attributes for accessibility
 * - Event handlers for interactions
 *
 * Performance: Optimized for virtual scrolling with update() method
 *
 * @example
 * ```typescript
 * const renderer = new ProgressBarRenderer({
 *   colorThresholds: [
 *     { value: 0, color: '#dc3545' },  // red for 0-30%
 *     { value: 30, color: '#ffc107' }, // yellow for 30-70%
 *     { value: 70, color: '#28a745' }  // green for 70-100%
 *   ],
 *   showValue: true,
 *   animated: true
 * });
 * ```
 */
export class ProgressBarRenderer implements CellRenderer {
  private options: Required<Omit<ProgressBarRendererOptions, 'color' | 'colorThresholds' | 'valueFormatter' | 'onClick'>> & {
    color?: string;
    colorThresholds?: ProgressColorThreshold[];
    valueFormatter?: (value: number, percentage: number) => string;
    onClick?: (value: number, params: RenderParams) => void;
  };
  private eventHandlers: Map<HTMLElement, (e: Event) => void>;

  constructor(options: ProgressBarRendererOptions = {}) {
    this.options = {
      min: options.min ?? 0,
      max: options.max ?? 100,
      showValue: options.showValue ?? true,
      valueFormatter: options.valueFormatter,
      color: options.color,
      colorThresholds: options.colorThresholds,
      backgroundColor: options.backgroundColor ?? '#e9ecef',
      height: options.height ?? 20,
      borderRadius: options.borderRadius ?? 4,
      animated: options.animated ?? false,
      className: options.className ?? 'zg-progress-bar',
      onClick: options.onClick,
    };

    this.eventHandlers = new Map();
  }

  /**
   * Initial render - creates progress bar structure
   */
  render(element: HTMLElement, params: RenderParams): void {
    // Clean up existing content on re-render
    this.destroy(element);

    // Create progress bar container
    const container = this.createContainer();

    // Create value text (if enabled)
    if (this.options.showValue) {
      const valueText = document.createElement('span');
      valueText.className = `${this.options.className}-text`;
      valueText.style.cssText = `
        font-size: 12px;
        font-weight: 500;
        color: #495057;
        min-width: 45px;
        text-align: right;
      `;
      container.appendChild(valueText);
    }

    // Create progress bar wrapper and fill
    const wrapper = document.createElement('div');
    wrapper.className = `${this.options.className}-wrapper`;
    wrapper.style.cssText = `
      flex: 1;
      height: ${this.options.height}px;
      background-color: ${this.options.backgroundColor};
      border-radius: ${this.options.borderRadius}px;
      overflow: hidden;
      position: relative;
    `;

    const fill = document.createElement('div');
    fill.className = `${this.options.className}-fill`;
    fill.style.cssText = `
      height: 100%;
      border-radius: ${this.options.borderRadius}px;
      ${this.options.animated ? 'transition: width 0.3s ease, background-color 0.3s ease;' : ''}
    `;

    wrapper.appendChild(fill);
    container.appendChild(wrapper);
    element.appendChild(container);

    // Attach click event handler if provided
    if (this.options.onClick) {
      const handler = (e: Event) => {
        e.stopPropagation();
        const rawValue = this.parseValue(params.value);
        this.options.onClick!(rawValue, params);
      };
      container.addEventListener('click', handler);
      this.eventHandlers.set(element, handler);
      container.style.cursor = 'pointer';
    }

    // Set initial state via update()
    this.update(element, params);
  }

  /**
   * Update existing progress bar - called on value changes
   * Optimized for performance during scrolling
   */
  update(element: HTMLElement, params: RenderParams): void {
    const container = element.querySelector(`.${this.options.className}-container`) as HTMLElement;
    if (!container) return;

    // Parse and validate value
    const rawValue = this.parseValue(params.value);
    const percentage = this.calculatePercentage(rawValue);
    const clampedPercentage = Math.max(0, Math.min(100, percentage));

    // Update value text (if enabled)
    if (this.options.showValue) {
      const valueText = container.querySelector(`.${this.options.className}-text`) as HTMLSpanElement;
      if (valueText) {
        if (this.options.valueFormatter) {
          valueText.textContent = this.options.valueFormatter(rawValue, clampedPercentage);
        } else {
          valueText.textContent = `${clampedPercentage.toFixed(0)}%`;
        }
      }
    }

    // Update progress bar fill
    const fill = container.querySelector(`.${this.options.className}-fill`) as HTMLDivElement;
    if (fill) {
      const color = this.getProgressColor(clampedPercentage);
      fill.style.width = `${clampedPercentage}%`;
      fill.style.backgroundColor = color;

      // Set data attributes for testing/debugging
      fill.dataset.percentage = String(clampedPercentage.toFixed(2));
      fill.dataset.value = String(rawValue);
      fill.dataset.row = String(params.cell.row);
      fill.dataset.col = String(params.cell.col);
      if (params.column?.field) {
        fill.dataset.field = params.column.field;
      }
    }

    // Update ARIA attributes
    this.setAriaAttributes(container, clampedPercentage, rawValue);
  }

  /**
   * Cleanup before element returns to pool
   */
  destroy(element: HTMLElement): void {
    // Remove event listener
    const handler = this.eventHandlers.get(element);
    if (handler) {
      const container = element.querySelector(`.${this.options.className}-container`);
      if (container) {
        container.removeEventListener('click', handler);
      }
      this.eventHandlers.delete(element);
    }

    // Clear content
    element.innerHTML = '';
  }

  /**
   * Optional: Return CSS class based on progress value
   */
  getCellClass(params: RenderParams): string | undefined {
    const rawValue = this.parseValue(params.value);
    const percentage = this.calculatePercentage(rawValue);

    if (percentage >= 100) {
      return 'zg-progress-complete';
    } else if (percentage >= 75) {
      return 'zg-progress-high';
    } else if (percentage >= 50) {
      return 'zg-progress-medium';
    } else if (percentage >= 25) {
      return 'zg-progress-low';
    }
    return 'zg-progress-minimal';
  }

  /**
   * Parse value to number
   */
  private parseValue(value: any): number {
    if (value === null || value === undefined || value === '') {
      return this.options.min;
    }

    const parsed = typeof value === 'number' ? value : parseFloat(String(value));
    return isNaN(parsed) ? this.options.min : parsed;
  }

  /**
   * Calculate percentage from value
   */
  private calculatePercentage(value: number): number {
    const { min, max } = this.options;
    if (max === min) return 0;
    return ((value - min) / (max - min)) * 100;
  }

  /**
   * Get color for progress bar based on percentage
   */
  private getProgressColor(percentage: number): string {
    // If single color is specified, use it
    if (this.options.color) {
      return this.options.color;
    }

    // If color thresholds are specified, find appropriate color
    if (this.options.colorThresholds && this.options.colorThresholds.length > 0) {
      // Sort thresholds by value descending
      const sortedThresholds = [...this.options.colorThresholds].sort((a, b) => b.value - a.value);

      // Find first threshold where percentage >= threshold value
      for (const threshold of sortedThresholds) {
        if (percentage >= threshold.value) {
          return threshold.color;
        }
      }

      // If no threshold matched, use the lowest threshold color
      return sortedThresholds[sortedThresholds.length - 1].color;
    }

    // Default color
    return '#007bff';
  }

  /**
   * Create container element
   */
  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = `${this.options.className}-container`;
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      height: 100%;
    `;
    return container;
  }

  /**
   * Set ARIA attributes for accessibility
   */
  private setAriaAttributes(
    container: HTMLElement,
    percentage: number,
    value: number
  ): void {
    container.setAttribute('role', 'progressbar');
    container.setAttribute('aria-valuenow', String(value));
    container.setAttribute('aria-valuemin', String(this.options.min));
    container.setAttribute('aria-valuemax', String(this.options.max));
    container.setAttribute('aria-valuetext', `${percentage.toFixed(0)}% complete`);
  }
}

/**
 * Factory function to create ProgressBarRenderer
 *
 * @example
 * ```typescript
 * // In column definition
 * const column = {
 *   field: 'completion',
 *   header: 'Progress',
 *   renderer: 'progress', // Registered name
 * };
 *
 * // Or create directly
 * const renderer = createProgressBarRenderer({
 *   colorThresholds: [
 *     { value: 0, color: '#dc3545' },
 *     { value: 50, color: '#ffc107' },
 *     { value: 80, color: '#28a745' }
 *   ],
 *   animated: true
 * });
 * ```
 */
export function createProgressBarRenderer(
  options: ProgressBarRendererOptions = {}
): ProgressBarRenderer {
  return new ProgressBarRenderer(options);
}
