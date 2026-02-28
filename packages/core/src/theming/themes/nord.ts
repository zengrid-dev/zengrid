import type { ZenGridTheme } from '../theme.interface';

export const nordTheme: ZenGridTheme = {
  name: 'Nord',
  id: 'nord',
  mode: 'dark',
  colors: {
    background: {
      primary: '#2e3440',
      secondary: '#3b4252',
      hover: '#434c5e',
      selected: '#2e3440',
      active: '#2e3440',
      editing: '#2e3440',
      disabled: '#3b4252',
    },
    border: {
      default: '#3b4252',
      active: '#88c0d0',
      selected: '#88c0d0',
      editing: '#a3be8c',
      focus: '#88c0d0',
    },
    text: {
      primary: '#eceff4',
      secondary: '#d8dee9',
      disabled: '#4c566a',
      negative: '#bf616a',
      link: '#88c0d0',
    },
    state: {
      success: '#a3be8c',
      warning: '#ebcb8b',
      error: '#bf616a',
      info: '#81a1c1',
    },
    scrollbar: {
      thumb: 'rgba(236, 239, 244, 0.2)',
      thumbHover: 'rgba(236, 239, 244, 0.35)',
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
