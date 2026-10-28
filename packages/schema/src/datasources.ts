import { z } from 'zod';

export const DataProviderTypeSchema = z.enum(['memory', 'json', 'csv', 'rest', 'sql']);
export type DataProviderType = z.infer<typeof DataProviderTypeSchema>;

export const DataSourceDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  provider: DataProviderTypeSchema.default('memory'),
  data: z.array(z.record(z.any())).optional(),
  url: z.string().url().optional().or(z.string().min(1).optional()),
  method: z.enum(['GET', 'POST']).default('GET').optional(),
  headers: z.record(z.string()).optional(),
  csvContent: z.string().optional(),
  options: z.record(z.any()).optional()
});
export type DataSourceDefinition = z.infer<typeof DataSourceDefinitionSchema>;

export const SortDirectionSchema = z.enum(['asc', 'desc']);
export type SortDirection = z.infer<typeof SortDirectionSchema>;

export const SortRuleSchema = z.object({
  field: z.string().min(1),
  direction: SortDirectionSchema.default('asc'),
  nullsFirst: z.boolean().default(false)
});
export type SortRule = z.infer<typeof SortRuleSchema>;

export const AggregationTypeSchema = z.enum(['sum', 'avg', 'count', 'min', 'max', 'distinctCount']);
export type AggregationType = z.infer<typeof AggregationTypeSchema>;

export const CalculatedFieldSchema = z.object({
  name: z.string().min(1),
  expression: z.string().min(1)
});
export type CalculatedField = z.infer<typeof CalculatedFieldSchema>;

export const DatasetDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  dataSourceId: z.string().min(1),
  filter: z.string().optional(), // expression string
  sortBy: z.array(SortRuleSchema).optional(),
  groupBy: z.array(z.string()).optional(),
  calculatedFields: z.array(CalculatedFieldSchema).optional()
});
export type DatasetDefinition = z.infer<typeof DatasetDefinitionSchema>;
