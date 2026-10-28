import { DataSourceDefinition } from '@openreport/schema';
import { IDataProvider, FieldMetadata, FieldType, ExecutionContext } from '../types';

export class JsonDataProvider implements IDataProvider {
  readonly type = 'json';

  async fetch(source: DataSourceDefinition, _context?: ExecutionContext): Promise<Record<string, any>[]> {
    if (source.data && Array.isArray(source.data)) {
      return source.data;
    }

    if (source.url) {
      const response = await fetch(source.url, {
        method: source.method || 'GET',
        headers: source.headers || {}
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch JSON dataset from ${source.url}: HTTP ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        // If wrapped in items/data/results
        for (const key of ['items', 'data', 'results', 'rows']) {
          if (Array.isArray((data as any)[key])) return (data as any)[key];
        }
      }
      return [data];
    }

    return [];
  }

  async getSchema(source: DataSourceDefinition, context?: ExecutionContext): Promise<FieldMetadata[]> {
    const rows = await this.fetch(source, context);
    if (rows.length === 0) return [];

    const first = rows[0]!;
    return Object.keys(first).map((key) => {
      const val = first[key];
      let type: FieldType = 'string';
      if (typeof val === 'number') type = 'number';
      else if (typeof val === 'boolean') type = 'boolean';
      else if (val instanceof Date) type = 'date';
      else if (typeof val === 'object') type = Array.isArray(val) ? 'array' : 'object';

      return {
        name: key,
        type,
        nullable: true,
        sample: val
      };
    });
  }
}
