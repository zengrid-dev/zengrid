import { operators } from '../../config/operators';

export interface FilterData {
  column: number;
  operator: string;
  value: any;
  logicToNext?: 'AND' | 'OR';
}

export class FilterPanel {
  private filterPanel: HTMLElement;
  private filterRowsContainer: HTMLElement;
  private btnToggleFilter: HTMLElement;
  private btnAddFilter: HTMLElement;
  filterPreview: HTMLElement;
  filterPreviewContent: HTMLElement;
  filterWarning: HTMLElement;
  filterWarningContent: HTMLElement;

  private filterCounter = 0;
  activeFilters: Map<number, FilterData> = new Map();

  private columns: any[];

  constructor(columns: any[]) {
    this.columns = columns;

    this.filterPanel = document.getElementById('filter-panel')!;
    this.filterRowsContainer = document.getElementById('filter-rows')!;
    this.btnToggleFilter = document.getElementById('btn-toggle-filter')!;
    this.btnAddFilter = document.getElementById('btn-add-filter')!;
    this.filterPreview = document.getElementById('filter-preview')!;
    this.filterPreviewContent = document.getElementById('filter-preview-content')!;
    this.filterWarning = document.getElementById('filter-warning')!;
    this.filterWarningContent = document.getElementById('filter-warning-content')!;
  }

  setup(): void {
    // Toggle filter panel
    this.btnToggleFilter.addEventListener('click', () => {
      this.filterPanel.classList.toggle('expanded');
      const isExpanded = this.filterPanel.classList.contains('expanded');
      this.btnToggleFilter.textContent = isExpanded ? '🔽 Hide Filters' : '🔍 Filters';
    });

    // Add filter button
    this.btnAddFilter.addEventListener('click', () => {
      this.addFilterRow();
    });

    // Add initial filter row
    this.addFilterRow();
  }

  private addLogicConnector(filterId: number): HTMLElement {
    const connector = document.createElement('div');
    connector.className = 'logic-connector';
    connector.dataset.connectorId = String(filterId);

    const line1 = document.createElement('div');
    line1.className = 'logic-line';

    const toggle = document.createElement('div');
    toggle.className = 'logic-toggle';
    toggle.innerHTML = `
      <input type="radio" id="logic-and-${filterId}" name="logic-${filterId}" value="AND" checked>
      <label for="logic-and-${filterId}">AND</label>
      <input type="radio" id="logic-or-${filterId}" name="logic-${filterId}" value="OR">
      <label for="logic-or-${filterId}">OR</label>
    `;

    const line2 = document.createElement('div');
    line2.className = 'logic-line';

    connector.appendChild(line1);
    connector.appendChild(toggle);
    connector.appendChild(line2);

    // Add event listener to update filter logic
    toggle.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const logic = (radio as HTMLInputElement).value as 'AND' | 'OR';
        const filter = this.activeFilters.get(filterId);
        if (filter) {
          filter.logicToNext = logic;
        }
      });
    });

    return connector;
  }

  addFilterRow(): void {
    const filterId = this.filterCounter++;

    // Add logic connector before this row (except for first row)
    if (filterId > 0) {
      const prevFilterId = filterId - 1;
      const connector = this.addLogicConnector(prevFilterId);
      this.filterRowsContainer.appendChild(connector);
    }

    const filterRow = document.createElement('div');
    filterRow.className = 'filter-row';
    filterRow.dataset.filterId = String(filterId);

    // Add filter row index badge
    const indexBadge = document.createElement('div');
    indexBadge.className = 'filter-row-index';
    indexBadge.textContent = String(filterId + 1);
    filterRow.appendChild(indexBadge);

    // Column select
    const columnSelect = document.createElement('select');
    columnSelect.innerHTML = this.columns.map((col, idx) =>
      `<option value="${idx}">${col.header}</option>`
    ).join('');

    // Operator select
    const operatorSelect = document.createElement('select');
    operatorSelect.innerHTML = operators.map(op =>
      `<option value="${op.value}">${op.label}</option>`
    ).join('');

    // Value input
    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.placeholder = 'Enter value...';

    // Update value input visibility based on the operator
    const updateValueInput = () => {
      const selectedOp = operators.find(op => op.value === operatorSelect.value);
      if (selectedOp && !selectedOp.requiresValue) {
        valueInput.disabled = true;
        valueInput.placeholder = 'No value needed';
        valueInput.value = '';
      } else {
        valueInput.disabled = false;
        valueInput.placeholder = 'Enter value...';
      }
    };

    operatorSelect.addEventListener('change', updateValueInput);
    updateValueInput();

    // Remove button
    const removeButton = document.createElement('button');
    removeButton.textContent = '✕';
    removeButton.addEventListener('click', () => {
      // Remove the logic connector before this row if it exists
      const connector = this.filterRowsContainer.querySelector(`[data-connector-id="${filterId - 1}"]`);
      if (connector) {
        connector.remove();
      }
      // Remove the logic connector after this row if it exists
      const nextConnector = this.filterRowsContainer.querySelector(`[data-connector-id="${filterId}"]`);
      if (nextConnector) {
        nextConnector.remove();
      }
      filterRow.remove();
      this.activeFilters.delete(filterId);
    });

    // Store filter data
    const storeFilter = () => {
      const selectedOp = operators.find(op => op.value === operatorSelect.value);
      let value: any = valueInput.value;

      // Type conversion based on column
      const colIndex = parseInt(columnSelect.value);
      const column = this.columns[colIndex];

      // Auto-convert numbers for number columns
      if (column.renderer === 'number' && value && !isNaN(Number(value))) {
        value = Number(value);
      }

      this.activeFilters.set(filterId, {
        column: colIndex,
        operator: operatorSelect.value,
        value: selectedOp && selectedOp.requiresValue ? value : undefined,
        logicToNext: 'AND',
      });
    };

    columnSelect.addEventListener('change', storeFilter);
    operatorSelect.addEventListener('change', storeFilter);
    valueInput.addEventListener('input', storeFilter);

    // Initial store
    storeFilter();

    filterRow.appendChild(columnSelect);
    filterRow.appendChild(operatorSelect);
    filterRow.appendChild(valueInput);
    filterRow.appendChild(removeButton);

    this.filterRowsContainer.appendChild(filterRow);
  }

  clear(): void {
    this.filterRowsContainer.innerHTML = '';
    this.activeFilters.clear();
    this.filterCounter = 0;
    this.addFilterRow();
    this.filterPreview.style.display = 'none';
    this.filterWarning.style.display = 'none';
  }

  getFiltersArray() {
    return Array.from(this.activeFilters.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([id, filter]) => ({ id, ...filter }));
  }
}
