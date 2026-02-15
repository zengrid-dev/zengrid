// Filter operator definitions
export const operators = [
  { value: 'equals', label: 'Equals (=)', requiresValue: true },
  { value: 'notEquals', label: 'Not Equals (≠)', requiresValue: true },
  { value: 'greaterThan', label: 'Greater Than (>)', requiresValue: true },
  { value: 'greaterThanOrEqual', label: 'Greater Than Or Equal (≥)', requiresValue: true },
  { value: 'lessThan', label: 'Less Than (<)', requiresValue: true },
  { value: 'lessThanOrEqual', label: 'Less Than Or Equal (≤)', requiresValue: true },
  { value: 'contains', label: 'Contains', requiresValue: true },
  { value: 'notContains', label: 'Does Not Contain', requiresValue: true },
  { value: 'startsWith', label: 'Starts With', requiresValue: true },
  { value: 'endsWith', label: 'Ends With', requiresValue: true },
  { value: 'blank', label: 'Is Empty', requiresValue: false },
  { value: 'notBlank', label: 'Is Not Empty', requiresValue: false },
];
