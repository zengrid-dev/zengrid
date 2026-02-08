/**
 * Test Data Generators for ZenGrid Tests
 *
 * Provides functions to generate various types of test data.
 */

export interface TestDataOptions {
  rows?: number;
  cols?: number;
  startRow?: number;
  startCol?: number;
}

/**
 * Generate simple numeric grid data
 */
export function generateNumericData(options: TestDataOptions = {}): number[][] {
  const { rows = 100, cols = 10, startRow = 0, startCol = 0 } = options;
  const data: number[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      row.push((startRow + r) * cols + (startCol + c));
    }
    data.push(row);
  }

  return data;
}

/**
 * Generate text grid data with patterns
 */
export function generateTextData(options: TestDataOptions = {}): string[][] {
  const { rows = 100, cols = 10 } = options;
  const data: string[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: string[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(`Cell ${r},${c}`);
    }
    data.push(row);
  }

  return data;
}

/**
 * Generate mixed type data (for renderer testing)
 */
export function generateMixedData(rows = 100): any[][] {
  const data: any[][] = [];

  for (let r = 0; r < rows; r++) {
    data.push([
      r,                                    // Number
      `Row ${r}`,                           // Text
      r % 2 === 0,                          // Boolean
      new Date(2024, 0, r + 1).toISOString().split('T')[0], // Date
      r * 10.5,                             // Decimal
      r % 3 === 0 ? 'Active' : 'Inactive', // Select
    ]);
  }

  return data;
}

/**
 * Generate data with variable row heights (for height testing)
 */
export function generateVariableHeightData(rows = 100): string[][] {
  const data: string[][] = [];
  const shortText = 'Short';
  const mediumText = 'This is a medium length text that might wrap';
  const longText = 'This is a very long text that will definitely wrap to multiple lines and cause the row height to increase significantly. Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

  for (let r = 0; r < rows; r++) {
    const row: string[] = [];
    const heightType = r % 3;

    for (let c = 0; c < 5; c++) {
      if (heightType === 0) {
        row.push(shortText);
      } else if (heightType === 1) {
        row.push(mediumText);
      } else {
        row.push(longText);
      }
    }
    data.push(row);
  }

  return data;
}

/**
 * Generate sparse data (for sparse matrix testing)
 */
export function generateSparseData(rows = 1000, cols = 100, density = 0.1): (number | null)[][] {
  const data: (number | null)[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: (number | null)[] = [];
    for (let c = 0; c < cols; c++) {
      // Only populate cells based on density
      row.push(Math.random() < density ? r * cols + c : null);
    }
    data.push(row);
  }

  return data;
}

/**
 * Generate large dataset for performance testing
 */
export function generateLargeDataset(rows = 100000, cols = 50): number[][] {
  const data: number[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(r * cols + c);
    }
    data.push(row);
  }

  return data;
}

/**
 * Generate data for sorting tests
 */
export function generateSortableData(rows = 100): any[][] {
  const names = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Henry'];
  const data: any[][] = [];

  for (let r = 0; r < rows; r++) {
    data.push([
      names[r % names.length],              // Name (string)
      Math.floor(Math.random() * 100),      // Score (number)
      new Date(2024, 0, (r % 365) + 1).toISOString().split('T')[0], // Date
      r % 2 === 0,                          // Active (boolean)
    ]);
  }

  return data;
}

/**
 * Generate data for filtering tests
 */
export function generateFilterableData(rows = 100): any[][] {
  const categories = ['A', 'B', 'C', 'D'];
  const statuses = ['Active', 'Inactive', 'Pending'];
  const data: any[][] = [];

  for (let r = 0; r < rows; r++) {
    data.push([
      `Item ${r}`,                          // Name
      categories[r % categories.length],     // Category
      Math.floor(Math.random() * 1000),     // Value
      statuses[r % statuses.length],        // Status
      r % 10 === 0 ? null : `Tag ${r % 5}`, // Optional field
    ]);
  }

  return data;
}

/**
 * Generate column definitions for testing
 */
export function generateColumnDefs(count = 10) {
  const columns = [];

  for (let i = 0; i < count; i++) {
    columns.push({
      field: `col${i}`,
      header: `Column ${i}`,
      width: 100,
      sortable: true,
      filterable: true,
      editable: true,
    });
  }

  return columns;
}

/**
 * Generate data with all renderer types
 */
export function generateRendererTestData(rows = 50): any[][] {
  const data: any[][] = [];

  for (let r = 0; r < rows; r++) {
    data.push([
      `Text ${r}`,                                    // Text
      r * 10,                                         // Number
      r % 2 === 0,                                    // Checkbox
      new Date(2024, 0, r + 1).toISOString().split('T')[0], // Date
      { start: new Date(2024, 0, r + 1), end: new Date(2024, 0, r + 7) }, // Date Range
      r / rows,                                       // Progress (0-1)
      `https://example.com/${r}`,                     // Link
      'Click Me',                                     // Button
      `https://via.placeholder.com/50?text=${r}`,     // Image
      ['Option A', 'Option B', 'Option C'][r % 3],   // Select
      ['Tag1', 'Tag2', 'Tag3'].slice(0, (r % 3) + 1), // Chips
      ['Item A', 'Item B', 'Item C'][r % 3],         // Dropdown
    ]);
  }

  return data;
}

/**
 * Generate empty data
 */
export function generateEmptyData(): any[][] {
  return [];
}

/**
 * Generate single row data
 */
export function generateSingleRowData(cols = 10): any[][] {
  const row: any[] = [];
  for (let c = 0; c < cols; c++) {
    row.push(`Cell 0,${c}`);
  }
  return [row];
}

/**
 * Generate data with null values
 */
export function generateNullData(rows = 100, cols = 10, nullProbability = 0.2): (string | null)[][] {
  const data: (string | null)[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: (string | null)[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(Math.random() < nullProbability ? null : `Cell ${r},${c}`);
    }
    data.push(row);
  }

  return data;
}

/**
 * Generate sequential data (for autofill testing)
 */
export function generateSequentialData(): any[][] {
  return [
    [1, 2, 3, 4, 5],
    [10, 20, 30, 40, 50],
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    [new Date(2024, 0, 1), new Date(2024, 0, 2), new Date(2024, 0, 3), new Date(2024, 0, 4), new Date(2024, 0, 5)],
  ];
}

/**
 * Generate formula data
 */
export function generateFormulaData(): any[][] {
  return [
    [1, 2, '=A1+B1'],
    [10, 20, '=A2+B2'],
    [5, 15, '=A3*B3'],
    [100, 50, '=A4-B4'],
  ];
}

/**
 * Wait helper for async operations in tests
 */
export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random string
 */
export function randomString(length = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate random number in range
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
