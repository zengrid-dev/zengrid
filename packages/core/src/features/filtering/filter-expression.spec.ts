import { buildModelFilterExpression, hasActiveFilterExpression } from './filter-expression';

describe('filter-expression helpers', () => {
  it('buildModelFilterExpression fills defaults for quick filter and exports', () => {
    expect(buildModelFilterExpression({ models: [] })).toEqual({
      type: 'model',
      models: [],
      quickFilter: { query: '', columns: null },
      fieldState: null,
      filterExport: null,
    });
  });

  it('treats quick-filter-only expressions as active', () => {
    expect(
      hasActiveFilterExpression({
        type: 'model',
        models: [],
        quickFilter: { query: 'alice', columns: [0] },
        fieldState: null,
        filterExport: null,
      })
    ).toBe(true);
  });

  it('treats empty model expressions as inactive', () => {
    expect(
      hasActiveFilterExpression({
        type: 'model',
        models: [],
        quickFilter: { query: '', columns: null },
        fieldState: null,
        filterExport: null,
      })
    ).toBe(false);
  });

  it('treats sql expressions with content as active', () => {
    expect(
      hasActiveFilterExpression({
        type: 'sql',
        sql: 'age > :minAge',
        boundSql: 'age > ?',
        params: [18],
      })
    ).toBe(true);
  });
});
