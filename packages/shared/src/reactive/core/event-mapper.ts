/**
 * EventMapper - Maps handler names to DOM event names
 *
 * @description
 * Utility for converting handler names (onClick) to DOM events (click).
 * Extracted from EventDelegator for modularity.
 *
 * @internal
 */

import type { ElementEventHandlers } from './event-handler-registry';

/**
 * Event configuration
 */
interface EventConfig {
  domEvent: string;
  useCapture: boolean;
}

/**
 * Handler name to DOM event mapping
 */
const EVENT_MAP: Record<keyof ElementEventHandlers, EventConfig> = {
  onClick: { domEvent: 'click', useCapture: false },
  onDblClick: { domEvent: 'dblclick', useCapture: false },
  onMouseDown: { domEvent: 'mousedown', useCapture: false },
  onMouseUp: { domEvent: 'mouseup', useCapture: false },
  onMouseEnter: { domEvent: 'mouseenter', useCapture: false },
  onMouseLeave: { domEvent: 'mouseleave', useCapture: false },
  onContextMenu: { domEvent: 'contextmenu', useCapture: false },
  onFocus: { domEvent: 'focus', useCapture: true },  // Focus doesn't bubble
  onBlur: { domEvent: 'blur', useCapture: true },    // Blur doesn't bubble
};

export class EventMapper {
  /**
   * Get all supported handler names
   */
  static getHandlerNames(): Array<keyof ElementEventHandlers> {
    return Object.keys(EVENT_MAP) as Array<keyof ElementEventHandlers>;
  }

  /**
   * Get DOM event name from handler name
   */
  static getDomEventName(handlerName: keyof ElementEventHandlers): string {
    return EVENT_MAP[handlerName].domEvent;
  }

  /**
   * Check if event should use capture phase
   */
  static shouldUseCapture(handlerName: keyof ElementEventHandlers): boolean {
    return EVENT_MAP[handlerName].useCapture;
  }

  /**
   * Get event config
   */
  static getEventConfig(handlerName: keyof ElementEventHandlers): EventConfig {
    return EVENT_MAP[handlerName];
  }
}
