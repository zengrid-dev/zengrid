import type { ZenGridTheme } from '../theme.interface';

export const githubTheme: ZenGridTheme = {
  name: 'GitHub',
  id: 'github',
  mode: 'light',
  colors: {
    background: {
      primary: '#ffffff',
      secondary: '#f6f8fa',
      hover: '#f3f4f6',
      selected: '#ddf4ff',
      active: '#ffffff',
      editing: '#ffffff',
      disabled: '#f6f8fa',
    },
    border: {
      default: '#d0d7de',
      active: '#0969da',
      selected: '#0969da',
      editing: '#1a7f37',
      focus: '#0969da',
    },
    text: {
      primary: '#1f2328',
      secondary: '#656d76',
      disabled: '#8c959f',
      negative: '#cf222e',
      link: '#0969da',
    },
    state: {
      success: '#1a7f37',
      warning: '#9a6700',
      error: '#cf222e',
      info: '#0969da',
    },
    scrollbar: {
      thumb: 'rgba(0, 0, 0, 0.2)',
      thumbHover: 'rgba(0, 0, 0, 0.35)',
    },
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif",
    fontSize: '14px',
    lineHeight: 1.5,
    fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
  spacing: {
    cellPaddingX: '8px',
    cellPaddingY: '0',
    headerPadding: '12px',
  },
  borders: { width: '1px', radius: '6px' },
  shadows: {
    sm: '0 1px 0 rgba(27, 31, 36, 0.04)',
    md: '0 3px 6px rgba(140, 149, 159, 0.15)',
    lg: '0 8px 24px rgba(140, 149, 159, 0.2)',
  },
  transitions: {
    fast: '0.1s ease',
    normal: '0.2s ease',
    slow: '0.3s ease',
  },
};
