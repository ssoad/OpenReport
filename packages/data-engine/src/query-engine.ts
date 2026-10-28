import { DatasetDefinition, SortRule } from '@openreport/schema';
import { Evaluator } from '@openreport/expressions';
import { DataGroup, ExecutionContext, FieldMetadata, FieldType, ProcessedDataset } from './types';

export class QueryEngine {
  public static processDataset(
    dataset: DatasetDefinition,
    rawRows: Record<string, any>[],
    context: ExecutionContext = {}
  ): ProcessedDataset {
    let rows = rawRows.map((r) => ({ ...r }));

    // 1. Compute Calculated Fields
    if (dataset.calculatedFields && dataset.calculatedFields.length > 0) {
      for (const row of rows) {
        for (const calc of dataset.calculatedFields) {
          try {
            row[calc.name] = Evaluator.evaluateExpression(calc.expression, {
              fields: row,
              parameters: context.parameters
            });
          } catch (err: any) {
            row[calc.name] = null;
          }
        }
      }
    }

    // 2. Evaluate Filter Expression
    if (dataset.filter && dataset.filter.trim()) {
      rows = rows.filter((row) => {
        try {
          const res = Evaluator.evaluateExpression(dataset.filter!, {
            fields: row,
            parameters: context.parameters
          });
          return Boolean(res);
        } catch {
          return false;
        }
      });
    }

    // 3. Multi-Column Sorting
    if (dataset.sortBy && dataset.sortBy.length > 0) {
      rows.sort((a, b) => QueryEngine.compareRows(a, b, dataset.sortBy!));
    }

    // 4. Grouping & Subtotals
    let groups: DataGroup[] | undefined;
    if (dataset.groupBy && dataset.groupBy.length > 0) {
      groups = QueryEngine.groupRows(rows, dataset.groupBy);
    }

    // 5. Extract Field Metadata
    const fields = QueryEngine.extractFieldMetadata(rows);

    return {
      id: dataset.id,
      rows,
      groups,
      fields,
      totalRows: rows.length
    };
  }

  private static compareRows(a: Record<string, any>, b: Record<string, any>, sortRules: SortRule[]): number {
    for (const rule of sortRules) {
      const valA = a[rule.field];
      const valB = b[rule.field];

      if (valA === valB) continue;

      // Null handling
      if (valA === null || valA === undefined) return rule.nullsFirst ? -1 : 1;
      if (valB === null || valB === undefined) return rule.nullsFirst ? 1 : -1;

      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }

      if (comparison !== 0) {
        return rule.direction === 'desc' ? -comparison : comparison;
      }
    }
    return 0;
  }

  private static groupRows(rows: Record<string, any>[], groupByFields: string[], levelIndex: number = 0): DataGroup[] {
    if (levelIndex >= groupByFields.length) return [];

    const field = groupByFields[levelIndex]!;
    const map = new Map<any, Record<string, any>[]>();

    for (const row of rows) {
      const key = row[field] ?? null;
      let groupList = map.get(key);
      if (!groupList) {
        groupList = [];
        map.set(key, groupList);
      }
      groupList.push(row);
    }

    const groups: DataGroup[] = [];
    for (const [key, groupRows] of map.entries()) {
      const group: DataGroup = {
        key,
        field,
        rows: groupRows,
        summaries: QueryEngine.computeSummaries(groupRows)
      };

      if (levelIndex + 1 < groupByFields.length) {
        group.subgroups = QueryEngine.groupRows(groupRows, groupByFields, levelIndex + 1);
      }

      groups.push(group);
    }

    return groups;
  }

  private static computeSummaries(rows: Record<string, any>[]): Record<string, number> {
    const summaries: Record<string, number> = {};
    if (rows.length === 0) return summaries;

    const sample = rows[0]!;
    for (const key of Object.keys(sample)) {
      if (typeof sample[key] === 'number') {
        summaries[`${key}_sum`] = rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
        summaries[`${key}_avg`] = summaries[`${key}_sum`] / rows.length;
        summaries[`${key}_min`] = Math.min(...rows.map((r) => Number(r[key]) || 0));
        summaries[`${key}_max`] = Math.max(...rows.map((r) => Number(r[key]) || 0));
      }
    }
    summaries['count'] = rows.length;
    return summaries;
  }

  private static extractFieldMetadata(rows: Record<string, any>[]): FieldMetadata[] {
    if (rows.length === 0) return [];

    const sample = rows[0]!;
    return Object.keys(sample).map((name) => {
      const val = sample[name];
      let type: FieldType = 'string';
      if (typeof val === 'number') type = 'number';
      else if (typeof val === 'boolean') type = 'boolean';
      else if (val instanceof Date) type = 'date';
      else if (typeof val === 'object') type = Array.isArray(val) ? 'array' : 'object';

      return {
        name,
        type,
        nullable: true,
        sample: val
      };
    });
  }
}
