import type { ZenGridTheme } from '../theme.interface';

export const darkTheme: ZenGridTheme = {
  name: 'Dark',
  id: 'dark',
  mode: 'dark',
  colors: {
    background: {
      primary: '#0f172a',
      secondary: '#1e293b',
      hover: '#334155',
      selected: '#064e3b',
      active: '#0f172a',
      editing: '#0f172a',
      disabled: '#1e293b',
    },
    border: {
      default: '#1e293b',
      active: '#10b981',
      selected: '#10b981',
      editing: '#34d399',
      focus: '#10b981',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
      disabled: '#475569',
      negative: '#ef4444',
      link: '#38bdf8',
    },
    state: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    scrollbar: {
      thumb: 'rgba(255, 255, 255, 0.3)',
      thumbHover: 'rgba(255, 255, 255, 0.5)',
    },
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: '14px',
    lineHeight: 1.5,
    fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
  spacing: {
    cellPaddingX: '8px',
    cellPaddingY: '0',
    headerPadding: '12px',
  },
  borders: { width: '1px', radius: '0px' },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.2)',
    md: '0 2px 4px rgba(0, 0, 0, 0.3)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.4)',
  },
  transitions: {
    fast: '0.1s ease',
    normal: '0.2s ease',
    slow: '0.3s ease',
  },
};
