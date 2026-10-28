import { ZodError } from 'zod';
import { ReportDefinition, ReportDefinitionSchema } from './report';
import { getPrintableAreaPt } from './page';

export interface DiagnosticMessage {
  code: string;
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  data?: ReportDefinition;
  diagnostics: DiagnosticMessage[];
}

export function validateReportDefinition(input: unknown): ValidationResult {
  const diagnostics: DiagnosticMessage[] = [];

  const parseResult = ReportDefinitionSchema.safeParse(input);

  if (!parseResult.success) {
    const error: ZodError = parseResult.error;
    for (const issue of error.issues) {
      diagnostics.push({
        code: `SCHEMA_${issue.code.toUpperCase()}`,
        path: issue.path.join('.') || 'root',
        message: issue.message,
        severity: 'error'
      });
    }
    return {
      valid: false,
      diagnostics
    };
  }

  const report = parseResult.data;

  // Semantic Validation Rules
  const dataSourceIds = new Set(report.dataSources.map((ds) => ds.id));
  const datasetIds = new Set(report.datasets.map((d) => d.id));

  // 1. Verify Dataset Data Sources exist
  for (const dataset of report.datasets) {
    if (!dataSourceIds.has(dataset.dataSourceId)) {
      diagnostics.push({
        code: 'MISSING_DATA_SOURCE',
        path: `datasets.${dataset.id}.dataSourceId`,
        message: `Dataset "${dataset.id}" references non-existent data source "${dataset.dataSourceId}".`,
        severity: 'error'
      });
    }
  }

  // 2. Verify Printable Area bounds
  const printableArea = getPrintableAreaPt(report.page);
  const checkElementBounds = (el: { id: string; x: number; width: number }, bandPath: string) => {
    if (el.x + el.width > printableArea.width + 5) {
      diagnostics.push({
        code: 'ELEMENT_OVERFLOW',
        path: `${bandPath}.${el.id}`,
        message: `Element "${el.id}" (x: ${el.x}, width: ${el.width}) exceeds printable width (${Math.round(printableArea.width)} pt).`,
        severity: 'warning'
      });
    }
  };

  const allBands = [
    { band: report.bands.reportHeader, path: 'bands.reportHeader' },
    { band: report.bands.pageHeader, path: 'bands.pageHeader' },
    { band: report.bands.detail, path: 'bands.detail' },
    { band: report.bands.reportFooter, path: 'bands.reportFooter' },
    { band: report.bands.pageFooter, path: 'bands.pageFooter' },
    ...report.bands.groupHeaders.map((b, i) => ({ band: b, path: `bands.groupHeaders[${i}]` })),
    ...report.bands.groupFooters.map((b, i) => ({ band: b, path: `bands.groupFooters[${i}]` }))
  ];

  for (const { band, path } of allBands) {
    if (!band) continue;
    for (const el of band.elements) {
      checkElementBounds(el, path);

      // Check table / chart dataset references
      if ('datasetId' in el && el.datasetId) {
        if (!datasetIds.has(el.datasetId)) {
          diagnostics.push({
            code: 'MISSING_DATASET',
            path: `${path}.${el.id}.datasetId`,
            message: `Element "${el.id}" references non-existent dataset "${el.datasetId}".`,
            severity: 'error'
          });
        }
      }
    }
  }

  const hasErrors = diagnostics.some((d) => d.severity === 'error');

  return {
    valid: !hasErrors,
    data: report,
    diagnostics
  };
}
