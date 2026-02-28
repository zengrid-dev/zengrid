/**
 * Built-in themes - exports and auto-registration
 */

export { lightTheme } from './light';
export { darkTheme } from './dark';
export { materialTheme } from './material';
export { githubTheme } from './github';
export { nordTheme } from './nord';
export { draculaTheme } from './dracula';
export { oneDarkTheme } from './one-dark';
export { solarizedTheme } from './solarized';

import { registerTheme } from '../theme-registry';
import { lightTheme } from './light';
import { darkTheme } from './dark';
import { materialTheme } from './material';
import { githubTheme } from './github';
import { nordTheme } from './nord';
import { draculaTheme } from './dracula';
import { oneDarkTheme } from './one-dark';
import { solarizedTheme } from './solarized';

const builtInThemes = [
  lightTheme,
  darkTheme,
  materialTheme,
  githubTheme,
  nordTheme,
  draculaTheme,
  oneDarkTheme,
  solarizedTheme,
];

/** Register all built-in themes. Called once on import. */
export function registerBuiltInThemes(): void {
  for (const theme of builtInThemes) {
    registerTheme(theme);
  }
}

// Auto-register on first import
registerBuiltInThemes();
