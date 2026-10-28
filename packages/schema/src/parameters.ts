import { z } from 'zod';

export const ParameterTypeSchema = z.enum(['string', 'number', 'boolean', 'date', 'select']);
export type ParameterType = z.infer<typeof ParameterTypeSchema>;

export const ParameterOptionSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()])
});
export type ParameterOption = z.infer<typeof ParameterOptionSchema>;

export const ParameterDefinitionSchema = z.object({
  name: z.string().min(1).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
    message: 'Parameter name must start with a letter or underscore and contain only alphanumeric characters'
  }),
  type: ParameterTypeSchema.default('string'),
  label: z.string().optional(),
  description: z.string().optional(),
  defaultValue: z.any().optional(),
  options: z.array(ParameterOptionSchema).optional(),
  required: z.boolean().default(false),
  visible: z.boolean().default(true)
});
export type ParameterDefinition = z.infer<typeof ParameterDefinitionSchema>;
