import { DataSourceDefinition, DatasetDefinition } from '@openreport/schema';

export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';

export interface FieldMetadata {
  name: string;
  type: FieldType;
  nullable: boolean;
  sample?: any;
}

export interface ExecutionContext {
  parameters?: Record<string, any>;
  tenantId?: string;
  userId?: string;
  timeoutMs?: number;
}

export interface IDataProvider {
  readonly type: string;
  fetch(source: DataSourceDefinition, context?: ExecutionContext): Promise<Record<string, any>[]>;
  getSchema?(source: DataSourceDefinition, context?: ExecutionContext): Promise<FieldMetadata[]>;
}

export interface DataGroup {
  key: any;
  field: string;
  rows: Record<string, any>[];
  subgroups?: DataGroup[];
  summaries?: Record<string, number>;
}

export interface ProcessedDataset {
  id: string;
  rows: Record<string, any>[];
  groups?: DataGroup[];
  fields: FieldMetadata[];
  totalRows: number;
}
