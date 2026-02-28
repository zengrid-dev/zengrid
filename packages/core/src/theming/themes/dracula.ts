import type { ZenGridTheme } from '../theme.interface';

export const draculaTheme: ZenGridTheme = {
  name: 'Dracula',
  id: 'dracula',
  mode: 'dark',
  colors: {
    background: {
      primary: '#282a36',
      secondary: '#343746',
      hover: '#44475a',
      selected: '#44475a',
      active: '#282a36',
      editing: '#282a36',
      disabled: '#343746',
    },
    border: {
      default: '#44475a',
      active: '#bd93f9',
      selected: '#bd93f9',
      editing: '#50fa7b',
      focus: '#bd93f9',
    },
    text: {
      primary: '#f8f8f2',
      secondary: '#6272a4',
      disabled: '#545775',
      negative: '#ff5555',
      link: '#8be9fd',
    },
    state: {
      success: '#50fa7b',
      warning: '#f1fa8c',
      error: '#ff5555',
      info: '#8be9fd',
    },
    scrollbar: {
      thumb: 'rgba(248, 248, 242, 0.2)',
      thumbHover: 'rgba(248, 248, 242, 0.35)',
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
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 2px 4px rgba(0, 0, 0, 0.4)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.5)',
  },
  transitions: {
    fast: '0.1s ease',
    normal: '0.2s ease',
    slow: '0.3s ease',
  },
};
