import { z } from 'zod';

export const UnitSchema = z.enum(['pt', 'mm', 'in', 'px']);
export type Unit = z.infer<typeof UnitSchema>;

export const PageSizeSchema = z.enum(['A4', 'A3', 'Letter', 'Legal', 'Custom']);
export type PageSize = z.infer<typeof PageSizeSchema>;

export const PageOrientationSchema = z.enum(['portrait', 'landscape']);
export type PageOrientation = z.infer<typeof PageOrientationSchema>;

export const MarginsSchema = z.object({
  top: z.number().nonnegative(),
  right: z.number().nonnegative(),
  bottom: z.number().nonnegative(),
  left: z.number().nonnegative()
});
export type Margins = z.infer<typeof MarginsSchema>;

export const PageConfigSchema = z.object({
  size: PageSizeSchema.default('A4'),
  orientation: PageOrientationSchema.default('portrait'),
  margins: MarginsSchema.default({ top: 36, right: 36, bottom: 36, left: 36 }), // 0.5 in default
  unit: UnitSchema.default('pt'),
  customWidth: z.number().positive().optional(),
  customHeight: z.number().positive().optional(),
  backgroundColor: z.string().optional()
});
export type PageConfig = z.infer<typeof PageConfigSchema>;

export const STANDARD_PAGE_SIZES_PT: Record<Exclude<PageSize, 'Custom'>, { width: number; height: number }> = {
  A4: { width: 595.28, height: 841.89 },
  A3: { width: 841.89, height: 1190.55 },
  Letter: { width: 612.0, height: 792.0 },
  Legal: { width: 612.0, height: 1008.0 }
};

export const UNIT_CONVERSIONS_TO_PT: Record<Unit, number> = {
  pt: 1.0,
  mm: 72.0 / 25.4, // ~2.83464567 pt
  in: 72.0,
  px: 72.0 / 96.0 // 0.75 pt
};

export function convertToPt(value: number, unit: Unit): number {
  return value * (UNIT_CONVERSIONS_TO_PT[unit] || 1);
}

export function convertFromPt(valueInPt: number, targetUnit: Unit): number {
  return valueInPt / (UNIT_CONVERSIONS_TO_PT[targetUnit] || 1);
}

export function getPageDimensionsPt(page: PageConfig): { width: number; height: number } {
  let baseWidth: number;
  let baseHeight: number;

  if (page.size === 'Custom') {
    baseWidth = convertToPt(page.customWidth || 595.28, page.unit);
    baseHeight = convertToPt(page.customHeight || 841.89, page.unit);
  } else {
    const size = STANDARD_PAGE_SIZES_PT[page.size];
    baseWidth = size.width;
    baseHeight = size.height;
  }

  if (page.orientation === 'landscape') {
    return { width: Math.max(baseWidth, baseHeight), height: Math.min(baseWidth, baseHeight) };
  }
  return { width: Math.min(baseWidth, baseHeight), height: Math.max(baseWidth, baseHeight) };
}

export function getPrintableAreaPt(page: PageConfig): { width: number; height: number; top: number; left: number } {
  const { width, height } = getPageDimensionsPt(page);
  const top = convertToPt(page.margins.top, page.unit);
  const bottom = convertToPt(page.margins.bottom, page.unit);
  const left = convertToPt(page.margins.left, page.unit);
  const right = convertToPt(page.margins.right, page.unit);

  return {
    width: Math.max(0, width - left - right),
    height: Math.max(0, height - top - bottom),
    top,
    left
  };
}
