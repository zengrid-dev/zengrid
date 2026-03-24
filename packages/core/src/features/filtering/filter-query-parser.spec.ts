import { FilterQueryParser } from './filter-query-parser';

describe('FilterQueryParser', () => {
  let parser: FilterQueryParser;

  beforeEach(() => {
    parser = new FilterQueryParser();
  });

  it('preserves positional parameter order when numbers appear before strings', () => {
    const expression = parser.parse({
      sql: 'age > :minAge AND status = :status',
      params: { minAge: 18, status: 'active' },
    });

    expect(expression).toEqual({
      type: 'sql',
      sql: 'age > :minAge AND status = :status',
      boundSql: 'age > ? AND status = ?',
      params: [18, 'active'],
    });
  });

  it('preserves positional order for advanced queries with BETWEEN and repeated LIKE params', () => {
    const expression = parser.parse({
      sql: 'age BETWEEN :min AND :max AND (name LIKE :search OR email LIKE :search)',
      params: { min: 18, max: 65, search: '%john%' },
    });

    expect(expression).toEqual({
      type: 'sql',
      sql: 'age BETWEEN :min AND :max AND (name LIKE :search OR email LIKE :search)',
      boundSql: 'age BETWEEN ? AND ? AND (name LIKE ? OR email LIKE ?)',
      params: [18, 65, '%john%', '%john%'],
    });
  });

  it('keeps named parameter values out of SQL text and emits positional params safely', () => {
    const expression = parser.parse({
      sql: 'status = :status',
      params: { status: "active' OR 1=1 --" },
    });

    expect(expression).toEqual({
      type: 'sql',
      sql: 'status = :status',
      boundSql: 'status = ?',
      params: ["active' OR 1=1 --"],
    });
  });

  it('throws when a named parameter is referenced but not provided', () => {
    expect(() =>
      parser.parse({
        sql: 'status = :status',
        params: {},
      })
    ).toThrow('Failed to parse filter query: Missing named parameter :status');
  });

  it('maps simple SQL clauses to column filter models', () => {
    parser.setColumnMapping({ status: 0, age: 1, name: 2 });

    const models = parser.parseToModels(
      {
        sql: 'age >= :minAge AND name LIKE :search AND status = :status',
        params: { minAge: 18, search: '%ali%', status: 'active' },
      },
      []
    );

    expect(models).toEqual([
      {
        column: 1,
        conditions: [{ operator: 'greaterThanOrEqual', value: 18 }],
      },
      {
        column: 2,
        conditions: [{ operator: 'contains', value: 'ali' }],
      },
      {
        column: 0,
        conditions: [{ operator: 'equals', value: 'active' }],
      },
    ]);
  });

  it('maps field names through the provided columnNames fallback when no explicit mapping is set', () => {
    const models = parser.parseToModels(
      {
        sql: 'city = :city AND name LIKE :search',
        params: { city: 'Boston', search: 'Ali%' },
      },
      ['id', 'name', 'city']
    );

    expect(models).toEqual([
      {
        column: 2,
        conditions: [{ operator: 'equals', value: 'Boston' }],
      },
      {
        column: 1,
        conditions: [{ operator: 'startsWith', value: 'Ali' }],
      },
    ]);
  });

  it('returns an empty model list for unsupported SQL shapes and warns about limitations', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const models = parser.parseToModels(
      { sql: 'age > :minAge OR status = :status', params: { minAge: 18, status: 'active' } },
      ['age', 'status']
    );

    expect(models).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Converting SQL to FilterModels has limitations')
    );

    warnSpy.mockRestore();
  });
});
