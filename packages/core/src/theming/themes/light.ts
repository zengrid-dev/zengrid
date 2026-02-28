import type { ZenGridTheme } from '../theme.interface';

export const lightTheme: ZenGridTheme = {
  name: 'Light',
  id: 'light',
  mode: 'light',
  colors: {
    background: {
      primary: '#ffffff',
      secondary: '#f5f5f5',
      hover: '#f0f4f8',
      selected: '#e3f2fd',
      active: '#ffffff',
      editing: '#ffffff',
      disabled: '#fafafa',
    },
    border: {
      default: '#e0e0e0',
      active: '#2196f3',
      selected: '#2196f3',
      editing: '#4caf50',
      focus: '#2196f3',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
      disabled: '#999999',
      negative: '#d32f2f',
      link: '#1976d2',
    },
    state: {
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3',
    },
    scrollbar: {
      thumb: 'rgba(0, 0, 0, 0.3)',
      thumbHover: 'rgba(0, 0, 0, 0.5)',
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
