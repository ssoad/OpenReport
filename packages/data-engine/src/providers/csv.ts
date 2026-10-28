import { DataSourceDefinition } from '@openreport/schema';
import { IDataProvider, FieldMetadata, ExecutionContext } from '../types';
import { parseCsv } from '../csv-parser';

export class CsvDataProvider implements IDataProvider {
  readonly type = 'csv';

  async fetch(source: DataSourceDefinition, _context?: ExecutionContext): Promise<Record<string, any>[]> {
    let rawCsv = source.csvContent || '';

    if (!rawCsv && source.url) {
      const response = await fetch(source.url, {
        headers: source.headers || {}
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV dataset from ${source.url}: HTTP ${response.status} ${response.statusText}`);
      }
      rawCsv = await response.text();
    }

    if (!rawCsv) return [];

    const delimiter = source.options?.delimiter || ',';
    const { rows } = parseCsv(rawCsv, { delimiter, inferTypes: true });
    return rows;
  }

  async getSchema(source: DataSourceDefinition, context?: ExecutionContext): Promise<FieldMetadata[]> {
    let rawCsv = source.csvContent || '';

    if (!rawCsv && source.url) {
      const response = await fetch(source.url, { headers: source.headers || {} });
      if (response.ok) {
        rawCsv = await response.text();
      }
    }

    if (!rawCsv) return [];
    const delimiter = source.options?.delimiter || ',';
    const { fields } = parseCsv(rawCsv, { delimiter, inferTypes: true });
    return fields;
  }
}
