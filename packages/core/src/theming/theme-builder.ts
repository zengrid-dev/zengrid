/**
 * ThemeBuilder - Fluent API for creating custom themes
 */

import type { ZenGridTheme, PartialTheme, ThemeColors } from './theme.interface';
import { getTheme, registerTheme } from './theme-registry';
import { lightTheme } from './themes/light';

/** Deep merge two objects, where source overrides target */
function deepMerge<T extends Record<string, any>>(target: T, source: Record<string, any>): T {
  const result = { ...target } as any;
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = (target as any)[key];
    if (
      sourceVal &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(targetVal, sourceVal);
    } else {
      result[key] = sourceVal;
    }
  }
  return result;
}

export class ThemeBuilder {
  private _theme: ZenGridTheme;

  constructor(base: ZenGridTheme) {
    this._theme = JSON.parse(JSON.stringify(base));
  }

  /** Set the display name and id */
  name(displayName: string, id?: string): this {
    this._theme.name = displayName;
    if (id) this._theme.id = id;
    return this;
  }

  /** Set the accent color (applies to active, selected, focus borders and link text) */
  accentColor(color: string): this {
    this._theme.colors.border.active = color;
    this._theme.colors.border.selected = color;
    this._theme.colors.border.focus = color;
    this._theme.colors.text.link = color;
    this._theme.colors.state.info = color;
    return this;
  }

  /** Set the font family */
  font(fontFamily: string): this {
    this._theme.typography.fontFamily = fontFamily;
    return this;
  }

  /** Set the font size */
  fontSize(size: string): this {
    this._theme.typography.fontSize = size;
    return this;
  }

  /** Override specific colors (deep merged) */
  colors(overrides: { [K in keyof ThemeColors]?: Partial<ThemeColors[K]> }): this {
    this._theme.colors = deepMerge(this._theme.colors, overrides);
    return this;
  }

  /** Override the mode */
  mode(mode: 'light' | 'dark'): this {
    this._theme.mode = mode;
    return this;
  }

  /** Apply partial theme overrides (deep merged) */
  override(partial: PartialTheme): this {
    this._theme = deepMerge(this._theme, partial as any);
    return this;
  }

  /** Build and return the theme without registering */
  build(): ZenGridTheme {
    return this._theme;
  }

  /** Build, register globally, and return the theme */
  register(): ZenGridTheme {
    const theme = this.build();
    registerTheme(theme);
    return theme;
  }
}

/**
 * Create a new theme based on an existing theme.
 *
 * @param baseThemeId - ID of an existing theme to base on (default: 'light')
 * @returns ThemeBuilder instance
 *
 * @example
 * ```typescript
 * const corporate = createTheme('dark')
 *   .name('Corporate', 'corporate')
 *   .accentColor('#ff6b35')
 *   .font('Inter, sans-serif')
 *   .colors({ background: { primary: '#1a1a2e' } })
 *   .register();
 * ```
 */
export function createTheme(baseThemeId: string = 'light'): ThemeBuilder {
  const base = getTheme(baseThemeId) ?? lightTheme;
  return new ThemeBuilder(base);
}
