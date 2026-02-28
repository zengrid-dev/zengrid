import type { ZenGridTheme } from '../theme.interface';

export const solarizedTheme: ZenGridTheme = {
  name: 'Solarized',
  id: 'solarized',
  mode: 'light',
  colors: {
    background: {
      primary: '#fdf6e3',
      secondary: '#eee8d5',
      hover: '#e9e2cd',
      selected: '#d3e8f0',
      active: '#fdf6e3',
      editing: '#fdf6e3',
      disabled: '#eee8d5',
    },
    border: {
      default: '#eee8d5',
      active: '#268bd2',
      selected: '#268bd2',
      editing: '#859900',
      focus: '#268bd2',
    },
    text: {
      primary: '#657b83',
      secondary: '#93a1a1',
      disabled: '#c0c4bb',
      negative: '#dc322f',
      link: '#268bd2',
    },
    state: {
      success: '#859900',
      warning: '#b58900',
      error: '#dc322f',
      info: '#268bd2',
    },
    scrollbar: {
      thumb: 'rgba(101, 123, 131, 0.3)',
      thumbHover: 'rgba(101, 123, 131, 0.5)',
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
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 2px 4px rgba(0, 0, 0, 0.1)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.15)',
  },
  transitions: {
    fast: '0.1s ease',
    normal: '0.2s ease',
    slow: '0.3s ease',
  },
};
