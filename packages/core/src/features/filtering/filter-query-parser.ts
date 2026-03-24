import type { FilterQuery, FilterExpression, FilterModel } from '../../types';

type NamedQueryParams = Record<string, unknown>;
type PositionalSqlParams = Array<string | number>;

/**
 * FilterQueryParser - Parses SQL-like filter queries
 *
 * Converts SQL-like syntax to FilterExpression for both backend and frontend use
 *
 * Supported operators:
 * - Comparison: =, !=, <, >, <=, >=
 * - String: LIKE, NOT LIKE
 * - Range: BETWEEN, NOT BETWEEN
 * - List: IN, NOT IN
 * - Null: IS NULL, IS NOT NULL
 * - Logic: AND, OR, NOT, ( )
 *
 * @example
 * ```typescript
 * const parser = new FilterQueryParser();
 *
 * // Simple query
 * parser.parse({ sql: "age > 18" });
 *
 * // Parameterized query (recommended)
 * parser.parse({
 *   sql: "age > :minAge AND status = :status",
 *   params: { minAge: 18, status: 'active' }
 * });
 *
 * // Complex query
 * parser.parse({
 *   sql: "age BETWEEN :min AND :max AND (name LIKE :search OR email LIKE :search)",
 *   params: { min: 18, max: 65, search: '%john%' }
 * });
 * ```
 */
export class FilterQueryParser {
  private columnMap: Map<string, number> = new Map();

  /**
   * Set column name to index mapping
   * Required for converting SQL field names to column indices
   */
  setColumnMapping(mapping: Record<string, number>): void {
    this.columnMap = new Map(Object.entries(mapping));
  }

  /**
   * Parse SQL-like filter query into FilterExpression
   */
  parse(query: FilterQuery): FilterExpression {
    try {
      const { sql: boundSql, params } = this.toPositionalQuery(query.sql, query.params ?? {});

      // Step 3: Return expression
      return {
        type: 'sql',
        sql: query.sql,
        boundSql,
        params,
      };
    } catch (error) {
      throw new Error(`Failed to parse filter query: ${(error as Error).message}`);
    }
  }

