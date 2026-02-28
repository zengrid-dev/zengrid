/**
 * ThemeRegistry - Global registry of named themes
 */

import type { ZenGridTheme } from './theme.interface';

const themes = new Map<string, ZenGridTheme>();

/** Register a theme globally */
export function registerTheme(theme: ZenGridTheme): void {
  themes.set(theme.id, theme);
}

/** Get a registered theme by id */
export function getTheme(id: string): ZenGridTheme | undefined {
  return themes.get(id);
}

/** Check if a theme is registered */
export function hasTheme(id: string): boolean {
  return themes.has(id);
}

/** List all registered theme ids */
export function listThemes(): string[] {
  return Array.from(themes.keys());
}

/** Get all registered themes */
export function getAllThemes(): ZenGridTheme[] {
  return Array.from(themes.values());
}

/** Unregister a theme */
export function unregisterTheme(id: string): boolean {
  return themes.delete(id);
}
