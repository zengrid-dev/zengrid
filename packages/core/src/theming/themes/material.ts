import type { ZenGridTheme } from '../theme.interface';

export const materialTheme: ZenGridTheme = {
  name: 'Material',
  id: 'material',
  mode: 'light',
  colors: {
    background: {
      primary: '#fafafa',
      secondary: '#f5f5f5',
      hover: '#eeeeee',
      selected: '#e3f2fd',
      active: '#ffffff',
      editing: '#ffffff',
      disabled: '#f5f5f5',
    },
    border: {
      default: '#e0e0e0',
      active: '#1976d2',
      selected: '#1976d2',
      editing: '#388e3c',
      focus: '#1976d2',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#9e9e9e',
      negative: '#d32f2f',
      link: '#1976d2',
    },
    state: {
      success: '#388e3c',
      warning: '#f57c00',
      error: '#d32f2f',
      info: '#1976d2',
    },
    scrollbar: {
      thumb: 'rgba(0, 0, 0, 0.2)',
      thumbHover: 'rgba(0, 0, 0, 0.4)',
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif",
    fontSize: '14px',
    lineHeight: 1.5,
    fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
  spacing: {
    cellPaddingX: '16px',
    cellPaddingY: '0',
    headerPadding: '16px',
  },
  borders: { width: '1px', radius: '4px' },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    md: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
    lg: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
  },
  transitions: {
    fast: '0.1s cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
};
