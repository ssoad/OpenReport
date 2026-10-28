import { DataSourceDefinition } from '@openreport/schema';
import { IDataProvider, FieldMetadata, FieldType, ExecutionContext } from '../types';

export class MemoryDataProvider implements IDataProvider {
  readonly type = 'memory';

  async fetch(source: DataSourceDefinition, _context?: ExecutionContext): Promise<Record<string, any>[]> {
    if (Array.isArray(source.data)) {
      return JSON.parse(JSON.stringify(source.data));
    }
    return [];
  }

  async getSchema(source: DataSourceDefinition, _context?: ExecutionContext): Promise<FieldMetadata[]> {
    const rows = await this.fetch(source);
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
