/**
 * Viewport-aware popup positioning
 *
 * Uses transform for smooth, GPU-accelerated repositioning.
 * Handles viewport boundaries and flipping behavior.
 */

export interface PositionOptions {
  /** Preferred position relative to anchor (default: 'bottom-start') */
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'bottom' | 'top';
  /** Gap between anchor and popup in pixels (default: 4) */
  offset?: number;
  /** Minimum distance from viewport edges (default: 8) */
  viewportPadding?: number;
  /** Whether to flip to opposite side if not enough space (default: true) */
  flip?: boolean;
  /** Container element to constrain positioning within */
  container?: HTMLElement;
}

export interface PositionResult {
  x: number;
  y: number;
  placement: 'top' | 'bottom';
  flipped: boolean;
}

/**
 * Calculate position for a popup relative to an anchor element
 */
export function calculatePosition(
  anchor: HTMLElement,
  popup: HTMLElement,
  options: PositionOptions = {}
): PositionResult {
  const {
    placement = 'bottom-start',
    offset = 4,
    viewportPadding = 8,
    flip = true,
    container,
  } = options;

  const anchorRect = anchor.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();

  // Use estimated dimensions if popup isn't visible yet
  const popupWidth = popupRect.width > 0 ? popupRect.width : 280;
  const popupHeight = popupRect.height > 0 ? popupRect.height : 320;

  // Get container bounds
  const containerBounds = container
    ? container.getBoundingClientRect()
    : {
        top: 0,
        left: 0,
        right: window.innerWidth,
        bottom: window.innerHeight,
        width: window.innerWidth,
        height: window.innerHeight,
      };

  // Calculate available space
  const spaceAbove = anchorRect.top - containerBounds.top - viewportPadding;
  const spaceBelow = containerBounds.bottom - anchorRect.bottom - viewportPadding;
  // Note: spaceLeft/spaceRight could be used for future horizontal flip logic
  const _spaceLeft = anchorRect.left - containerBounds.left - viewportPadding;
  const _spaceRight = containerBounds.right - anchorRect.right - viewportPadding;
  void _spaceLeft;
  void _spaceRight; // Suppress unused warnings

  // Determine vertical placement
  let showAbove = placement.startsWith('top');
  let flipped = false;

  if (flip) {
    if (showAbove && spaceAbove < popupHeight && spaceBelow > spaceAbove) {
      showAbove = false;
      flipped = true;
    } else if (!showAbove && spaceBelow < popupHeight && spaceAbove > spaceBelow) {
      showAbove = true;
      flipped = true;
    }
  }

  // Calculate vertical position
  let y: number;
  if (showAbove) {
    y = anchorRect.top - popupHeight - offset;
  } else {
    y = anchorRect.bottom + offset;
  }

  // Clamp to viewport
  y = Math.max(containerBounds.top + viewportPadding, y);
  y = Math.min(containerBounds.bottom - popupHeight - viewportPadding, y);

  // Calculate horizontal position
  let x: number;
  if (placement.endsWith('end')) {
    x = anchorRect.right - popupWidth;
  } else if (placement === 'bottom' || placement === 'top') {
    x = anchorRect.left + (anchorRect.width - popupWidth) / 2;
  } else {
    x = anchorRect.left;
  }

  // Clamp to viewport horizontally
  x = Math.max(containerBounds.left + viewportPadding, x);
  x = Math.min(containerBounds.right - popupWidth - viewportPadding, x);

  return {
    x,
    y,
    placement: showAbove ? 'top' : 'bottom',
    flipped,
  };
}

/**
 * Position a popup element relative to an anchor
 * Uses CSS transform for GPU-accelerated positioning
 */
export function positionPopup(
  anchor: HTMLElement,
  popup: HTMLElement,
  options: PositionOptions = {}
): PositionResult {
  const result = calculatePosition(anchor, popup, options);

  // Use transform for smooth, GPU-accelerated positioning
  popup.style.position = 'fixed';
  popup.style.top = '0';
  popup.style.left = '0';
  popup.style.transform = `translate(${result.x}px, ${result.y}px)`;
  popup.style.willChange = 'transform';

  // Set data attribute for CSS styling based on placement
  popup.setAttribute('data-zg-placement', result.placement);

  return result;
}

/**
 * Update popup position without full recalculation
 * Used during scroll for smoother updates
 */
export function updatePopupPosition(
  anchor: HTMLElement,
  popup: HTMLElement,
  options: PositionOptions = {}
): void {
  // Use requestAnimationFrame for smooth updates
  requestAnimationFrame(() => {
    positionPopup(anchor, popup, options);
  });
}

/**
 * Check if there's enough space to show the popup
 */
export function canShowPopup(
  anchor: HTMLElement,
  popupHeight: number,
  popupWidth: number,
  viewportPadding: number = 8
): boolean {
  const anchorRect = anchor.getBoundingClientRect();

  const spaceAbove = anchorRect.top - viewportPadding;
  const spaceBelow = window.innerHeight - anchorRect.bottom - viewportPadding;
  const spaceHorizontal = window.innerWidth - 2 * viewportPadding;

  const hasVerticalSpace = spaceAbove >= popupHeight || spaceBelow >= popupHeight;
  const hasHorizontalSpace = spaceHorizontal >= popupWidth;

  return hasVerticalSpace && hasHorizontalSpace;
}
