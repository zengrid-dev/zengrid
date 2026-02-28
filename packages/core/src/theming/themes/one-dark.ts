import type { ZenGridTheme } from '../theme.interface';

export const oneDarkTheme: ZenGridTheme = {
  name: 'One Dark',
  id: 'one-dark',
  mode: 'dark',
  colors: {
    background: {
      primary: '#282c34',
      secondary: '#21252b',
      hover: '#2c313a',
      selected: '#2c313a',
      active: '#282c34',
      editing: '#282c34',
      disabled: '#21252b',
    },
    border: {
      default: '#3e4452',
      active: '#61afef',
      selected: '#61afef',
      editing: '#98c379',
      focus: '#61afef',
    },
    text: {
      primary: '#abb2bf',
      secondary: '#5c6370',
      disabled: '#4b5263',
      negative: '#e06c75',
      link: '#61afef',
    },
    state: {
      success: '#98c379',
      warning: '#e5c07b',
      error: '#e06c75',
      info: '#61afef',
    },
    scrollbar: {
      thumb: 'rgba(171, 178, 191, 0.2)',
      thumbHover: 'rgba(171, 178, 191, 0.35)',
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
    sm: '0 1px 2px rgba(0, 0, 0, 0.25)',
    md: '0 2px 4px rgba(0, 0, 0, 0.35)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.45)',
  },
  transitions: {
    fast: '0.1s ease',
    normal: '0.2s ease',
    slow: '0.3s ease',
  },
};
