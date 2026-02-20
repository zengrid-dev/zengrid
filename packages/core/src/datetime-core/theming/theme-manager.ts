/**
 * CSS variable theming for datetime components
 *
 * Provides a unified theming system that works with vanilla-calendar-pro
 * and maintains consistency with ZenGrid's design system.
 */

export type DatetimeTheme = 'light' | 'dark' | 'auto';

export interface ThemeConfig {
  /** Primary accent color */
  primaryColor?: string;
  /** Primary color hover state */
  primaryHoverColor?: string;
  /** Text color */
  textColor?: string;
  /** Secondary text color */
  textSecondaryColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Popup background color */
  popupBackgroundColor?: string;
  /** Border color */
  borderColor?: string;
  /** Border radius */
  borderRadius?: string;
  /** Focus ring color */
  focusRingColor?: string;
  /** Error color */
  errorColor?: string;
  /** Today highlight color */
  todayColor?: string;
  /** Selected date color */
  selectedColor?: string;
  /** Range highlight color */
  rangeColor?: string;
  /** Font family */
  fontFamily?: string;
  /** Font size */
  fontSize?: string;
}

const DEFAULT_LIGHT_THEME: Required<ThemeConfig> = {
  primaryColor: '#2563eb',
  primaryHoverColor: '#1d4ed8',
  textColor: '#1f2937',
  textSecondaryColor: '#6b7280',
  backgroundColor: '#ffffff',
  popupBackgroundColor: '#ffffff',
  borderColor: '#e5e7eb',
  borderRadius: '6px',
  focusRingColor: 'rgba(37, 99, 235, 0.5)',
  errorColor: '#dc2626',
  todayColor: '#dbeafe',
  selectedColor: '#2563eb',
  rangeColor: '#eff6ff',
  fontFamily: 'inherit',
  fontSize: '14px',
};

const DEFAULT_DARK_THEME: Required<ThemeConfig> = {
  primaryColor: '#3b82f6',
  primaryHoverColor: '#60a5fa',
  textColor: '#f9fafb',
  textSecondaryColor: '#9ca3af',
  backgroundColor: '#1f2937',
  popupBackgroundColor: '#1f2937',
  borderColor: '#374151',
  borderRadius: '6px',
  focusRingColor: 'rgba(59, 130, 246, 0.5)',
  errorColor: '#f87171',
  todayColor: '#1e3a5f',
  selectedColor: '#3b82f6',
  rangeColor: '#1e293b',
  fontFamily: 'inherit',
  fontSize: '14px',
};

/**
 * Theme manager for datetime components
 */
export class ThemeManager {
  private static instance: ThemeManager | null = null;
  private currentTheme: DatetimeTheme = 'auto';
  private customConfig: Partial<ThemeConfig> = {};
  private mediaQuery: MediaQueryList | null = null;
  private mediaQueryHandler: ((e: MediaQueryListEvent) => void) | null = null;

  private constructor() {
    this.setupAutoThemeDetection();
  }

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * Set the theme mode
   */
  setTheme(theme: DatetimeTheme): void {
    this.currentTheme = theme;
    this.applyTheme();
  }

  /**
   * Get the current theme mode
   */
  getTheme(): DatetimeTheme {
    return this.currentTheme;
  }

  /**
   * Get the resolved theme (light/dark, resolves 'auto')
   */
  getResolvedTheme(): 'light' | 'dark' {
    if (this.currentTheme === 'auto') {
      return this.systemPrefersDark() ? 'dark' : 'light';
    }
    return this.currentTheme;
  }

  /**
   * Set custom theme configuration
   */
  setConfig(config: Partial<ThemeConfig>): void {
    this.customConfig = { ...this.customConfig, ...config };
    this.applyTheme();
  }

  /**
   * Set a single CSS variable
   */
  setCSSVariable(name: keyof ThemeConfig, value: string): void {
    this.customConfig[name] = value;
    document.documentElement.style.setProperty(`--zg-datetime-${this.toKebabCase(name)}`, value);
  }

  /**
   * Get the full theme configuration
   */
  getConfig(): Required<ThemeConfig> {
    const baseTheme = this.getResolvedTheme() === 'dark' ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
    return { ...baseTheme, ...this.customConfig };
  }

  /**
   * Apply theme to document
   */
  private applyTheme(): void {
    const resolvedTheme = this.getResolvedTheme();
    const config = this.getConfig();

    // Set theme attribute
    document.documentElement.setAttribute('data-zg-datetime-theme', resolvedTheme);

    // Set CSS variables
    const root = document.documentElement;
    for (const [key, value] of Object.entries(config)) {
      root.style.setProperty(`--zg-datetime-${this.toKebabCase(key)}`, value);
    }
  }

  /**
   * Set up system theme detection
   */
  private setupAutoThemeDetection(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    this.mediaQueryHandler = () => {
      if (this.currentTheme === 'auto') {
        this.applyTheme();
      }
    };

    // Use addEventListener if available (modern browsers), otherwise use deprecated addListener
    if (this.mediaQuery.addEventListener) {
      this.mediaQuery.addEventListener('change', this.mediaQueryHandler);
    } else if (this.mediaQuery.addListener) {
      this.mediaQuery.addListener(this.mediaQueryHandler);
    }

    // Apply initial theme
    this.applyTheme();
  }

  /**
   * Check if system prefers dark mode
   */
  private systemPrefersDark(): boolean {
    return this.mediaQuery?.matches ?? false;
  }

  /**
   * Convert camelCase to kebab-case
   */
  private toKebabCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Cleanup (for testing)
   */
  destroy(): void {
    if (this.mediaQuery && this.mediaQueryHandler) {
      if (this.mediaQuery.removeEventListener) {
        this.mediaQuery.removeEventListener('change', this.mediaQueryHandler);
      } else if (this.mediaQuery.removeListener) {
        this.mediaQuery.removeListener(this.mediaQueryHandler);
      }
    }
    ThemeManager.instance = null;
  }
}

/**
 * Convenience function to set theme
 */
export function setDatetimeTheme(theme: DatetimeTheme): void {
  ThemeManager.getInstance().setTheme(theme);
}

/**
 * Convenience function to set theme config
 */
export function setDatetimeThemeConfig(config: Partial<ThemeConfig>): void {
  ThemeManager.getInstance().setConfig(config);
}
