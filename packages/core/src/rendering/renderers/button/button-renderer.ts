import type { CellRenderer, RenderParams } from '../renderer.interface';
import { escapeHtml } from '../renderer-utils';

/**
 * Configuration options for ButtonRenderer
 */
export interface ButtonRendererOptions {
  /** Button label text (string or function that returns label based on params) */
  label?: string | ((params: RenderParams) => string);
  /** Custom CSS class for the button */
  className?: string;
  /** Callback when button is clicked (default: logs warning) */
  onClick?: (params: RenderParams) => void;
  /** Whether the button should be disabled (boolean or function) */
  disabled?: boolean | ((params: RenderParams) => boolean);
  /** Optional icon HTML or emoji to display before label */
  icon?: string;
  /** Button variant/type for styling */
  variant?: 'button' | 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
}

/**
 * ButtonRenderer - Renders clickable action buttons in grid cells
 *
 * Features:
 * - Clickable buttons with custom onClick handlers
 * - Dynamic or static labels
 * - Disabled state support (static or computed per row)
 * - Optional icon support (emoji or HTML)
 * - 6 button variants for different styles (button, primary, secondary, danger, success, warning)
 * - 3 size variants (small, medium, large)
 * - Full ARIA accessibility support
 * - Efficient event handling with proper cleanup
 * - Data attributes for debugging and testing
 *
 * Performance: Optimized for virtual scrolling with update() method
 *
 * @example
 * ```typescript
 * // Simple button
 * const renderer = new ButtonRenderer({
 *   label: 'Delete',
 *   onClick: (params) => {
 *     console.log('Delete row:', params.cell.row);
 *   }
 * });
 *
 * // Dynamic label based on row data
 * const renderer = new ButtonRenderer({
 *   label: (params) => params.rowData?.status === 'active' ? 'Deactivate' : 'Activate',
 *   onClick: (params) => {
 *     toggleStatus(params.rowData);
 *   }
 * });
 *
 * // With icon and disabled state
 * const renderer = new ButtonRenderer({
 *   label: 'Edit',
 *   icon: '✏️',
 *   variant: 'primary',
 *   size: 'large',
 *   disabled: (params) => params.rowData?.locked === true,
 *   onClick: (params) => {
 *     editRow(params.rowData);
 *   }
 * });
 * ```
 */
export class ButtonRenderer implements CellRenderer {
  private options: Required<
    Omit<ButtonRendererOptions, 'label' | 'className' | 'disabled' | 'icon'>
  > & {
    label?: string | ((params: RenderParams) => string);
    className?: string;
    disabled?: boolean | ((params: RenderParams) => boolean);
    icon?: string;
  };
  private eventHandlers: Map<HTMLElement, (e: Event) => void>;
  private currentParams: Map<HTMLElement, RenderParams>;

  /**
   * Creates a new ButtonRenderer instance
   *
   * @param options - Configuration options for the button renderer
   */
  constructor(options: ButtonRendererOptions = {}) {
    // Provide default onClick that logs a warning
    const defaultOnClick = (params: RenderParams) => {
      console.warn(
        'ButtonRenderer: No onClick handler provided. Cell:',
        params.cell,
        'Value:',
        params.value
      );
    };

    this.options = {
      variant: options.variant ?? 'button',
      size: options.size ?? 'medium',
      onClick: options.onClick ?? defaultOnClick,
      label: options.label,
      className: options.className,
      disabled: options.disabled,
      icon: options.icon,
    };
    this.eventHandlers = new Map();
    this.currentParams = new Map();
  }

  /**
   * Initial render - creates button structure
   */
  render(element: HTMLElement, params: RenderParams): void {
    element.classList.add('zg-cell-button');

    // Create button element
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'zg-button';

    // Add click handler
    const handler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      // Use latest params from update()
      const currentParams = this.currentParams.get(element) || params;

      // Check if disabled at click time
      if (this.isDisabled(currentParams)) {
        return;
      }

      try {
        this.options.onClick(currentParams);
      } catch (error) {
        console.error('ButtonRenderer onClick error:', error);
      }
    };

    button.addEventListener('click', handler);
    this.eventHandlers.set(element, handler);

    element.appendChild(button);

