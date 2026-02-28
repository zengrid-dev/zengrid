import { Component, signal, computed } from '@angular/core';
import { ZenGridComponent } from '@zengrid/angular';
import type { ColumnDef, GridEvents } from '@zengrid/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ZenGridComponent],
  template: `
    <div class="demo-container">
      <header class="demo-header">
        <h1>ZenGrid Angular Demo</h1>
        <div class="controls">
          <button (click)="addRows()">Add 100 Rows</button>
          <button (click)="resetData()">Reset</button>
          <span class="row-count">{{ rowCount() }} rows &times; {{ columns.length }} cols</span>
        </div>
      </header>

      <div class="grid-wrapper">
        <zen-grid
          [rowCount]="rowCount()"
          [colCount]="columns.length"
          [columns]="columns"
          [data]="gridData()"
          [rowHeight]="32"
          [enableSelection]="true"
          [selectionType]="'row'"
          [enableColumnResize]="true"
          [enableKeyboardNavigation]="true"
          (cellClick)="onCellClick($event)"
          (selectionChange)="onSelectionChange($event)"
        />
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      padding: 16px;
      gap: 12px;
    }
    .demo-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .demo-header h1 {
      font-size: 1.25rem;
      font-weight: 600;
    }
    .controls {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .controls button {
      padding: 6px 14px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
      font-size: 0.875rem;
    }
    .controls button:hover {
      background: #e8e8e8;
    }
    .row-count {
      font-size: 0.8rem;
      color: #888;
    }
    .grid-wrapper {
      flex: 1;
      min-height: 0;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }
  `],
})
export class AppComponent {
  readonly columns: ColumnDef[] = [
    { field: 'id', header: 'ID', width: 60 },
    { field: 'name', header: 'Name', width: 150 },
    { field: 'email', header: 'Email', width: 220 },
    { field: 'department', header: 'Department', width: 130 },
    { field: 'role', header: 'Role', width: 140 },
    { field: 'salary', header: 'Salary', width: 100 },
    { field: 'status', header: 'Status', width: 90 },
    { field: 'joinDate', header: 'Join Date', width: 110 },
  ];

  private initialRowCount = 200;
  readonly rowCount = signal(this.initialRowCount);
  readonly gridData = computed(() => this.generateData(this.rowCount()));

  private generateData(rows: number): any[][] {
    const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Design'];
    const roles = ['Manager', 'Senior', 'Junior', 'Lead', 'Director', 'Intern'];
    const statuses = ['Active', 'On Leave', 'Remote'];
    const firstNames = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Drew'];
    const lastNames = ['Smith', 'Johnson', 'Lee', 'Chen', 'Patel', 'Garcia', 'Kim', 'Nguyen'];

    const data: any[][] = [];
    for (let i = 0; i < rows; i++) {
      const first = firstNames[i % firstNames.length];
      const last = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
      data.push([
        i + 1,
        `${first} ${last}`,
        `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
        departments[i % departments.length],
        roles[i % roles.length],
        `$${(50000 + Math.floor(Math.random() * 100000)).toLocaleString()}`,
        statuses[i % statuses.length],
        `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      ]);
    }
    return data;
  }

  addRows(): void {
    this.rowCount.update(c => c + 100);
  }

  resetData(): void {
    this.rowCount.set(this.initialRowCount);
  }

  onCellClick(event: GridEvents['cell:click']): void {
    console.log('Cell clicked:', event);
  }

  onSelectionChange(event: GridEvents['selection:change']): void {
    console.log('Selection changed:', event);
  }
}
