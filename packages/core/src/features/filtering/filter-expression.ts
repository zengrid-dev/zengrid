import type { FilterExpression, FilterModel, FilterQuickState } from '../../types';
import type { FilterExportResult } from './adapters/types';
import type { FieldFilterState } from './types';

interface BuildModelFilterExpressionOptions {
  models: FilterModel[];
  quickFilter?: FilterQuickState | null;
  fieldState?: FieldFilterState | null;
  filterExport?: FilterExportResult | null;
}

export function buildModelFilterExpression(
  options: BuildModelFilterExpressionOptions
): FilterExpression {
  return {
    type: 'model',
    models: options.models,
    quickFilter: options.quickFilter ?? { query: '', columns: null },
    fieldState: options.fieldState ?? null,
    filterExport: options.filterExport ?? null,
  };
}

export function hasActiveFilterExpression(expression: FilterExpression | null | undefined): boolean {
  if (!expression) {
    return false;
  }

  const hasSql = typeof expression.sql === 'string' && expression.sql.trim().length > 0;
  const hasModels = Array.isArray(expression.models) && expression.models.length > 0;
  const hasQuickFilter = (expression.quickFilter?.query ?? '').trim().length > 0;

  return hasSql || hasModels || hasQuickFilter;
}