    // Set initial state via update()
    this.update(element, params);
  }

  /**
   * Update existing button - called on value/state changes
   * Optimized for performance during scrolling
   */
  update(element: HTMLElement, params: RenderParams): void {
    this.currentParams.set(element, params);
    const button = element.querySelector('button');
    if (!button) return;

    // Get current state
    const label = this.getLabel(params);
    const disabled = this.isDisabled(params);

    // Update button content
    let buttonContent = '';
    if (this.options.icon) {
      buttonContent += `<span class="button-icon">${this.options.icon}</span>`;
    }
    if (label !== null && label !== undefined) {
      buttonContent += `<span class="button-label">${escapeHtml(label)}</span>`;
    }
    button.innerHTML = buttonContent;

    // Update classes
    const classes = ['zg-button'];
    if (this.options.variant) {
      classes.push(`zg-button-${this.options.variant}`);
    }
    if (this.options.size) {
      classes.push(`zg-button-${this.options.size}`);
    }
    if (this.options.className) {
      classes.push(this.options.className);
    }
    if (disabled) {
      classes.push('zg-button-disabled');
    }
    button.className = classes.join(' ');

    // Update disabled state
    button.disabled = disabled;

    // Update ARIA attributes
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', label || 'Button');
    if (disabled) {
      button.setAttribute('aria-disabled', 'true');
    } else {
      button.removeAttribute('aria-disabled');
    }

    // Update data attributes
    button.dataset.row = String(params.cell.row);
    button.dataset.col = String(params.cell.col);
    if (params.column?.field) {
      button.dataset.field = params.column.field;
    }
    button.dataset.variant = this.options.variant;

    // Apply styles
    this.applyButtonStyles(button, disabled);
  }

  /**
   * Cleanup before element returns to pool
   */
  destroy(element: HTMLElement): void {
    // Remove event listener
    const handler = this.eventHandlers.get(element);
    if (handler) {
      const button = element.querySelector('button');
      if (button) {
        button.removeEventListener('click', handler);
      }
      this.eventHandlers.delete(element);
    }
    this.currentParams.delete(element);

    // Clear content and remove classes
    element.innerHTML = '';
    element.classList.remove('zg-cell-button');
  }

  /**
   * Optional: Return CSS class based on button state
   */
  getCellClass(params: RenderParams): string | undefined {
    const disabled = this.isDisabled(params);

    if (disabled) {
      return 'zg-button-cell-disabled';
    }

    if (this.options.variant && this.options.variant !== 'button') {
      return `zg-button-cell-${this.options.variant}`;
    }

    return undefined;
  }

  /**
   * Get the button label text
   */
  private getLabel(params: RenderParams): string {
    if (this.options.label !== undefined) {
      if (typeof this.options.label === 'function') {
        return this.options.label(params);
      }
      return this.options.label;
    }

    // Default to the cell value
    const value = params.value;
    if (value === null || value === undefined) {
      return 'Button';
    }
    return String(value);
  }

  /**
   * Check if the button is disabled
   */
  private isDisabled(params: RenderParams): boolean {
    if (this.options.disabled === undefined) {
      return false;
    }

    if (typeof this.options.disabled === 'function') {
      return this.options.disabled(params);
    }

    return this.options.disabled;
  }

  /**
   * Apply button styles based on variant, size, and disabled state
   */
  private applyButtonStyles(button: HTMLButtonElement, disabled: boolean): void {
    button.style.padding = this.getButtonPadding();
    button.style.fontSize = this.getButtonFontSize();
    button.style.border = '1px solid #ccc';
    button.style.borderRadius = '4px';
    button.style.cursor = disabled ? 'not-allowed' : 'pointer';
    button.style.backgroundColor = disabled ? '#f5f5f5' : this.getButtonColor();
    button.style.color = disabled ? '#999' : this.getButtonTextColor();
    button.style.fontWeight = '500';
    button.style.transition = 'all 0.2s ease';
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.gap = '4px';
    button.style.whiteSpace = 'nowrap';
    button.style.opacity = disabled ? '0.6' : '1';
  }

  /**
   * Get button padding based on size
   */
  private getButtonPadding(): string {
    switch (this.options.size) {
      case 'small':
        return '4px 8px';
      case 'large':
        return '10px 20px';
      case 'medium':
      default:
        return '6px 12px';
    }
  }

  /**
   * Get button font size based on size
   */
  private getButtonFontSize(): string {
    switch (this.options.size) {
      case 'small':
        return '12px';
      case 'large':
        return '16px';
      case 'medium':
      default:
        return '14px';
    }
  }

  /**
   * Get button background color based on variant
   */
  private getButtonColor(): string {
    switch (this.options.variant) {
      case 'primary':
        return '#007bff';
      case 'secondary':
        return '#6c757d';
      case 'danger':
        return '#dc3545';
      case 'success':
        return '#28a745';
      case 'warning':
        return '#ffc107';
      case 'button':
      default:
        return '#fff';
    }
  }

  /**
   * Get button text color based on variant
   */
  private getButtonTextColor(): string {
    switch (this.options.variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
      case 'success':
        return '#fff';
      case 'warning':
        return '#212529';
      case 'button':
      default:
        return '#333';
    }
  }
}

/**
 * Factory function to create a ButtonRenderer instance
 *
 * @example
 * ```typescript
 * // In column definition
 * const column = {
 *   field: 'action',
 *   header: 'Actions',
 *   renderer: 'button', // Registered name
 * };
 *
 * // Or create directly
 * const renderer = createButtonRenderer({
 *   label: 'Delete',
 *   variant: 'danger',
 *   icon: '🗑️',
 *   onClick: (params) => {
 *     console.log('Delete row:', params.cell.row);
 *   }
 * });
 * ```
 */
export function createButtonRenderer(options: ButtonRendererOptions): ButtonRenderer {
  return new ButtonRenderer(options);
}
