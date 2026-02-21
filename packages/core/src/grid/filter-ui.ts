import type { ColumnDef, FilterModel, FilterOperator } from '../types';
import type { EventEmitter } from '../events/event-emitter';
import type { GridEvents } from '../events/grid-events';

interface FilterUIOptions {
  container: HTMLElement;
  events: EventEmitter<GridEvents>;
  getFilterState: () => FilterModel[];
  setColumnFilter: (column: number, conditions: Array<{ operator: string; value: any }>, logic?: 'AND' | 'OR') => void;
  clearColumnFilter: (column: number) => void;
  getColumnDef: (dataCol: number) => ColumnDef | undefined;
  mapVisualToDataCol: (visualCol: number) => number;
}

interface OperatorOption {
  value: FilterOperator;
  label: string;
  valueCount: 0 | 1 | 2;
}

const TEXT_OPERATORS: OperatorOption[] = [
  { value: 'contains', label: 'Contains', valueCount: 1 },
  { value: 'equals', label: 'Equals', valueCount: 1 },
  { value: 'startsWith', label: 'Starts with', valueCount: 1 },
  { value: 'endsWith', label: 'Ends with', valueCount: 1 },
  { value: 'notContains', label: 'Not contains', valueCount: 1 },
  { value: 'notEquals', label: 'Not equals', valueCount: 1 },
  { value: 'blank', label: 'Is blank', valueCount: 0 },
  { value: 'notBlank', label: 'Is not blank', valueCount: 0 },
];

const NUMBER_OPERATORS: OperatorOption[] = [
  { value: 'equals', label: 'Equals', valueCount: 1 },
  { value: 'notEquals', label: 'Not equals', valueCount: 1 },
  { value: 'greaterThan', label: 'Greater than', valueCount: 1 },
  { value: 'greaterThanOrEqual', label: 'Greater than or equal', valueCount: 1 },
  { value: 'lessThan', label: 'Less than', valueCount: 1 },
  { value: 'lessThanOrEqual', label: 'Less than or equal', valueCount: 1 },
  { value: 'between', label: 'Between', valueCount: 2 },
  { value: 'blank', label: 'Is blank', valueCount: 0 },
  { value: 'notBlank', label: 'Is not blank', valueCount: 0 },
];

const DATE_OPERATORS: OperatorOption[] = [
  { value: 'equals', label: 'Equals', valueCount: 1 },
  { value: 'greaterThan', label: 'After', valueCount: 1 },
  { value: 'lessThan', label: 'Before', valueCount: 1 },
  { value: 'between', label: 'Between', valueCount: 2 },
  { value: 'blank', label: 'Is blank', valueCount: 0 },
  { value: 'notBlank', label: 'Is not blank', valueCount: 0 },
];

export class GridFilterUI {
  private container: HTMLElement;
  private events: EventEmitter<GridEvents>;
  private getFilterState: () => FilterModel[];
  private setColumnFilter: (column: number, conditions: Array<{ operator: string; value: any }>, logic?: 'AND' | 'OR') => void;
  private clearColumnFilter: (column: number) => void;
  private getColumnDef: (dataCol: number) => ColumnDef | undefined;
  private mapVisualToDataCol: (visualCol: number) => number;

  private popup: HTMLElement | null = null;
  private documentClickHandler: ((e: MouseEvent) => void) | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private filterClickUnsub: (() => void) | null = null;

  constructor(options: FilterUIOptions) {
    this.container = options.container;
    this.events = options.events;
    this.getFilterState = options.getFilterState;
    this.setColumnFilter = options.setColumnFilter;
    this.clearColumnFilter = options.clearColumnFilter;
    this.getColumnDef = options.getColumnDef;
    this.mapVisualToDataCol = options.mapVisualToDataCol;

    this.filterClickUnsub = this.events.on('header:filter:click', (payload) => {
      this.openFilterPopup(payload);
    });
  }

