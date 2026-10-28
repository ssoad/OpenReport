import { z } from 'zod';
import { PageConfigSchema } from './page';
import { ParameterDefinitionSchema } from './parameters';
import { DataSourceDefinitionSchema, DatasetDefinitionSchema } from './datasources';
import { ReportBandsSchema } from './bands';

export const CURRENT_SCHEMA_VERSION = '1.0.0';

export const ReportMetadataSchema = z.object({
  author: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  tags: z.array(z.string()).default([]),
  version: z.string().default('1.0.0')
});
export type ReportMetadata = z.infer<typeof ReportMetadataSchema>;

export const ReportDefinitionSchema = z.object({
  schemaVersion: z.string().default(CURRENT_SCHEMA_VERSION),
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  page: PageConfigSchema.default({}),
  parameters: z.array(ParameterDefinitionSchema).default([]),
  dataSources: z.array(DataSourceDefinitionSchema).default([]),
  datasets: z.array(DatasetDefinitionSchema).default([]),
  bands: ReportBandsSchema,
  metadata: ReportMetadataSchema.default({})
});
export type ReportDefinition = z.infer<typeof ReportDefinitionSchema>;
