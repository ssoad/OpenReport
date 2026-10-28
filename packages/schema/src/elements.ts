import { z } from 'zod';

export const TextAlignSchema = z.enum(['left', 'center', 'right', 'justify']);
export type TextAlign = z.infer<typeof TextAlignSchema>;

export const VerticalAlignSchema = z.enum(['top', 'middle', 'bottom']);
export type VerticalAlign = z.infer<typeof VerticalAlignSchema>;

export const BorderStyleSchema = z.enum(['none', 'solid', 'dashed', 'dotted']);
export type BorderStyle = z.infer<typeof BorderStyleSchema>;

export const BorderSideSchema = z.object({
  width: z.number().nonnegative().default(1),
  color: z.string().default('#cbd5e1'),
  style: BorderStyleSchema.default('solid')
});
export type BorderSide = z.infer<typeof BorderSideSchema>;

export const BordersSchema = z.object({
  top: BorderSideSchema.optional(),
  right: BorderSideSchema.optional(),
  bottom: BorderSideSchema.optional(),
  left: BorderSideSchema.optional(),
  all: BorderSideSchema.optional()
});
export type Borders = z.infer<typeof BordersSchema>;

export const PaddingSchema = z.object({
  top: z.number().nonnegative().default(0),
  right: z.number().nonnegative().default(0),
  bottom: z.number().nonnegative().default(0),
  left: z.number().nonnegative().default(0)
});
export type Padding = z.infer<typeof PaddingSchema>;

export const FontStyleSchema = z.object({
  family: z.string().default('Helvetica, Arial, sans-serif'),
  size: z.number().positive().default(10),
  weight: z.enum(['normal', 'bold', '500', '600', '700']).default('normal'),
  italic: z.boolean().default(false),
  color: z.string().default('#0f172a'),
  align: TextAlignSchema.default('left'),
  verticalAlign: VerticalAlignSchema.default('top'),
  lineHeight: z.number().positive().default(1.2)
});
export type FontStyle = z.infer<typeof FontStyleSchema>;

export const FormatTypeSchema = z.enum(['text', 'number', 'currency', 'percent', 'date']);
export type FormatType = z.infer<typeof FormatTypeSchema>;

export const ValueFormatSchema = z.object({
  type: FormatTypeSchema.default('text'),
  pattern: z.string().optional(), // e.g. "0,0.00" or "YYYY-MM-DD"
  currencyCode: z.string().default('USD').optional(),
  decimals: z.number().int().min(0).max(10).optional()
});
export type ValueFormat = z.infer<typeof ValueFormatSchema>;

// Base Element
export const BaseElementSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  x: z.number(), // in points or report units
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  visibleExpression: z.string().optional(),
  locked: z.boolean().default(false)
});

// Text Element
export const TextElementSchema = BaseElementSchema.extend({
  type: z.literal('text'),
  text: z.string().default(''), // literal text or expression starting with '='
  font: FontStyleSchema.default({}),
  format: ValueFormatSchema.optional(),
  backgroundColor: z.string().optional(),
  borders: BordersSchema.optional(),
  padding: PaddingSchema.default({ top: 2, right: 4, bottom: 2, left: 4 }),
  wrapText: z.boolean().default(true),
  canGrow: z.boolean().default(true),
  canShrink: z.boolean().default(false)
});
export type TextElement = z.infer<typeof TextElementSchema>;

// Table Column
export const TableColumnSchema = z.object({
  id: z.string().min(1),
  field: z.string().min(1), // field name or expression
  title: z.string().default(''),
  width: z.number().positive(),
  align: TextAlignSchema.default('left'),
  headerAlign: TextAlignSchema.default('left'),
  format: ValueFormatSchema.optional(),
  visible: z.boolean().default(true),
  summary: z.enum(['none', 'sum', 'avg', 'count', 'min', 'max']).default('none')
});
export type TableColumn = z.infer<typeof TableColumnSchema>;

