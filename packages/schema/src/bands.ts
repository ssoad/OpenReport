import { z } from 'zod';
import { ReportElementSchema } from './elements';

export const BandTypeSchema = z.enum([
  'reportHeader',
  'pageHeader',
  'groupHeader',
  'detail',
  'groupFooter',
  'reportFooter',
  'pageFooter'
]);
export type BandType = z.infer<typeof BandTypeSchema>;

export const BaseBandSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  type: BandTypeSchema,
  height: z.number().nonnegative(),
  elements: z.array(ReportElementSchema).default([]),
  keepTogether: z.boolean().default(false),
  canGrow: z.boolean().default(true),
  canShrink: z.boolean().default(false),
  visibleExpression: z.string().optional(),
  backgroundColor: z.string().optional()
});

export const GroupHeaderBandSchema = BaseBandSchema.extend({
  type: z.literal('groupHeader'),
  datasetId: z.string().min(1),
  groupByField: z.string().min(1),
  repeatOnEveryPage: z.boolean().default(false)
});
export type GroupHeaderBand = z.infer<typeof GroupHeaderBandSchema>;

export const GroupFooterBandSchema = BaseBandSchema.extend({
  type: z.literal('groupFooter'),
  datasetId: z.string().min(1),
  groupByField: z.string().min(1)
});
export type GroupFooterBand = z.infer<typeof GroupFooterBandSchema>;

export const StandardBandSchema = BaseBandSchema.extend({
  type: z.enum(['reportHeader', 'pageHeader', 'detail', 'reportFooter', 'pageFooter'])
});
export type StandardBand = z.infer<typeof StandardBandSchema>;

export const BandSchema = z.discriminatedUnion('type', [
  GroupHeaderBandSchema,
  GroupFooterBandSchema,
  StandardBandSchema
]);
export type Band = z.infer<typeof BandSchema>;

export const ReportBandsSchema = z.object({
  reportHeader: StandardBandSchema.optional(),
  pageHeader: StandardBandSchema.optional(),
  groupHeaders: z.array(GroupHeaderBandSchema).default([]),
  detail: StandardBandSchema.default({
    id: 'detail-band',
    type: 'detail',
    height: 100,
    elements: [],
    keepTogether: false,
    canGrow: true,
    canShrink: false
  }),
  groupFooters: z.array(GroupFooterBandSchema).default([]),
  reportFooter: StandardBandSchema.optional(),
  pageFooter: StandardBandSchema.optional()
});
export type ReportBands = z.infer<typeof ReportBandsSchema>;
