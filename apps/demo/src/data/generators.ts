import { names, departments, priorities, categories, tagOptions } from '../config/constants';

/**
 * Generate test data - 100K rows x 18 columns (including new renderer showcase columns)
 */
export function generateData(rowCount: number, colCount: number): any[][] {
  const data: any[][] = [];

  for (let row = 0; row < rowCount; row++) {
    const rowData: any[] = [];
    for (let col = 0; col < colCount; col++) {
      switch (col) {
        case 0: // ID
          rowData.push(row + 1);
          break;
        case 1: // Name
          rowData.push(`${names[row % names.length]} #${row}`);
          break;
        case 2: // Department
          rowData.push(departments[row % departments.length]);
          break;

        // NEW RENDERER COLUMNS START HERE
        case 3: // Active (CheckboxRenderer)
          rowData.push(row % 2 === 0);
          break;
        case 4: // Progress (ProgressBarRenderer)
          rowData.push((row % 100) + 1);
          break;
        case 5: // Website (LinkRenderer)
          rowData.push(`https://example.com/user/${row}`);
          break;
        case 6: // Actions (ButtonRenderer) - value doesn't matter, button shows label
          rowData.push('Actions');
          break;
        case 7: // Created Date (DateRenderer)
          const baseDate = new Date('2020-01-01');
          const daysOffset = row % 1000;
          rowData.push(new Date(baseDate.getTime() + daysOffset * 24 * 60 * 60 * 1000));
          break;
        case 8: // Date Range (DateRangeRenderer)
          const startDate = new Date('2024-01-01');
          const startOffset = row % 365;
          const rangeStart = new Date(startDate.getTime() + startOffset * 24 * 60 * 60 * 1000);
          const duration = 7 + (row % 30); // 7 to 37 days duration
          const rangeEnd = new Date(rangeStart.getTime() + duration * 24 * 60 * 60 * 1000);
          rowData.push({ start: rangeStart, end: rangeEnd });
          break;
        case 9: // Priority (SelectRenderer)
          rowData.push(priorities[row % priorities.length]);
          break;
        case 10: // Tags (ChipRenderer) - array of chip objects with varied counts to test auto-height
          // Create variety: some rows with many tags (will wrap), some with few
          // Every 5th row gets 5-6 tags to demonstrate wrapping
          let tagCount;
          if (row % 5 === 0) {
            tagCount = 5 + (row % 2); // 5 or 6 tags
          } else if (row % 3 === 0) {
            tagCount = 3; // 3 tags
          } else {
            tagCount = 1 + (row % 2); // 1 or 2 tags
          }

          const chips = [];
          for (let i = 0; i < tagCount; i++) {
            const tagIdx = (row + i) % tagOptions.length;
            chips.push({
              label: tagOptions[tagIdx],
              value: tagOptions[tagIdx].toLowerCase(),
              color: ['#e3f2fd', '#f3e5f5', '#e8f5e9', '#fff3e0', '#fce4ec', '#e0f2f1'][tagIdx],
              textColor: '#000'
            });
          }
          rowData.push(chips);
          break;
        case 11: // Tags (duplicate for Fixed + Scroll column) - same as case 10
          // Reuse the same chip data to demonstrate different overflow modes
          const tagCount2 = row % 5 === 0 ? 5 + (row % 2) : (row % 3 === 0 ? 3 : 1 + (row % 2));
          const chips2 = [];
          for (let i = 0; i < tagCount2; i++) {
            const tagIdx = (row + i) % tagOptions.length;
            chips2.push({
              label: tagOptions[tagIdx],
              value: tagOptions[tagIdx].toLowerCase(),
              color: ['#e3f2fd', '#f3e5f5', '#e8f5e9', '#fff3e0', '#fce4ec', '#e0f2f1'][tagIdx],
              textColor: '#000'
            });
          }
          rowData.push(chips2);
          break;
        case 12: // Category (DropdownRenderer)
          rowData.push(categories[row % categories.length]);
          break;
        // NEW RENDERER COLUMNS END HERE

        case 13: // Salary
          rowData.push(50000 + (row % 100000));
          break;
        case 14: // Years
          rowData.push(1 + (row % 30));
          break;
        case 15: // Status
          rowData.push(row % 3 === 0 ? 'Active' : row % 3 === 1 ? 'On Leave' : 'Remote');
          break;
        case 16: // Email
          rowData.push(`user${row}@company.com`);
          break;
        case 17: // Phone
          rowData.push(`+1-555-${String(row).padStart(4, '0')}`);
          break;
        case 18: // Score
          rowData.push((row % 100) + 1);
          break;
        case 19: // Notes
          rowData.push(`Employee record for ID ${row + 1}`);
          break;
        default:
          rowData.push(`Cell ${row},${col}`);
      }
    }
    data.push(rowData);
  }

  return data;
}

/**
 * Generate random data
 */
export function generateRandomData(rowCount: number, colCount: number): any[][] {
  const data: any[][] = [];
  for (let row = 0; row < rowCount; row++) {
    const rowData: any[] = [];
    for (let col = 0; col < colCount; col++) {
      rowData.push(Math.random() > 0.5 ? Math.floor(Math.random() * 10000) : `Rand ${Math.random().toFixed(4)}`);
    }
    data.push(rowData);
  }
  return data;
}