  private toPositionalQuery(sql: string, namedParams: NamedQueryParams): {
    sql: string;
    params: PositionalSqlParams;
  } {
    const params: PositionalSqlParams = [];

    const tokenRegex = /'([^']*)'|\b(\d+(?:\.\d+)?)\b|:([A-Za-z_][A-Za-z0-9_]*)\b/g;
    const boundSql = sql.replace(
      tokenRegex,
      (match, stringValue?: string, numberValue?: string, namedParam?: string) => {
        if (namedParam !== undefined) {
          if (!Object.prototype.hasOwnProperty.call(namedParams, namedParam)) {
            throw new Error(`Missing named parameter :${namedParam}`);
          }

          params.push(this.toSqlParamValue(namedParams[namedParam]));
          return '?';
        }

        if (stringValue !== undefined) {
          params.push(stringValue);
          return '?';
        }

        if (numberValue !== undefined) {
          params.push(parseFloat(numberValue));
          return '?';
        }

        return match;
      }
    );

    return { sql: boundSql, params };
  }

  private toSqlParamValue(value: unknown): string | number {
    if (typeof value === 'number') {
      return value;
    }

    return String(value);
  }

  /**
   * Convert SQL query to FilterModels (for frontend filtering)
   * This is a simplified conversion - complex queries may not convert perfectly
   */
  parseToModels(query: FilterQuery, columnNames: string[]): FilterModel[] {
    const inferredColumnMap =
      this.columnMap.size > 0
        ? this.columnMap
        : new Map(columnNames.map((name, index) => [name, index] as const));
    const parsedModels = this.parseSimpleModels(query, inferredColumnMap);

    if (parsedModels) {
      return parsedModels;
    }

    console.warn(
      'FilterQueryParser.parseToModels(): Converting SQL to FilterModels has limitations. Consider using backend filtering for complex queries.'
    );

    return [];
  }

  private parseSimpleModels(query: FilterQuery, columnMap: Map<string, number>): FilterModel[] | null {
    if (/[()]/.test(query.sql) || /\b(OR|BETWEEN|NOT BETWEEN|IN|NOT IN|IS NULL|IS NOT NULL)\b/i.test(query.sql)) {
      return null;
    }

    const clauses = query.sql.split(/\s+AND\s+/i).map((clause) => clause.trim()).filter(Boolean);
    const modelsByColumn = new Map<number, FilterModel>();

    for (const clause of clauses) {
      const parsedClause = this.parseSimpleClause(clause, query.params ?? {}, columnMap);
      if (!parsedClause) {
        return null;
      }

      const existingModel = modelsByColumn.get(parsedClause.column);
      if (existingModel) {
        existingModel.conditions.push(parsedClause.condition);
        existingModel.logic = 'AND';
        continue;
      }

      modelsByColumn.set(parsedClause.column, {
        column: parsedClause.column,
        conditions: [parsedClause.condition],
      });
    }

    return Array.from(modelsByColumn.values());
  }

  private parseSimpleClause(
    clause: string,
    params: NamedQueryParams,
    columnMap: Map<string, number>
  ): { column: number; condition: FilterModel['conditions'][number] } | null {
    const match = clause.match(
      /^([A-Za-z_][A-Za-z0-9_.]*)\s*(=|!=|<>|>=|<=|>|<|LIKE|NOT LIKE)\s*(.+)$/i
    );
    if (!match) {
      return null;
    }

    const [, fieldName, sqlOperator, rawValue] = match;
    const column = columnMap.get(fieldName);
    if (column === undefined) {
      return null;
    }

    const value = this.resolveClauseValue(rawValue.trim(), params);
    const operator = this.sqlOperatorToFilterOperator(sqlOperator.toUpperCase(), value);

    return {
      column,
      condition: {
        operator,
        value: this.normalizeClauseValue(operator, value),
      },
    };
  }

  private resolveClauseValue(rawValue: string, params: NamedQueryParams): string | number {
    if (rawValue.startsWith(':')) {
      const paramName = rawValue.slice(1);
      if (!Object.prototype.hasOwnProperty.call(params, paramName)) {
        throw new Error(`Missing named parameter :${paramName}`);
      }

      return this.toSqlParamValue(params[paramName]);
    }

    if (rawValue.startsWith("'") && rawValue.endsWith("'")) {
      return rawValue.slice(1, -1);
    }

    const numericValue = Number(rawValue);
    if (!Number.isNaN(numericValue)) {
      return numericValue;
    }

    return rawValue;
  }

  private normalizeClauseValue(operator: FilterModel['conditions'][number]['operator'], value: string | number) {
    if (typeof value !== 'string') {
      return value;
    }

    if (operator === 'contains' || operator === 'notContains') {
      return value.replace(/^%|%$/g, '');
    }

    if (operator === 'startsWith') {
      return value.replace(/%$/g, '');
    }

    if (operator === 'endsWith') {
      return value.replace(/^%/g, '');
    }

    return value;
  }

  private sqlOperatorToFilterOperator(sqlOperator: string, value: string | number): FilterModel['conditions'][number]['operator'] {
    if (sqlOperator === 'LIKE' && typeof value === 'string') {
      if (value.startsWith('%') && value.endsWith('%')) {
        return 'contains';
      }

      if (value.endsWith('%')) {
        return 'startsWith';
      }

      if (value.startsWith('%')) {
        return 'endsWith';
      }

      return 'contains';
    }

    if (sqlOperator === 'NOT LIKE') {
      return 'notContains';
    }

    const mapping = new Map<string, FilterModel['conditions'][number]['operator']>([
      ['=', 'equals'],
      ['!=', 'notEquals'],
      ['<>', 'notEquals'],
      ['>', 'greaterThan'],
      ['<', 'lessThan'],
      ['>=', 'greaterThanOrEqual'],
      ['<=', 'lessThanOrEqual'],
    ]);

    return mapping.get(sqlOperator) ?? 'equals';
  }
}
