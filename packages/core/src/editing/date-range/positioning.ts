/**
 * Find the grid's scroll container by traversing up the DOM
 * Looks for elements with overflow: auto/scroll and actual scrollable content
 */
export function findScrollContainer(element: HTMLElement): HTMLElement | null {
  let current = element.parentElement;

  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const overflow = style.overflow;
    const overflowY = style.overflowY;
    const overflowX = style.overflowX;

    const isScrollable =
      overflow === 'auto' ||
      overflow === 'scroll' ||
      overflowY === 'auto' ||
      overflowY === 'scroll' ||
      overflowX === 'auto' ||
      overflowX === 'scroll';

    const hasScrollableContent =
      current.scrollHeight > current.clientHeight || current.scrollWidth > current.clientWidth;

    if (isScrollable && hasScrollableContent) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

/**
 * Check if the edited cell is still visible in the viewport
 */
export function isCellInViewport(
  cellElement: HTMLElement | null,
  gridScrollContainer: HTMLElement | null
): boolean {
  if (!cellElement || !gridScrollContainer) {
    return true;
  }

  const cellRect = cellElement.getBoundingClientRect();
  const containerRect = gridScrollContainer.getBoundingClientRect();

  const isVisible =
    cellRect.bottom > containerRect.top &&
    cellRect.top < containerRect.bottom &&
    cellRect.right > containerRect.left &&
    cellRect.left < containerRect.right;

  return isVisible;
}

/**
 * Position calendar popup relative to input element
 */
export function positionCalendar(
  inputElement: HTMLInputElement,
  calendarWrapper: HTMLDivElement
): void {
  const inputRect = inputElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const calendarRect = calendarWrapper.getBoundingClientRect();
  const calendarWidth = calendarRect.width > 0 ? calendarRect.width : 560;
  const calendarHeight = calendarRect.height > 0 ? calendarRect.height : 320;

  let top = inputRect.bottom + 4;
  let left = inputRect.left;

  // Vertical positioning
  const spaceBelow = viewportHeight - inputRect.bottom;
  const spaceAbove = inputRect.top;

  if (spaceBelow < calendarHeight + 8 && spaceAbove > spaceBelow) {
    top = inputRect.top - calendarHeight - 4;
  }

  if (top < 8) {
    top = 8;
  }

  if (top + calendarHeight > viewportHeight - 8) {
    top = viewportHeight - calendarHeight - 8;
  }

  // Horizontal positioning
  if (left + calendarWidth > viewportWidth - 8) {
    left = viewportWidth - calendarWidth - 8;
  }

  if (left < 8) {
    left = 8;
  }

  calendarWrapper.style.left = `${left}px`;
  calendarWrapper.style.top = `${top}px`;
}
