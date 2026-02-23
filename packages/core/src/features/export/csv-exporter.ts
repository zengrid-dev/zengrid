/**
 * CSV Exporter
 *
 * Simple CSV/TSV export utility for grid data.
 */

export interface CSVExporterOptions {
  getValue: (row: number, col: number) => any;
  rowCount: number;
  colCount: number;
  getColumnHeader?: (col: number) => string;
}

export interface CSVExportOptions {
  rows?: number[];
  columns?: number[];
  includeHeaders?: boolean;
  delimiter?: string;
  headers?: string[];
}

export class CSVExporter {
  private getValue: (row: number, col: number) => any;
  private rowCount: number;
  private colCount: number;
  private getColumnHeader?: (col: number) => string;

  constructor(options: CSVExporterOptions) {
    this.getValue = options.getValue;
    this.rowCount = options.rowCount;
    this.colCount = options.colCount;
    this.getColumnHeader = options.getColumnHeader;
  }

  /**
   * Export data to CSV/TSV string
   */
  export(options: CSVExportOptions = {}): string {
    const delimiter = options.delimiter ?? ',';
    const rows = options.rows ?? this.range(0, this.rowCount - 1);
    const columns = options.columns ?? this.range(0, this.colCount - 1);
    const includeHeaders = options.includeHeaders ?? false;

    const lines: string[] = [];

    if (includeHeaders) {
      const headers =
        options.headers ?? columns.map((col) => this.getColumnHeader?.(col) ?? `Column ${col}`);
      lines.push(headers.map((h) => this.formatCell(h, delimiter)).join(delimiter));
    }

    for (const row of rows) {
      const rowValues = columns.map((col) => this.formatCell(this.getValue(row, col), delimiter));
      lines.push(rowValues.join(delimiter));
    }

    return lines.join('\n');
  }

  private formatCell(value: any, delimiter: string): string {
    if (value === null || value === undefined) return '';
    let str = String(value);

    // Escape quotes
    if (str.includes('"')) {
      str = str.replace(/"/g, '""');
    }

    // Wrap in quotes if needed (always quote when quotes are present)
    const needsQuotes =
      str.includes(delimiter) || str.includes('\n') || str.includes('\r') || str.includes('"');
    if (needsQuotes) {
      str = `"${str}"`;
    }

    return str;
  }

  private range(start: number, end: number): number[] {
    if (end < start) return [];
    const out: number[] = [];
    for (let i = start; i <= end; i++) {
      out.push(i);
    }
    return out;
  }
}