  private openFilterPopup(payload: GridEvents['header:filter:click']): void {
    const dataCol = this.mapVisualToDataCol(payload.columnIndex);
    const columnDef = this.getColumnDef(dataCol);
    if (!columnDef) return;

    this.closePopup();

    const dropdownType = payload.dropdownType ?? 'text';
    const operators = this.getOperatorsForType(dropdownType);
    const existing = this.getFilterState().find(f => f.column === dataCol);

    const popup = document.createElement('div');
    popup.className = 'zg-filter-popup';

    const title = document.createElement('div');
    title.className = 'zg-filter-popup__title';
    title.textContent = `Filter: ${this.getColumnLabel(columnDef, dataCol)}`;
    popup.appendChild(title);

    const logicRow = document.createElement('div');
    logicRow.className = 'zg-filter-popup__row';
    logicRow.innerHTML = `<label>Match</label>`;

    const logicSelect = document.createElement('select');
    logicSelect.className = 'zg-filter-popup__select';
    logicSelect.innerHTML = `
      <option value="AND">AND</option>
      <option value="OR">OR</option>
    `;
    logicSelect.value = existing?.logic ?? 'AND';
    logicRow.appendChild(logicSelect);
    popup.appendChild(logicRow);

    const conditionsContainer = document.createElement('div');
    conditionsContainer.className = 'zg-filter-popup__conditions';
    popup.appendChild(conditionsContainer);

    type ConditionRow = {
      element: HTMLElement;
      operatorSelect: HTMLSelectElement;
      valueInput: HTMLInputElement;
      valueInputTo: HTMLInputElement;
      removeBtn: HTMLButtonElement;
    };

    const conditionRows: ConditionRow[] = [];

    const createConditionRow = (condition?: { operator: string; value?: any }): ConditionRow => {
      const conditionEl = document.createElement('div');
      conditionEl.className = 'zg-filter-popup__condition';

      const operatorRow = document.createElement('div');
      operatorRow.className = 'zg-filter-popup__row';
      operatorRow.innerHTML = `<label>Operator</label>`;

      const operatorSelect = document.createElement('select');
      operatorSelect.className = 'zg-filter-popup__select';
      operators.forEach(op => {
        const option = document.createElement('option');
        option.value = op.value;
        option.textContent = op.label;
        operatorSelect.appendChild(option);
      });
      operatorRow.appendChild(operatorSelect);
      conditionEl.appendChild(operatorRow);

      const valueRow = document.createElement('div');
      valueRow.className = 'zg-filter-popup__row';
      valueRow.innerHTML = `<label>Value</label>`;

      const valueInput = document.createElement('input');
      valueInput.className = 'zg-filter-popup__input';
      valueInput.type = dropdownType === 'number' ? 'number' : dropdownType === 'date' ? 'date' : 'text';

      const valueInputTo = document.createElement('input');
      valueInputTo.className = 'zg-filter-popup__input';
      valueInputTo.type = valueInput.type;
      valueInputTo.style.display = 'none';

      valueRow.appendChild(valueInput);
      valueRow.appendChild(valueInputTo);
      conditionEl.appendChild(valueRow);

      const actionsRow = document.createElement('div');
      actionsRow.className = 'zg-filter-popup__condition-actions';

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'zg-filter-popup__btn zg-filter-popup__btn--remove';
      removeBtn.textContent = 'Remove';
      actionsRow.appendChild(removeBtn);
      conditionEl.appendChild(actionsRow);

      const updateValueInputs = () => {
        const selected = operators.find(op => op.value === operatorSelect.value);
        const valueCount = selected?.valueCount ?? 1;
        if (valueCount === 0) {
          valueInput.style.display = 'none';
          valueInputTo.style.display = 'none';
        } else if (valueCount === 2) {
          valueInput.style.display = '';
          valueInputTo.style.display = '';
        } else {
          valueInput.style.display = '';
          valueInputTo.style.display = 'none';
        }
      };

      operatorSelect.addEventListener('change', updateValueInputs);

      if (condition) {
        operatorSelect.value = condition.operator;
        if (Array.isArray(condition.value)) {
          valueInput.value = String(condition.value[0] ?? '');
          valueInputTo.value = String(condition.value[1] ?? '');
        } else if (condition.value != null) {
          valueInput.value = String(condition.value);
        }
      }

      updateValueInputs();

      removeBtn.addEventListener('click', () => {
        const index = conditionRows.findIndex(row => row.element === conditionEl);
        if (index >= 0) {
          conditionRows.splice(index, 1);
        }
        conditionEl.remove();
        updateConditionControls();
      });

      return {
        element: conditionEl,
        operatorSelect,
        valueInput,
        valueInputTo,
        removeBtn,
      };
    };

    const updateConditionControls = () => {
      const showLogic = conditionRows.length > 1;
      logicRow.style.display = showLogic ? '' : 'none';
      conditionRows.forEach(row => {
        row.removeBtn.style.display = showLogic ? '' : 'none';
      });
    };

    const addCondition = (condition?: { operator: string; value?: any }) => {
      const row = createConditionRow(condition);
      conditionRows.push(row);
      conditionsContainer.appendChild(row.element);
      updateConditionControls();
    };

    const existingConditions = existing?.conditions && existing.conditions.length > 0
      ? existing.conditions
      : null;

    if (existingConditions) {
      existingConditions.forEach(condition => addCondition(condition));
    } else {
      addCondition();
    }

    const addConditionBtn = document.createElement('button');
    addConditionBtn.type = 'button';
    addConditionBtn.className = 'zg-filter-popup__btn zg-filter-popup__btn--add';
    addConditionBtn.textContent = 'Add condition';
    addConditionBtn.addEventListener('click', () => addCondition());
    popup.appendChild(addConditionBtn);

    const actions = document.createElement('div');
    actions.className = 'zg-filter-popup__actions';

    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'zg-filter-popup__btn primary';
    applyBtn.textContent = 'Apply';

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'zg-filter-popup__btn';
    clearBtn.textContent = 'Clear';

    actions.appendChild(applyBtn);
    actions.appendChild(clearBtn);
    popup.appendChild(actions);

    const applyFilter = () => {
      const conditions: Array<{ operator: string; value?: any }> = [];
      for (const row of conditionRows) {
        const operator = row.operatorSelect.value as FilterOperator;
        const condition = this.buildCondition(
          operator,
          dropdownType,
          row.valueInput.value,
          row.valueInputTo.value
        );
        if (condition) {
          conditions.push(condition);
        }
      }

      if (conditions.length === 0) {
        return;
      }

      const logic = (logicSelect.value as 'AND' | 'OR') ?? 'AND';
      this.setColumnFilter(dataCol, conditions, logic);
      this.closePopup();
    };

    applyBtn.addEventListener('click', applyFilter);

    clearBtn.addEventListener('click', () => {
      this.clearColumnFilter(dataCol);
      this.closePopup();
    });

    this.popup = popup;
    document.body.appendChild(popup);

    this.positionPopup(payload.anchorElement, popup);
    this.installGlobalHandlers(applyFilter);

    // Focus first input for usability
    setTimeout(() => {
      const first = conditionRows[0];
      if (!first) return;
      if (first.valueInput.style.display !== 'none') {
        first.valueInput.focus();
      } else {
        first.operatorSelect.focus();
      }
    }, 0);
  }