// Table Element
export const TableElementSchema = BaseElementSchema.extend({
  type: z.literal('table'),
  datasetId: z.string().min(1),
  columns: z.array(TableColumnSchema).min(1),
  showHeader: z.boolean().default(true),
  showSummary: z.boolean().default(false),
  alternatingRowColors: z.boolean().default(true),
  headerHeight: z.number().positive().default(24),
  rowHeight: z.number().positive().default(20),
  summaryHeight: z.number().positive().default(24),
  headerFont: FontStyleSchema.default({ weight: 'bold', size: 10, color: '#334155' }),
  rowFont: FontStyleSchema.default({ size: 9, color: '#0f172a' }),
  summaryFont: FontStyleSchema.default({ weight: 'bold', size: 9, color: '#0f172a' }),
  headerBackgroundColor: z.string().default('#f1f5f9'),
  alternatingBackgroundColor: z.string().default('#f8fafc'),
  summaryBackgroundColor: z.string().default('#e2e8f0'),
  borders: BordersSchema.optional(),
  cellPadding: PaddingSchema.default({ top: 3, right: 6, bottom: 3, left: 6 })
});
export type TableElement = z.infer<typeof TableElementSchema>;

// Image Element
export const ImageElementSchema = BaseElementSchema.extend({
  type: z.literal('image'),
  url: z.string().min(1), // HTTP url or data:image/... URI
  sizing: z.enum(['fit', 'fill', 'contain', 'original']).default('contain'),
  align: TextAlignSchema.default('center'),
  verticalAlign: VerticalAlignSchema.default('middle'),
  borders: BordersSchema.optional()
});
export type ImageElement = z.infer<typeof ImageElementSchema>;

// Line Element
export const LineElementSchema = BaseElementSchema.extend({
  type: z.literal('line'),
  strokeWidth: z.number().positive().default(1),
  strokeColor: z.string().default('#94a3b8'),
  style: BorderStyleSchema.default('solid'),
  orientation: z.enum(['horizontal', 'vertical', 'diagonal']).default('horizontal')
});
export type LineElement = z.infer<typeof LineElementSchema>;

// Rectangle Element
export const RectElementSchema = BaseElementSchema.extend({
  type: z.literal('rect'),
  strokeWidth: z.number().nonnegative().default(1),
  strokeColor: z.string().default('#cbd5e1'),
  fillColor: z.string().optional(),
  borderRadius: z.number().nonnegative().default(0),
  style: BorderStyleSchema.default('solid')
});
export type RectElement = z.infer<typeof RectElementSchema>;

// Barcode & QR Element
export const BarcodeElementSchema = BaseElementSchema.extend({
  type: z.literal('barcode'),
  format: z.enum(['qr', 'code128', 'ean13']).default('qr'),
  valueExpression: z.string().min(1),
  color: z.string().default('#000000'),
  backgroundColor: z.string().default('#ffffff'),
  includeText: z.boolean().default(true)
});
export type BarcodeElement = z.infer<typeof BarcodeElementSchema>;

// Chart Element
export const ChartElementSchema = BaseElementSchema.extend({
  type: z.literal('chart'),
  chartType: z.enum(['bar', 'column', 'line', 'area', 'pie', 'donut']).default('bar'),
  datasetId: z.string().min(1),
  categoryField: z.string().min(1),
  valueField: z.string().min(1),
  seriesField: z.string().optional(),
  title: z.string().optional(),
  colors: z.array(z.string()).default(['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']),
  showLegend: z.boolean().default(true),
  showLabels: z.boolean().default(false)
});
export type ChartElement = z.infer<typeof ChartElementSchema>;

// KPI Card Element
export const KpiElementSchema = BaseElementSchema.extend({
  type: z.literal('kpi'),
  title: z.string().default('KPI Metric'),
  valueExpression: z.string().min(1),
  subtitle: z.string().optional(),
  changeExpression: z.string().optional(), // e.g. "+14.2%"
  trend: z.enum(['up', 'down', 'neutral']).default('neutral'),
  accentColor: z.string().default('#2563eb'),
  format: ValueFormatSchema.optional()
});
export type KpiElement = z.infer<typeof KpiElementSchema>;

// Subreport Element
export const SubreportElementSchema = BaseElementSchema.extend({
  type: z.literal('subreport'),
  reportId: z.string().min(1),
  parameterBindings: z.record(z.string()).optional() // targetParam -> current expression
});
export type SubreportElement = z.infer<typeof SubreportElementSchema>;

// Discriminated Union of All Elements
export const ReportElementSchema = z.discriminatedUnion('type', [
  TextElementSchema,
  TableElementSchema,
  ImageElementSchema,
  LineElementSchema,
  RectElementSchema,
  BarcodeElementSchema,
  ChartElementSchema,
  KpiElementSchema,
  SubreportElementSchema
]);
export type ReportElement = z.infer<typeof ReportElementSchema>;
export type ReportElementType = ReportElement['type'];
