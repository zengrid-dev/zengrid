/**
 * Popup management for datetime components
 */

export { ClickOutsideManager, onClickOutside } from './click-outside';
export type { ClickOutsideRegistration } from './click-outside';

export { PopupManager, createPopupController } from './popup-manager';
export type { PopupConfig } from './popup-manager';

export {
  positionPopup,
  updatePopupPosition,
  calculatePosition,
  canShowPopup,
} from './popup-positioner';
export type { PositionOptions, PositionResult } from './popup-positioner';