  private buildCondition(
    operator: FilterOperator,
    dropdownType: string,
    value: string,
    valueTo: string
  ): { operator: string; value?: any } | null {
    const valueCount = this.getOperatorValueCount(operator, dropdownType);

    if (valueCount === 0) {
      return { operator };
    }

    if (valueCount === 2) {
      const parsed = [
        this.parseInputValue(value, dropdownType),
        this.parseInputValue(valueTo, dropdownType),
      ];
      return { operator, value: parsed };
    }

    return { operator, value: this.parseInputValue(value, dropdownType) };
  }

  private parseInputValue(value: string, dropdownType: string): any {
    if (dropdownType === 'number') {
      const num = Number(value);
      return Number.isNaN(num) ? value : num;
    }

    if (dropdownType === 'date') {
      const ts = Date.parse(value);
      return Number.isNaN(ts) ? value : ts;
    }

    return value;
  }

  private getOperatorsForType(type: string): OperatorOption[] {
    switch (type) {
      case 'number':
        return NUMBER_OPERATORS;
      case 'date':
        return DATE_OPERATORS;
      default:
        return TEXT_OPERATORS;
    }
  }

  private getOperatorValueCount(operator: FilterOperator, type: string): 0 | 1 | 2 {
    const operators = this.getOperatorsForType(type);
    return operators.find(op => op.value === operator)?.valueCount ?? 1;
  }

  private getColumnLabel(column: ColumnDef, index: number): string {
    if (typeof column.header === 'string') return column.header;
    return column.header?.text ?? column.field ?? `Column ${index}`;
  }

  private positionPopup(anchor: HTMLElement | undefined, popup: HTMLElement): void {
    popup.style.position = 'fixed';

    if (!anchor) {
      const containerRect = this.container.getBoundingClientRect();
      popup.style.top = `${containerRect.top + 12}px`;
      popup.style.left = `${containerRect.left + 12}px`;
      return;
    }

    const rect = anchor.getBoundingClientRect();
    popup.style.top = `${rect.bottom + 4}px`;
    popup.style.left = `${rect.left}px`;

    const popupRect = popup.getBoundingClientRect();
    if (popupRect.right > window.innerWidth) {
      popup.style.left = `${Math.max(8, window.innerWidth - popupRect.width - 8)}px`;
    }
    if (popupRect.bottom > window.innerHeight) {
      popup.style.top = `${Math.max(8, rect.top - popupRect.height - 4)}px`;
    }
  }

  private installGlobalHandlers(applyHandler?: () => void): void {
    this.documentClickHandler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (this.popup && target && !this.popup.contains(target)) {
        this.closePopup();
      }
    };

    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closePopup();
        return;
      }

      if (e.key === 'Enter' && this.popup && applyHandler) {
        const active = document.activeElement as HTMLElement | null;
        if (active && this.popup.contains(active)) {
          const tag = active.tagName.toLowerCase();
          if (tag !== 'input' && tag !== 'select') {
            return;
          }
          e.preventDefault();
          applyHandler();
        }
      }
    };

    document.addEventListener('click', this.documentClickHandler, true);
    document.addEventListener('keydown', this.keyHandler);
    window.addEventListener('resize', this.closePopup);
  }

  private closePopup = (): void => {
    if (this.popup) {
      this.popup.remove();
      this.popup = null;
    }

    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler, true);
      this.documentClickHandler = null;
    }
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    window.removeEventListener('resize', this.closePopup);
  };

  destroy(): void {
    this.closePopup();
    if (this.filterClickUnsub) {
      this.filterClickUnsub();
      this.filterClickUnsub = null;
    }
  }
}
